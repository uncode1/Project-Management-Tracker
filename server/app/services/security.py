"""Security helper functions."""

from datetime import datetime, timedelta
from flask import current_app, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_jwt,
)
from passlib.context import CryptContext

from app.extensions import db
from app.models import RefreshToken, User

_pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return _pwd_context.verify(password, hashed)


def issue_tokens(user: User) -> tuple[str, str]:
    additional_claims = {"role": user.role, "tenant_id": user.tenant_id}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)
    persist_refresh_token(user, refresh_token)
    return access_token, refresh_token


def persist_refresh_token(user: User, raw_token: str) -> None:
    expires_delta: timedelta = current_app.config["REFRESH_TOKEN_EXPIRES"]
    decoded = decode_token(raw_token)
    token = RefreshToken(
        user_id=user.id,
        jti=decoded["jti"],
        expires_at=datetime.utcnow() + expires_delta,
        ip_address=request.remote_addr,
        user_agent=request.headers.get("User-Agent"),
    )
    db.session.add(token)
    db.session.commit()


def revoke_current_token() -> None:
    jwt_data = get_jwt()
    jti = jwt_data.get("jti")
    token = RefreshToken.query.filter_by(jti=jti).first()
    if token:
        token.revoked_at = datetime.utcnow()
        db.session.commit()
