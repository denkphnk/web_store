from fastapi import APIRouter, HTTPException, status

from app.core.admin_auth import (
    AdminAuthConfigurationError,
    InvalidAdminCredentials,
    issue_admin_token,
)
from app.core.config import ADMIN_TOKEN_TTL_SECONDS
from app.schemas.admin import AdminLoginInput, AdminTokenRead

router = APIRouter(prefix="/api/v1/admin/auth", tags=["admin-auth"])


@router.post("/login", response_model=AdminTokenRead)
def login(request: AdminLoginInput) -> AdminTokenRead:
    try:
        token = issue_admin_token(request.username, request.password)
    except AdminAuthConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin authentication is not configured.",
        ) from error
    except InvalidAdminCredentials as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    return AdminTokenRead(
        access_token=token,
        expires_in=ADMIN_TOKEN_TTL_SECONDS,
    )
