from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user import User #SQLAlchemy user model
from app.models.friend import FriendRequest, FriendRequestStatus
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserOut, UserSearchResult
from app.core.database import get_db #db session dependency
from app.core.security import get_current_user
from app.services.user_service import create_user, login_current_user, return_all_users
from typing import List
from sqlalchemy import or_, and_

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        return create_user(db, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=Token)
def login_user(user: UserCreate, db: Session = Depends(get_db)):
   try: 
       result = login_current_user(user, db)
       return Token(
           access_token=result["access_token"],
           token_type=result["token_type"]
       )
   except ValueError as e:
       raise HTTPException(status_code=401, detail=str(e))
   
@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
   
@router.get("/users") #for internal use
def get_all_users(db: Session = Depends(get_db)):
    try: 
        return return_all_users(db)
    except ValueError as e:
        raise HTTPException(status_code=401)

@router.get("/search", response_model=List[UserSearchResult])
def search_users(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        #Get all users matching the search query
        users = db.query(User).filter(
            or_(
                User.username.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%")
            )
        ).all()

        #Get friend IDs
        friend_ids = {friend.id for friend in current_user.friends}

        #Get pending request IDs and their status 
        pending_requests = db.query(FriendRequest).filter(
            and_(
                or_(
                    FriendRequest.sender_id == current_user.id,
                    FriendRequest.receiver_id == current_user.id
                ),
                FriendRequest.status == FriendRequestStatus.PENDING
            )
        ).all()

        pending_sent_ids = {req.receiver_id for req in pending_requests if req.sender_id == current_user.id}
        pending_received_ids = {req.sender_id for req in pending_requests if req.receiver_id == current_user.id}

        #Create response with user status
        results = []
        for user in users:
            if user.id == current_user.id:
                continue
            status = "none"
            if user.id in friend_ids:
                status = "friend"
            elif user.id in pending_sent_ids:
                status = "request_sent"
            elif user.id in pending_received_ids:
                status = "request_received"

            results.append(UserSearchResult(
                id = user.id,
                username = user.username,
                email = user.email,
                status = status
            ))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        