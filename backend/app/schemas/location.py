from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LocationBase(BaseModel):
    latitude: float
    longitude: float

class UserLocationCreate(LocationBase):
    pass

class UserLocationResponse(LocationBase):
    id: int
    user_id: int
    last_updated: datetime

    model_config = {
        "from_attributes": True
    }

class LandmarkBase(LocationBase):
    name: str
    description: Optional[str] = None

class LandmarkCreate(LandmarkBase):
    pass

class LandmarkResponse(LandmarkBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }