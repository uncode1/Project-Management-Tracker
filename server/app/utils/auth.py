"""Authentication helpers for routes."""

from flask import abort
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import User


def get_current_user() -> User:
    user_id = get_jwt_identity()
    if user_id is None:
        abort(401)
    user = db.session.get(User, user_id)
    if user is None:
        abort(404)
    return user
