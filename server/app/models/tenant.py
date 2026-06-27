"""Tenant model for multi-tenant isolation."""

from app.extensions import db
from .base import SurrogatePK, TimestampMixin


class Tenant(SurrogatePK, TimestampMixin, db.Model):
    __tablename__ = "tenants"

    name = db.Column(db.String(120), nullable=False, unique=True)
    data_region = db.Column(db.String(64), nullable=True)
    plan_tier = db.Column(db.String(32), nullable=True)

    users = db.relationship("User", back_populates="tenant", lazy="dynamic")
    teams = db.relationship("Team", back_populates="tenant", lazy="dynamic")
    boards = db.relationship("Board", back_populates="tenant", lazy="dynamic")
