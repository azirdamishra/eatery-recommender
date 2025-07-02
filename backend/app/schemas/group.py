from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    radius: float = 5.0  # Default radius in kilometers

class GroupCreate(GroupBase):
    member_ids: List[int]

class GroupUpdate(GroupBase):
    pass

class GroupMemberBase(BaseModel):
    user_id: int
    is_admin: bool
    joined_at: datetime

class GroupMember(GroupMemberBase):
    id: int
    group_id: int

    class Config:
        from_attributes = True

class Group(GroupBase):
    id: int
    created_by: int
    created_at: datetime
    group_members: List[GroupMember]

    class Config:
        from_attributes = True

class CentroidResponse(BaseModel):
    latitude: float
    longitude: float
    radius: float

class RestaurantRecommendation(BaseModel):
    id: str
    name: str
    address: str
    rating: float
    price_level: int
    types: List[str]

class MemberLocationResponse(BaseModel):
    user_id: int
    username: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_location: bool 