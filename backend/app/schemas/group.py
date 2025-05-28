from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    radius: Optional[float] = 1.0

class GroupCreate(GroupBase):
    member_ids: List[int]

class GroupUpdate(GroupBase):
    pass

class GroupMemberBase(BaseModel):
    user_id: int
    is_admin: bool = False

class GroupMemberCreate(GroupMemberBase):
    pass

class GroupMember(GroupMemberBase):
    id: int
    group_id: int
    joined_at: datetime

    model_config = {
        "from_attributes": True
    }

class Group(GroupBase):
    id: int
    created_by: int
    group_members: List[GroupMember]
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class CentroidResponse(BaseModel):
    latitude: float
    longitude: float
    radius: float

class RestaurantRecommendation(BaseModel):
    restaurant_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    distance: float
    recommendations: List[str] 