from sqlalchemy.orm import Session
#from app.models.user import User
from app.models import User #after adding to __init__.py
from typing import Dict
from app.schemas.user import UserCreate, UserOut
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#in memory user store
fake_users_db: Dict[str, Dict] = {}
user_id_sequence = 1

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# def create_user(user_data: UserCreate, db: Session = None) -> UserOut:
#     global user_id_sequence
#     if user_data.username in fake_users_db:
#         raise ValueError("Username already exists")
#     hashed_pw = get_password_hash(user_data.password)

#     user_record = {
#         "id": user_id_sequence,
#         "username": user_data.username,
#         "email": user_data.email,
#         "hashed_password": hashed_pw
#     }
#     fake_users_db[user_data.username] = user_record
#     user_id_sequence += 1
#     return UserOut(**user_record)

def create_user(db: Session, user_data: UserCreate) -> UserOut:
    
    if db.query(User).filter(User.username == user_data.username).first():
        raise ValueError("Username already exists")
    if db.query(User).filter(User.email == user_data.email).first():
        raise ValueError("Email already exists")
    hashed_pw = get_password_hash(user_data.password)

    db_user = User(
        username = user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw
    )
    db.add(db_user)
    db.commit()
    db.refresh()
    return UserOut.model_validate(db_user)

# def login_current_user(user_data: UserCreate, db: Session= None ) -> Dict:
#     try:
#         user = get_user(user_data.username)
#         if not verify_password(user_data.password, user["hashed_password"]):
#             raise ValueError("Invalid password")
#         return {"message": "Login successful", "user": UserOut(**user)}
#     except ValueError as e:
#         raise ValueError(str(e))

def login_current_user(db: Session, user_data: UserCreate) -> Dict:
    try:
        user = get_user(db, user_data.username)
        if not verify_password(user_data.password, user.hashed_password):
            raise ValueError("Invalid password")
        return {"message": "Login successful", "user": UserOut.model_validate(user)}
    except ValueError as e:
        raise ValueError(str(e))


# def get_user(username: str, db: Session = None) -> Dict:
#     if username not in fake_users_db:
#         raise ValueError("User not found")
#     return fake_users_db[username]

def get_user( db: Session, username: str) -> Dict:
    user = db.query(User).filter(User.username==username).first()
    if not user:
        raise ValueError("User not found")
    return user

def return_all_users() -> Dict:
    return fake_users_db


