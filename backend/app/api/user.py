from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user import User #SQLAlchemy user model
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserOut
from app.core.database import get_db #db session dependency
from app.core.security import get_current_user
from app.services.user_service import create_user, login_current_user, return_all_users

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
        