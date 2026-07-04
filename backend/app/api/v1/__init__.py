"""Version 1 API Routers.

Exposes REST endpoint groups representing the core functionality of NOVA V1.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.browser import router as browser_router
from app.api.v1.planner import router as planner_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.users import router as users_router

v1_router = APIRouter()
v1_router.include_router(auth_router)
v1_router.include_router(users_router)
v1_router.include_router(tasks_router)
v1_router.include_router(planner_router)
v1_router.include_router(browser_router)

__all__ = ["v1_router"]
