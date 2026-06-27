"""Refresh token store for rotation + revocation."""

from app.extensions import db
from .base import SurrogatePK, TimestampMixin


class RefreshToken(SurrogatePK, TimestampMixin, db.Model):
    __tablename__ = "refresh_tokens"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    jti = db.Column(db.String(36), nullable=False, unique=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    revoked_at = db.Column(db.DateTime, nullable=True)
    ip_address = db.Column(db.String(64), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)

    user = db.relationship("User", backref=db.backref("refresh_tokens", lazy="dynamic"))
