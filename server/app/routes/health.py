"""Health and readiness probes."""

from flask import Blueprint, jsonify

bp = Blueprint("health", __name__)


@bp.get("/healthz")
def health() -> tuple[dict[str, str], int]:
    return jsonify(status="ok"), 200


@bp.get("/readyz")
def ready() -> tuple[dict[str, str], int]:
    # Additional dependency checks can be added later.
    return jsonify(status="ready"), 200
