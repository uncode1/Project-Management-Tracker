"""Board, list, and card endpoints."""

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models import Board, BoardList, Card
from app.schemas.board import (
    BoardCreateSchema,
    BoardResponse,
    BoardUpdateSchema,
    CardCreateSchema,
    CardResponse,
    CardUpdateSchema,
    ListCreateSchema,
    ListResponse,
    ListUpdateSchema,
)
from app.utils.auth import get_current_user
from app.utils.responses import error_response

bp = Blueprint("boards", __name__)


def _serialize_card(card: Card) -> dict:
    return CardResponse(
        id=card.id,
        board_id=card.board_id,
        list_id=card.list_id,
        title=card.title,
        description=card.description,
        due_date=card.due_date,
        priority=card.priority,
        status=card.status,
        assignee_id=card.assignee_id,
        reporter_id=card.reporter_id,
    ).model_dump(mode="json")


def _serialize_list(board_list: BoardList) -> dict:
    cards = sorted(board_list.cards, key=lambda c: c.created_at)
    return ListResponse(
        id=board_list.id,
        board_id=board_list.board_id,
        title=board_list.title,
        position=board_list.position,
        cards=[_serialize_card(card) for card in cards],
    ).model_dump(mode="json")


def _serialize_board(board: Board, include_children: bool = True) -> dict:
    lists_data = []
    if include_children:
        ordered_lists = sorted(board.lists, key=lambda l: l.position)
        lists_data = [_serialize_list(board_list) for board_list in ordered_lists]

    return BoardResponse(
        id=board.id,
        name=board.name,
        description=board.description,
        visibility=board.visibility,
        lists=lists_data,
    ).model_dump(mode="json")


def _query_board_for_user(board_id: int, tenant_id: int):
    return (
        Board.query.options(joinedload(Board.lists).joinedload(BoardList.cards))
        .filter_by(id=board_id, tenant_id=tenant_id)
        .filter(Board.deleted_at.is_(None))
        .first()
    )


@bp.get("/")
@jwt_required()
def list_boards():  # type: ignore[override]
    user = get_current_user()
    boards = (
        Board.query.options(joinedload(Board.lists))
        .filter_by(tenant_id=user.tenant_id)
        .filter(Board.deleted_at.is_(None))
        .order_by(Board.name.asc())
        .all()
    )
    return jsonify([_serialize_board(board, include_children=False) for board in boards]), 200


@bp.post("/")
@jwt_required()
def create_board():
    user = get_current_user()
    payload = BoardCreateSchema.model_validate(request.get_json(silent=True) or {})

    board = Board(
        tenant_id=user.tenant_id,
        owner_id=user.id,
        name=payload.name,
        description=payload.description,
        visibility=payload.visibility or "private",
    )
    db.session.add(board)
    db.session.commit()

    return jsonify(_serialize_board(board, include_children=False)), 201


@bp.get("/<int:board_id>")
@jwt_required()
def get_board(board_id: int):
    user = get_current_user()
    board = _query_board_for_user(board_id, user.tenant_id)
    if board is None:
        return error_response("Board not found", 404)
    return jsonify(_serialize_board(board)), 200


@bp.patch("/<int:board_id>")
@jwt_required()
def update_board(board_id: int):
    user = get_current_user()
    board = Board.query.filter_by(
        id=board_id, tenant_id=user.tenant_id, deleted_at=None
    ).first()
    if board is None:
        return error_response("Board not found", 404)

    payload = BoardUpdateSchema.model_validate(request.get_json(silent=True) or {})
    if payload.name is not None:
        board.name = payload.name
    if payload.description is not None:
        board.description = payload.description
    if payload.visibility is not None:
        board.visibility = payload.visibility

    db.session.commit()
    return jsonify(_serialize_board(board, include_children=False)), 200


@bp.delete("/<int:board_id>")
@jwt_required()
def delete_board(board_id: int):
    user = get_current_user()
    board = Board.query.filter_by(
        id=board_id, tenant_id=user.tenant_id, deleted_at=None
    ).first()
    if board is None:
        return error_response("Board not found", 404)

    board.deleted_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"status": "deleted"}), 200


