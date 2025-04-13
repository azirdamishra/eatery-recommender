from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserOut
from app.core.database import get_db
from app.services.user_service import create_user, login_current_user, return_all_users

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register_user(user: UserCreate, db: Session = Depends(get_db)):#user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        new_user = create_user(db, user)
        return new_user
    except ValueError as e:
         raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login_user(user: UserCreate, db: Session = Depends(get_db)):
   try: 
       result = login_current_user(db, user)
       return result
   except ValueError as e:
       raise HTTPException(status_code=401, detail=str(e))
   
@router.get("/users") #for internal use
def get_all_users():
    try: 
        return return_all_users()
    except ValueError as e:
        raise HTTPException(status_code=401)
        