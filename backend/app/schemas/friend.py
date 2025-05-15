from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from .user import UserOut

class FriendRequestBase(BaseModel):
    receiver_id: int

class FriendRequestCreate(FriendRequestBase):
    pass

class FriendRequestResponse(FriendRequestBase):
    id: int
    sender_id: int
    sender_username: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class FriendRequestUpdate(BaseModel):
    status: str

class UserWithFriends(UserOut):
    friends: List[UserOut]

    model_config = {
        "from_attributes": True
    }