@bp.post("/<int:board_id>/lists")
@jwt_required()
def create_list(board_id: int):
    user = get_current_user()
    board = Board.query.filter_by(
        id=board_id, tenant_id=user.tenant_id, deleted_at=None
    ).first()
    if board is None:
        return error_response("Board not found", 404)

    payload = ListCreateSchema.model_validate(request.get_json(silent=True) or {})
    position = payload.position if payload.position is not None else board.lists.__len__()

    board_list = BoardList(board_id=board.id, title=payload.title, position=position)
    db.session.add(board_list)
    db.session.commit()

    return jsonify(_serialize_list(board_list)), 201


@bp.patch("/lists/<int:list_id>")
@jwt_required()
def update_list(list_id: int):
    user = get_current_user()
    board_list = (
        BoardList.query.join(Board)
        .filter(BoardList.id == list_id)
        .filter(Board.tenant_id == user.tenant_id)
        .filter(Board.deleted_at.is_(None))
        .first()
    )
    if board_list is None:
        return error_response("List not found", 404)

    payload = ListUpdateSchema.model_validate(request.get_json(silent=True) or {})
    if payload.title is not None:
        board_list.title = payload.title
    if payload.position is not None:
        board_list.position = payload.position

    db.session.commit()
    return jsonify(_serialize_list(board_list)), 200


@bp.delete("/lists/<int:list_id>")
@jwt_required()
def delete_list(list_id: int):
    user = get_current_user()
    board_list = (
        BoardList.query.join(Board)
        .filter(BoardList.id == list_id)
        .filter(Board.tenant_id == user.tenant_id)
        .filter(Board.deleted_at.is_(None))
        .first()
    )
    if board_list is None:
        return error_response("List not found", 404)

    db.session.delete(board_list)
    db.session.commit()
    return jsonify({"status": "deleted"}), 200


@bp.post("/lists/<int:list_id>/cards")
@jwt_required()
def create_card(list_id: int):
    user = get_current_user()
    board_list = (
        BoardList.query.join(Board)
        .options(joinedload(BoardList.board))
        .filter(BoardList.id == list_id)
        .filter(Board.tenant_id == user.tenant_id)
        .filter(Board.deleted_at.is_(None))
        .first()
    )
    if board_list is None:
        return error_response("List not found", 404)

    payload = CardCreateSchema.model_validate(request.get_json(silent=True) or {})
    card = Card(
        board_id=board_list.board_id,
        list_id=board_list.id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        priority=payload.priority,
        status=payload.status or "todo",
        reporter_id=payload.reporter_id or user.id,
        assignee_id=payload.assignee_id,
    )
    db.session.add(card)
    db.session.commit()

    return jsonify(_serialize_card(card)), 201


@bp.patch("/cards/<int:card_id>")
@jwt_required()
def update_card(card_id: int):
    user = get_current_user()
    card = (
        Card.query.join(Board)
        .filter(Card.id == card_id)
        .filter(Board.tenant_id == user.tenant_id)
        .filter(Board.deleted_at.is_(None))
        .first()
    )
    if card is None:
        return error_response("Card not found", 404)

    payload = CardUpdateSchema.model_validate(request.get_json(silent=True) or {})

    if payload.title is not None:
        card.title = payload.title
    if payload.description is not None:
        card.description = payload.description
    if payload.due_date is not None:
        card.due_date = payload.due_date
    if payload.priority is not None:
        card.priority = payload.priority
    if payload.status is not None:
        card.status = payload.status
    if payload.assignee_id is not None:
        card.assignee_id = payload.assignee_id
    if payload.reporter_id is not None:
        card.reporter_id = payload.reporter_id
    if payload.list_id is not None and payload.list_id != card.list_id:
        new_list = (
            BoardList.query.join(Board)
            .filter(BoardList.id == payload.list_id)
            .filter(Board.tenant_id == user.tenant_id)
            .filter(Board.deleted_at.is_(None))
            .first()
        )
        if new_list is None:
            return error_response("Target list not found", 404)
        card.list_id = new_list.id
        card.board_id = new_list.board_id

    db.session.commit()
    return jsonify(_serialize_card(card)), 200


@bp.delete("/cards/<int:card_id>")
@jwt_required()
def delete_card(card_id: int):
    user = get_current_user()
    card = (
        Card.query.join(Board)
        .filter(Card.id == card_id)
        .filter(Board.tenant_id == user.tenant_id)
        .filter(Board.deleted_at.is_(None))
        .first()
    )
    if card is None:
        return error_response("Card not found", 404)

    db.session.delete(card)
    db.session.commit()
    return jsonify({"status": "deleted"}), 200
