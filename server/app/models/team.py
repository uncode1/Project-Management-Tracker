"""Team model grouping users."""

from app.extensions import db
from .base import SurrogatePK, TimestampMixin


class Team(SurrogatePK, TimestampMixin, db.Model):
    __tablename__ = "teams"

    tenant_id = db.Column(db.Integer, db.ForeignKey("tenants.id"), nullable=False)
    lead_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)

    tenant = db.relationship("Tenant", back_populates="teams")
    members = db.relationship("User", back_populates="team", lazy="dynamic", foreign_keys="[User.team_id]")
    lead_user = db.relationship("User", foreign_keys=[lead_user_id])
