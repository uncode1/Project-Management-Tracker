"""Pydantic schemas for user management endpoints."""

from pydantic import BaseModel, EmailStr, Field


class UserDirectoryResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    team_id: int | None


class UserCreateSchema(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    role: str | None = Field(default="member", max_length=32)
    team_id: int | None = None


class UserUpdateSchema(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    role: str | None = Field(default=None, max_length=32)
    team_id: int | None = None
