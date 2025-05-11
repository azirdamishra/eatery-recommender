from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.friend import FriendRequestStatus
from app.models.user import User
from app.schemas.friend import (
    FriendRequestCreate,
    FriendRequestResponse,
    FriendRequestUpdate,
    UserWithFriends
)
from app.services.friend import FriendService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/friend-requests", response_model=FriendRequestResponse)
def send_friend_request(
    request: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return FriendService.send_friend_request(db, current_user.id, request)

@router.get("/friend-requests", response_model=List[FriendRequestResponse])
def get_friend_requests(
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Getting friend requests for user {current_user.id} (username: {current_user.username})")
    status_enum = FriendRequestStatus(status) if status else None
    requests = FriendService.get_friend_requests(db, current_user.id, status_enum)
    logger.info(f"Returning {len(requests)} friend requests")
    return requests

@router.put("/friend-requests/{request_id}", response_model=FriendRequestResponse)
def update_friend_request(
    request_id: int,
    update: FriendRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return FriendService.update_friend_request(db, request_id, current_user.id, update)

@router.get("/friends", response_model=List[UserWithFriends])
def get_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return FriendService.get_friends(db, current_user.id)