"""Board model for Kanban boards."""

from app.extensions import db
from .base import SurrogatePK, TimestampMixin


class Board(SurrogatePK, TimestampMixin, db.Model):
    __tablename__ = "boards"

    tenant_id = db.Column(db.Integer, db.ForeignKey("tenants.id"), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    name = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=True)
    visibility = db.Column(db.String(32), default="private", nullable=False)

    tenant = db.relationship("Tenant", back_populates="boards")
    owner = db.relationship("User", back_populates="boards_owned")
    lists = db.relationship("BoardList", back_populates="board", cascade="all, delete-orphan")
