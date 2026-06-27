"""Schemas for board/list/card endpoints."""

from datetime import datetime

from pydantic import BaseModel, Field


class BoardCreateSchema(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    visibility: str | None = Field(default=None, max_length=32)


class BoardUpdateSchema(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    visibility: str | None = Field(default=None, max_length=32)


class ListCreateSchema(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    position: int | None = None


class ListUpdateSchema(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    position: int | None = None


class CardCreateSchema(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str | None = None
    due_date: datetime | None = None
    priority: str | None = Field(default=None, max_length=16)
    status: str | None = Field(default=None, max_length=32)
    assignee_id: int | None = None
    reporter_id: int | None = None


class CardUpdateSchema(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    due_date: datetime | None = None
    priority: str | None = Field(default=None, max_length=16)
    status: str | None = Field(default=None, max_length=32)
    assignee_id: int | None = None
    reporter_id: int | None = None
    list_id: int | None = None


class CardResponse(BaseModel):
    id: int
    board_id: int
    list_id: int
    title: str
    description: str | None
    due_date: datetime | None
    priority: str | None
    status: str
    assignee_id: int | None
    reporter_id: int | None


class ListResponse(BaseModel):
    id: int
    board_id: int
    title: str
    position: int
    cards: list[CardResponse]


class BoardResponse(BaseModel):
    id: int
    name: str
    description: str | None
    visibility: str
    lists: list[ListResponse]
