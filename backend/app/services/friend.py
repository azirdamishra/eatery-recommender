from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.friend import FriendRequest, FriendRequestStatus
from app.models.user import User
from app.schemas.friend import FriendRequestCreate, FriendRequestUpdate
import logging

logger = logging.getLogger(__name__)

class FriendService:
    @staticmethod
    def send_friend_request(db: Session, sender_id: int, request: FriendRequestCreate) -> FriendRequest:
        # Check if users exist
        receiver = db.query(User).filter(User.id == request.receiver_id).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver user not found")
        
        # Check if request already exists
        existing_request = db.query(FriendRequest).filter(
            FriendRequest.sender_id == sender_id,
            FriendRequest.receiver_id == request.receiver_id,
            FriendRequest.status == FriendRequestStatus.PENDING
        ).first()
        
        if existing_request:
            raise HTTPException(status_code=400, detail="Friend request already sent")
        
        # Create new friend request
        friend_request = FriendRequest(
            sender_id=sender_id,
            receiver_id=request.receiver_id
        )
        db.add(friend_request)
        db.commit()
        db.refresh(friend_request)
        return friend_request
    
    @staticmethod
    def get_friend_requests(db: Session, user_id: int, status: FriendRequestStatus = None):
        logger.info(f"Getting friend requests for user {user_id}")
        query = db.query(FriendRequest).filter(
            (FriendRequest.receiver_id == user_id) | (FriendRequest.sender_id == user_id)
        )
        
        if status:
            query = query.filter(FriendRequest.status == status)
        
        results = query.all()
        logger.info(f"Found {len(results)} friend requests")
        for req in results:
            logger.info(f"Request: id={req.id}, sender={req.sender_id}, receiver={req.receiver_id}, status={req.status}")
        return results
    
    @staticmethod
    def update_friend_request(db: Session, request_id: int, user_id: int, update: FriendRequestUpdate) -> FriendRequest:
        friend_request = db.query(FriendRequest).filter(
            FriendRequest.id == request_id,
            FriendRequest.receiver_id == user_id,
            FriendRequest.status == FriendRequestStatus.PENDING
        ).first()
        
        if not friend_request:
            raise HTTPException(status_code=404, detail="Friend request not found")
        
        # Update status
        friend_request.status = FriendRequestStatus(update.status)
        
        # If accepted, add to friends list
        if update.status == FriendRequestStatus.ACCEPTED.value:
            sender = db.query(User).filter(User.id == friend_request.sender_id).first()
            receiver = db.query(User).filter(User.id == friend_request.receiver_id).first()
            
            sender.friends.append(receiver)
            receiver.friends.append(sender)
        
        db.commit()
        db.refresh(friend_request)
        return friend_request
    
    @staticmethod
    def get_friends(db: Session, user_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user.friends