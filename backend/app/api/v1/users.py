"""User profile endpoints.

Exposes protected routes for listing and modifying user records.
"""

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.schemas.common import ResponseEnvelope
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=ResponseEnvelope[UserResponse],
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
) -> ResponseEnvelope[UserResponse]:
    """Retrieve the profile data of the currently authenticated active user."""
    return ResponseEnvelope(
        success=True,
        data=UserResponse.model_validate(current_user),
        message="User profile retrieved successfully.",
    )
