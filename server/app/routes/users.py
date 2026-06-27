"""User-facing endpoints."""

import secrets

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import Team, User
from app.schemas.user import UserCreateSchema, UserDirectoryResponse, UserUpdateSchema
from app.services.security import hash_password
from app.utils.auth import get_current_user
from app.utils.responses import error_response

bp = Blueprint("users", __name__)


def _serialize_user(user: User) -> dict:
    return UserDirectoryResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        team_id=user.team_id,
    ).model_dump()


@bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify(_serialize_user(user)), 200


@bp.get("/")
@jwt_required()
def list_users():  # type: ignore[override]
    current_user = get_current_user()
    users = (
        User.query.filter_by(tenant_id=current_user.tenant_id)
        .order_by(User.full_name.asc())
        .all()
    )
    return jsonify([_serialize_user(user) for user in users]), 200


@bp.post("/")
@jwt_required()
def create_user():
    current_user = get_current_user()
    payload = UserCreateSchema.model_validate(request.get_json(silent=True) or {})

    existing = User.query.filter_by(
        tenant_id=current_user.tenant_id,
        email=payload.email.lower(),
    ).first()
    if existing is not None:
        return error_response("Email already registered in this workspace", 409)

    team_id = None
    if payload.team_id is not None:
        team = Team.query.filter_by(
            id=payload.team_id,
            tenant_id=current_user.tenant_id,
            deleted_at=None,
        ).first()
        if team is None:
            return error_response("Team not found", 404)
        team_id = team.id

    user = User(
        tenant_id=current_user.tenant_id,
        full_name=payload.full_name,
        email=payload.email.lower(),
        role=payload.role or "member",
        team_id=team_id,
        password_hash=hash_password(secrets.token_urlsafe(16)),
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response("Unable to create user", 400)

    return jsonify(_serialize_user(user)), 201


@bp.patch("/<int:user_id>")
@jwt_required()
def update_user(user_id: int):
    current_user = get_current_user()
    user = User.query.filter_by(id=user_id, tenant_id=current_user.tenant_id).first()
    if user is None:
        return error_response("User not found", 404)

    payload = UserUpdateSchema.model_validate(request.get_json(silent=True) or {})

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role

    if payload.team_id is not None:
        team = Team.query.filter_by(
            id=payload.team_id,
            tenant_id=current_user.tenant_id,
            deleted_at=None,
        ).first()
        if team is None:
            return error_response("Team not found", 404)
        user.team_id = team.id
    elif "team_id" in payload.model_fields_set:
        user.team_id = None

    db.session.commit()
    return jsonify(_serialize_user(user)), 200
