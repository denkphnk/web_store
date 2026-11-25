import base64
import binascii
import hashlib
import hmac
import json
import time
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import (
    ADMIN_PASSWORD,
    ADMIN_TOKEN_SECRET,
    ADMIN_TOKEN_TTL_SECONDS,
    ADMIN_USERNAME,
)

bearer_scheme = HTTPBearer(auto_error=False)


class AdminAuthConfigurationError(Exception):
    pass


class InvalidAdminCredentials(Exception):
    pass


class InvalidAdminToken(Exception):
    pass


def _validate_configuration() -> None:
    if (
        not ADMIN_USERNAME
        or len(ADMIN_USERNAME) > 100
        or len(ADMIN_PASSWORD) < 12
        or len(ADMIN_TOKEN_SECRET) < 32
        or ADMIN_TOKEN_TTL_SECONDS <= 0
    ):
        raise AdminAuthConfigurationError(
            "Admin authentication requires a username, a password of at least "
            "12 characters, a token secret of at least 32 characters, and a "
            "positive token lifetime."
        )


def issue_admin_token(username: str, password: str) -> str:
    _validate_configuration()
    username_matches = hmac.compare_digest(
        username.encode("utf-8"), ADMIN_USERNAME.encode("utf-8")
    )
    password_matches = hmac.compare_digest(
        password.encode("utf-8"), ADMIN_PASSWORD.encode("utf-8")
    )
    if not (username_matches and password_matches):
        raise InvalidAdminCredentials

    payload = json.dumps(
        {
            "sub": ADMIN_USERNAME,
            "exp": int(time.time()) + ADMIN_TOKEN_TTL_SECONDS,
        },
        separators=(",", ":"),
    ).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(payload).rstrip(b"=")
    signature = hmac.new(
        ADMIN_TOKEN_SECRET.encode("utf-8"),
        encoded_payload,
        hashlib.sha256,
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b"=")
    return f"{encoded_payload.decode()}.{encoded_signature.decode()}"


def verify_admin_token(token: str) -> str:
    _validate_configuration()
    if len(token) > 4096:
        raise InvalidAdminToken
    try:
        encoded_payload, encoded_signature = token.encode("ascii").split(b".", 1)
        signature = base64.urlsafe_b64decode(
            encoded_signature + b"=" * (-len(encoded_signature) % 4)
        )
        expected_signature = hmac.new(
            ADMIN_TOKEN_SECRET.encode("utf-8"),
            encoded_payload,
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(signature, expected_signature):
            raise InvalidAdminToken

        payload_bytes = base64.urlsafe_b64decode(
            encoded_payload + b"=" * (-len(encoded_payload) % 4)
        )
        payload = json.loads(payload_bytes)
    except (binascii.Error, UnicodeDecodeError, ValueError, json.JSONDecodeError) as error:
        raise InvalidAdminToken from error

    if (
        not isinstance(payload, dict)
        or payload.get("sub") != ADMIN_USERNAME
        or type(payload.get("exp")) is not int
        or payload["exp"] <= int(time.time())
    ):
        raise InvalidAdminToken
    return ADMIN_USERNAME


def require_admin(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
) -> str:
    try:
        _validate_configuration()
    except AdminAuthConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin authentication is not configured.",
        ) from error

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return verify_admin_token(credentials.credentials)
    except InvalidAdminToken as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
