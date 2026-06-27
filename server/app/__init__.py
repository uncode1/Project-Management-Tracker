"""Application factory for the Project Management Tracker API."""

import os
from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv

from .config import get_config
from .extensions import cors, db, jwt, limiter, migrate
from .routes import register_blueprints


def create_app(config_name: str | None = None) -> Flask:
    # Load environment variables from .env file
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

    app = Flask(__name__)
    config_obj = get_config(config_name)
    app.config.from_object(config_obj)

    # Apply reverse-proxy fix for production deployments.
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    register_extensions(app)
    register_blueprints(app)

    return app


def register_extensions(app: Flask) -> None:
    cors.init_app(app, origins=app.config.get("CORS_ORIGINS"), supports_credentials=True)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    limiter.default_limits = [app.config.get("RATE_LIMIT", "200/minute")]


__all__ = ["create_app"]
