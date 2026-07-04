"""Main entrypoint of the NOVA backend application.

Defines the FastAPI application factory, handles lifespan management, registers
middlewares (CORS, structured logging, rate limiting), exception handlers,
and base health routes.
"""

import json
import os
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.api.v1 import v1_router
from app.core.config import get_settings
from app.core.exceptions import NovaException
from app.core.logging import get_logger, request_id_var, setup_logging
from app.database.client import check_connectivity
from app.database.connection import close_mongo_connection, connect_to_mongo

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Middlewares
# ---------------------------------------------------------------------------


class RequestLoggerMiddleware:
    """ASGI middleware to inject request IDs and perform structured logging."""

    def __init__(self, app: ASGIApp) -> None:
        """Initialize the request logger middleware.

        Args:
            app: The underlying ASGI application.
        """
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Process incoming requests and log details.

        Args:
            scope: The connection scope.
            receive: Receive channel.
            send: Send channel.
        """
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Fetch or generate request ID
        headers = scope.get("headers", [])
        request_id = ""
        for key, value in headers:
            if key == b"x-request-id":
                request_id = value.decode("utf-8")
                break

        if not request_id:
            request_id = str(uuid.uuid4())

        token = request_id_var.set(request_id)
        start_time = time.perf_counter()
        status_code = [200]

        async def send_wrapper(message: Message) -> None:
            if message["type"] == "http.response.start":
                status_code[0] = message["status"]
                headers_list = list(message.get("headers", []))
                headers_list.append((b"x-request-id", request_id.encode("utf-8")))
                message["headers"] = headers_list
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration = (time.perf_counter() - start_time) * 1000
            logger.info(
                f"Request finished: {scope.get('method')} {scope.get('path')} "
                f"- Status: {status_code[0]} - Duration: {duration:.2f}ms",
                extra={
                    "method": scope.get("method"),
                    "path": scope.get("path"),
                    "status_code": status_code[0],
                    "duration_ms": duration,
                },
            )
            request_id_var.reset(token)


class RateLimiterMiddleware:
    """In-memory client-ip token-bucket rate limiter middleware."""

    def __init__(self, app: ASGIApp, rate_limit: int) -> None:
        """Initialize the rate limiter.

        Args:
            app: The underlying ASGI application.
            rate_limit: The maximum allowed requests per minute.
        """
        self.app = app
        self.rate_limit = rate_limit
        self.requests: dict[str, list[float]] = {}

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Apply rate limiting checks.

        Args:
            scope: The connection scope.
            receive: Receive channel.
            send: Send channel.
        """
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        client = scope.get("client")
        client_ip = client[0] if client else "unknown"
        now = time.time()

        # Evict timestamps older than 60 seconds
        client_requests = self.requests.get(client_ip, [])
        client_requests = [t for t in client_requests if now - t < 60]
        self.requests[client_ip] = client_requests

        if len(client_requests) >= self.rate_limit:
            response_body = json.dumps(
                {
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please try again later.",
                    },
                }
            ).encode("utf-8")

            await send(
                {
                    "type": "http.response.start",
                    "status": 429,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"content-length", str(len(response_body)).encode("utf-8")),
                    ],
                }
            )
            await send(
                {
                    "type": "http.response.body",
                    "body": response_body,
                    "more_body": False,
                }
            )
            return

        client_requests.append(now)
        await self.app(scope, receive, send)


# ---------------------------------------------------------------------------
# Lifespan Management
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Lifespan event manager handling application startup and shutdown.

    Args:
        app: The FastAPI application instance.
    """
    settings = get_settings()
    setup_logging(level=settings.LOG_LEVEL, log_format=settings.LOG_FORMAT)
    logger.info(f"Starting {settings.APP_NAME} in environment: {settings.APP_ENV}")

    # Startup database connection client setup
    await connect_to_mongo()

    yield

    # Shutdown database connection cleanup
    await close_mongo_connection()
    logger.info(f"Shutting down {settings.APP_NAME}")


# ---------------------------------------------------------------------------
# App Factory
# ---------------------------------------------------------------------------


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance.

    Returns:
        FastAPI: The configured FastAPI application.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    # 1. Register CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 2. Register Rate Limiting Middleware
    app.add_middleware(
        RateLimiterMiddleware,
        rate_limit=settings.RATE_LIMIT_PER_MINUTE,
    )

    # 3. Register Request Logging Middleware
    app.add_middleware(RequestLoggerMiddleware)

    # 4. Exception Handlers
    @app.exception_handler(NovaException)
    async def nova_exception_handler(
        request: Request, exc: NovaException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                },
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception("An unhandled exception occurred")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                },
            },
        )

    # 5. Base Routes
    @app.get("/", response_model=None)
    async def get_root() -> dict[str, Any]:
        """Root API endpoint returning basic metadata."""
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "running",
        }

    @app.get("/health", response_model=None)
    async def get_health() -> dict[str, Any]:
        """Application health check target."""
        db_connected = await check_connectivity()
        return {
            "status": "healthy" if db_connected else "degraded",
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
            "database": "connected" if db_connected else "disconnected",
        }

    # 6. Mount API Version 1 Routers
    app.include_router(v1_router, prefix="/api/v1")

    # 7. Mount Static Workspace Files for Screenshots/Downloads
    os.makedirs("workspace", exist_ok=True)
    app.mount("/workspace", StaticFiles(directory="workspace"), name="workspace")

    return app


# Root application instance
app = create_app()
