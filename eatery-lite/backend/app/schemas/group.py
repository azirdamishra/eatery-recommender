from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .location import LocationResponse


class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class GroupCreate(GroupBase):
    pass


class GroupResponse(GroupBase):
    id: str
    created_at: datetime
    locations: List[LocationResponse] = []

    class Config:
        from_attributes = True
