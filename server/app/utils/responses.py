"""Helper functions for consistent API responses."""

from flask import jsonify


def error_response(message: str, status_code: int = 400):
    return jsonify({"error": message}), status_code
