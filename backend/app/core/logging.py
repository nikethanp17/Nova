"""Structured JSON Logging module.

Formats logs in JSON for production/Docker environments, and maintains
human-readable text formats during local development. Extracted request IDs
are bound via ContextVars.
"""

import contextvars
import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any

# Context variable to hold the request ID for tracing across async calls
request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "request_id", default=""
)


class StructuredJSONFormatter(logging.Formatter):
    """Custom formatter to output logs in a structured JSON format."""

    def format(self, record: logging.LogRecord) -> str:
        """Format the log record into a structured JSON string.

        Args:
            record: The LogRecord instance to format.

        Returns:
            str: JSON-serialized log data.
        """
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "request_id": request_id_var.get(),
            "module": record.module,
            "filename": record.filename,
            "line_number": record.lineno,
        }

        # Include traceback details if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


class CustomTextFormatter(logging.Formatter):
    """Custom formatter to output human-readable logs containing request IDs."""

    def format(self, record: logging.LogRecord) -> str:
        """Injects request_id dynamically from contextvars prior to formatting.

        Args:
            record: The LogRecord instance to format.

        Returns:
            str: Formatted text output.
        """
        record.request_id = request_id_var.get() or "none"
        return super().format(record)


def get_logger(name: str) -> logging.Logger:
    """Utility function to retrieve an configured logger.

    Args:
        name: Name of the logger, typically __name__.

    Returns:
        logging.Logger: The configured Logger instance.
    """
    return logging.getLogger(name)


def setup_logging(level: str = "INFO", log_format: str = "json") -> None:
    """Configures the root logging handler and formatting pipeline.

    Args:
        level: Logger verbosity level (e.g. "DEBUG", "INFO").
        log_format: Format selector ("json" or "text").
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove default handlers to prevent duplication
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler(sys.stdout)

    if log_format.lower() == "json":
        handler.setFormatter(StructuredJSONFormatter())
    else:
        # Standard human-readable console formatter
        text_fmt = (
            "%(asctime)s [%(levelname)s] [%(name)s] "
            "[req_id: %(request_id)s] %(message)s"
        )
        handler.setFormatter(CustomTextFormatter(fmt=text_fmt))

    root_logger.addHandler(handler)
