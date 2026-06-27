"""User model representing authenticated identities."""

from sqlalchemy import UniqueConstraint

from app.extensions import db
from .base import SurrogatePK, TimestampMixin


class User(SurrogatePK, TimestampMixin, db.Model):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),
    )

    tenant_id = db.Column(db.Integer, db.ForeignKey("tenants.id"), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=True)

    email = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(32), nullable=False, default="member")
    mfa_enabled = db.Column(db.Boolean, default=False, nullable=False)
    last_login_at = db.Column(db.DateTime, nullable=True)

    tenant = db.relationship("Tenant", back_populates="users")
    team = db.relationship("Team", back_populates="members", foreign_keys=[team_id])
    boards_owned = db.relationship("Board", back_populates="owner", lazy="dynamic")
