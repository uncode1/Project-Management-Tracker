"""Authentication endpoints."""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError

from app.extensions import db, jwt, limiter
from app.models import Tenant, User
from app.schemas.auth import AuthResponse, LoginSchema, RegisterSchema, TokenResponse, UserResponse
from app.services.security import hash_password, issue_tokens, revoke_current_token, verify_password
from app.utils.responses import error_response

bp = Blueprint("auth", __name__)


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    from app.models import RefreshToken

    jti = jwt_payload.get("jti")
    token = RefreshToken.query.filter_by(jti=jti).first()
    return token is None or token.revoked_at is not None


@bp.post("/register")
@limiter.limit("10/hour")
def register():
    payload = RegisterSchema.model_validate(request.get_json(silent=True) or {})

    tenant_name = payload.tenant_name or f"{payload.full_name.split()[0]}'s Workspace"
    tenant = Tenant.query.filter_by(name=tenant_name).first()
    if tenant is None:
        tenant = Tenant(name=tenant_name)
        db.session.add(tenant)
        db.session.flush()

    user = User(
        tenant_id=tenant.id,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role="owner" if tenant.users.count() == 0 else "member",
    )

    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response("Email already registered", 409)

    access_token, refresh_token = issue_tokens(user)
    response = AuthResponse(
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, role=user.role),
        tokens=TokenResponse(access_token=access_token, refresh_token=refresh_token),
    )
    return jsonify(response.model_dump()), 201


@bp.post("/login")
@limiter.limit("60/hour")
def login():
    payload = LoginSchema.model_validate(request.get_json(silent=True) or {})
    user = User.query.filter_by(email=payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        return error_response("Invalid credentials", 401)

    user.last_login_at = datetime.utcnow()
    db.session.commit()

    access_token, refresh_token = issue_tokens(user)
    response = AuthResponse(
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, role=user.role),
        tokens=TokenResponse(access_token=access_token, refresh_token=refresh_token),
    )
    return jsonify(response.model_dump()), 200


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    access_token, refresh_token = issue_tokens(user)
    response = TokenResponse(access_token=access_token, refresh_token=refresh_token)
    return jsonify(response.model_dump()), 200


@bp.post("/logout")
@jwt_required(refresh=True)
def logout():
    revoke_current_token()
    return jsonify({"status": "logged out"}), 200
