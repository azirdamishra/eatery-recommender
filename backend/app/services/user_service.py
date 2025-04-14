from sqlalchemy.orm import Session
#from app.models.user import User
from app.models import User #after adding to __init__.py
from typing import Dict
from app.schemas.user import UserCreate, UserOut
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_user(db: Session, user_data: UserCreate) -> UserOut:
    
    if db.query(User).filter(User.username == user_data.username).first():
        raise ValueError("Username already exists")
    if db.query(User).filter(User.email == user_data.email).first():
        raise ValueError("Email already exists")
    hashed_pw = get_password_hash(user_data.password)

    db_user = User(
        username = user_data.username,
        email=user_data.email,
        password=hashed_pw
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return UserOut.model_validate(db_user)

def login_current_user(db: Session, user_data: UserCreate) -> Dict:
    try:
        user = get_user(db, user_data.username)
        if not verify_password(user_data.password, user.password):
            raise ValueError("Invalid password")
        return {"message": "Login successful", "user": UserOut.model_validate(user)}
    except ValueError as e:
        raise ValueError(str(e))

def get_user( db: Session, username: str) -> Dict:
    user = db.query(User).filter(User.username==username).first()
    if not user:
        raise ValueError("User not found")
    return user

def return_all_users(db: Session) -> Dict:
    try:
        users = db.query(User).all()
        return users
    except ValueError as e:
        raise ValueError(f"Schema {User} does not exist", str(e))


