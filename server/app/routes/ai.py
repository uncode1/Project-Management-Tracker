"""AI-powered insights endpoints."""

from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import joinedload

from app.models import Board, BoardList, Card
from app.services.ai import BoardStats, ai_service
from app.utils.auth import get_current_user
from app.utils.responses import error_response

bp = Blueprint("ai", __name__)


def _load_board_for_user(user, board_id: int | None) -> Board | None:
    query = (
        Board.query.options(joinedload(Board.lists).joinedload(BoardList.cards))
        .filter_by(tenant_id=user.tenant_id)
        .filter(Board.deleted_at.is_(None))
    )
    if board_id is not None:
        return query.filter(Board.id == board_id).first()
    return query.order_by(Board.created_at.asc()).first()


def _serialize_card(card: Card) -> dict:
    return {
        "id": card.id,
        "title": card.title,
        "status": card.status,
        "priority": card.priority,
        "assignee_id": card.assignee_id,
        "due_date": card.due_date.isoformat() if card.due_date else None,
    }


def _serialize_board(board: Board) -> tuple[dict, BoardStats]:
    iso_lists: list[dict] = []
    total_cards = 0
    overdue = 0
    completed = 0
    in_progress = 0
    backlog = 0

    now = datetime.utcnow()

    for board_list in sorted(board.lists, key=lambda l: l.position):
        cards = sorted(board_list.cards, key=lambda c: c.created_at)
        card_payloads = []
        for card in cards:
            total_cards += 1
            if card.due_date and card.due_date < now:
                overdue += 1
            if card.status and card.status.lower() in {"done", "complete", "completed"}:
                completed += 1
            elif card.status and card.status.lower() in {"in progress", "doing", "active"}:
                in_progress += 1
            else:
                backlog += 1
            card_payloads.append(_serialize_card(card))

        iso_lists.append(
            {
                "id": board_list.id,
                "title": board_list.title,
                "position": board_list.position,
                "cards": card_payloads,
            }
        )

    done_ratio = (completed / total_cards) if total_cards else 0

    stats = BoardStats(
        total_cards=total_cards,
        overdue_cards=overdue,
        completed_cards=completed,
        in_progress_cards=in_progress,
        backlog_cards=backlog,
        done_ratio=done_ratio,
        list_breakdown=[{"title": item["title"], "count": len(item["cards"])} for item in iso_lists],
        active_lists=len(iso_lists),
    )

    payload = {
        "id": board.id,
        "name": board.name,
        "description": board.description,
        "lists": iso_lists,
    }
    return payload, stats


@bp.post("/summary")
@jwt_required()
def summarize_board():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    board_id = payload.get("board_id")

    board = _load_board_for_user(user, board_id)
    if board is None:
        return error_response("Board not found", 404)

    board_payload, stats = _serialize_board(board)
    summary = ai_service.summarize_board(board_payload, stats)

    return (
        jsonify(
            {
                "board_id": board.id,
                "generated_at": datetime.utcnow().isoformat() + "Z",
                **summary,
            }
        ),
        200,
    )


@bp.post("/prompts")
@jwt_required()
def prompt_ideas():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    prompt = (payload.get("prompt") or "").strip()
    board_id = payload.get("board_id")

    if not prompt:
        return error_response("Prompt is required", 400)

    board = _load_board_for_user(user, board_id)
    if board is None:
        return error_response("Board not found", 404)

    board_payload, stats = _serialize_board(board)
    ideas = ai_service.suggest_tasks(prompt, stats, board_payload)

    return (
        jsonify(
            {
                "board_id": board.id,
                "prompt": prompt,
                "generated_at": datetime.utcnow().isoformat() + "Z",
                **ideas,
            }
        ),
        200,
    )


__all__ = ["bp"]
