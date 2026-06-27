"""Blueprint registration."""

from flask import Flask

from .ai import bp as ai_bp
from .auth import bp as auth_bp
from .boards import bp as boards_bp
from .health import bp as health_bp
from .teams import bp as teams_bp
from .users import bp as users_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(boards_bp, url_prefix="/api/v1/boards")
    app.register_blueprint(teams_bp, url_prefix="/api/v1/teams")
    app.register_blueprint(users_bp, url_prefix="/api/v1/users")
    app.register_blueprint(ai_bp, url_prefix="/api/v1/ai")


__all__ = ["register_blueprints"]
