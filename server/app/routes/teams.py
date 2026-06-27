"""Team management endpoints."""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Team, User
from app.schemas.team import (
    TeamCreateSchema,
    TeamMemberAssignSchema,
    TeamResponse,
    TeamUpdateSchema,
)
from app.utils.auth import get_current_user
from app.utils.responses import error_response

bp = Blueprint("teams", __name__)


def _serialize_team(team: Team) -> dict:
    return TeamResponse(
        id=team.id,
        name=team.name,
        description=team.description,
        lead_user_id=team.lead_user_id,
        member_count=team.members.count(),
    ).model_dump()


@bp.get("/")
@jwt_required()
def list_teams():  # type: ignore[override]
    user = get_current_user()
    teams = (
        Team.query.filter_by(tenant_id=user.tenant_id)
        .filter(Team.deleted_at.is_(None))
        .order_by(Team.name.asc())
        .all()
    )
    return jsonify([_serialize_team(team) for team in teams]), 200


@bp.post("/")
@jwt_required()
def create_team():
    user = get_current_user()
    payload = TeamCreateSchema.model_validate(request.get_json(silent=True) or {})

    lead_user_id = payload.lead_user_id
    if lead_user_id is not None:
        lead_user = User.query.filter_by(id=lead_user_id, tenant_id=user.tenant_id).first()
        if lead_user is None:
            return error_response("Lead user not found", 404)

    team = Team(
        tenant_id=user.tenant_id,
        name=payload.name,
        description=payload.description,
        lead_user_id=payload.lead_user_id,
    )
    db.session.add(team)
    db.session.commit()

    return jsonify(_serialize_team(team)), 201


@bp.patch("/<int:team_id>")
@jwt_required()
def update_team(team_id: int):
    user = get_current_user()
    team = Team.query.filter_by(id=team_id, tenant_id=user.tenant_id, deleted_at=None).first()
    if team is None:
        return error_response("Team not found", 404)

    payload = TeamUpdateSchema.model_validate(request.get_json(silent=True) or {})

    if payload.name is not None:
        team.name = payload.name
    if payload.description is not None:
        team.description = payload.description
    if payload.lead_user_id is not None:
        lead_user = User.query.filter_by(id=payload.lead_user_id, tenant_id=user.tenant_id).first()
        if lead_user is None:
            return error_response("Lead user not found", 404)
        team.lead_user_id = payload.lead_user_id

    db.session.commit()
    return jsonify(_serialize_team(team)), 200


@bp.delete("/<int:team_id>")
@jwt_required()
def delete_team(team_id: int):
    user = get_current_user()
    team = Team.query.filter_by(id=team_id, tenant_id=user.tenant_id, deleted_at=None).first()
    if team is None:
        return error_response("Team not found", 404)

    team.deleted_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"status": "deleted"}), 200


@bp.post("/<int:team_id>/members")
@jwt_required()
def add_member(team_id: int):
    user = get_current_user()
    team = Team.query.filter_by(id=team_id, tenant_id=user.tenant_id, deleted_at=None).first()
    if team is None:
        return error_response("Team not found", 404)

    payload = TeamMemberAssignSchema.model_validate(request.get_json(silent=True) or {})
    member = User.query.filter_by(id=payload.user_id, tenant_id=user.tenant_id).first()
    if member is None:
        return error_response("User not found", 404)

    member.team_id = team.id
    db.session.commit()
    return jsonify({"status": "added"}), 200


@bp.delete("/<int:team_id>/members/<int:user_id>")
@jwt_required()
def remove_member(team_id: int, user_id: int):
    user = get_current_user()
    team = Team.query.filter_by(id=team_id, tenant_id=user.tenant_id, deleted_at=None).first()
    if team is None:
        return error_response("Team not found", 404)

    member = User.query.filter_by(id=user_id, tenant_id=user.tenant_id, team_id=team.id).first()
    if member is None:
        return error_response("User not found", 404)

    member.team_id = None
    db.session.commit()
    return jsonify({"status": "removed"}), 200
