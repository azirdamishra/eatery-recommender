from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    added_by: str = Field(..., min_length=1, max_length=100)


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    id: str
    group_id: str
    created_at: datetime

    class Config:
        from_attributes = True
