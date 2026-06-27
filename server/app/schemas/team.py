"""Pydantic schemas for team endpoints."""

from pydantic import BaseModel, Field


class TeamCreateSchema(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    lead_user_id: int | None = None


class TeamUpdateSchema(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    lead_user_id: int | None = None


class TeamResponse(BaseModel):
    id: int
    name: str
    description: str | None
    lead_user_id: int | None
    member_count: int


class TeamMemberAssignSchema(BaseModel):
    user_id: int
