"""List model for board columns."""

from app.extensions import db
from .base import SurrogatePK, TimestampMixin


class BoardList(SurrogatePK, TimestampMixin, db.Model):
    __tablename__ = "lists"

    board_id = db.Column(db.Integer, db.ForeignKey("boards.id"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    position = db.Column(db.Integer, nullable=False, default=0)

    board = db.relationship("Board", back_populates="lists")
    cards = db.relationship("Card", back_populates="list", cascade="all, delete-orphan")
