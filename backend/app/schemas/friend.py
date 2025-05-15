from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from .user import UserOut
from app.models.friend import FriendRequest

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

    @classmethod
    def from_model(cls, friend_request: 'FriendRequest', sender_username: str):
        return cls(
            id=friend_request.id,
            sender_id=friend_request.sender_id,
            receiver_id=friend_request.receiver_id,
            status=friend_request.status,
            created_at=friend_request.created_at,
            updated_at=friend_request.updated_at,
            sender_username=sender_username
        )

class FriendRequestUpdate(BaseModel):
    status: str

class UserWithFriends(UserOut):
    friends: List[UserOut]

    model_config = {
        "from_attributes": True
    }