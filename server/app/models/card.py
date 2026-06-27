"""Card model representing tasks."""

from app.extensions import db
from .base import SurrogatePK, TimestampMixin


class Card(SurrogatePK, TimestampMixin, db.Model):
    __tablename__ = "cards"

    board_id = db.Column(db.Integer, db.ForeignKey("boards.id"), nullable=False)
    list_id = db.Column(db.Integer, db.ForeignKey("lists.id"), nullable=False)

    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    priority = db.Column(db.String(16), nullable=True)
    status = db.Column(db.String(32), nullable=False, default="todo")
    reporter_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    assignee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    board = db.relationship("Board", backref=db.backref("cards", lazy="dynamic"))
    list = db.relationship("BoardList", back_populates="cards")
    assignee = db.relationship("User", foreign_keys=[assignee_id])
    reporter = db.relationship("User", foreign_keys=[reporter_id])
