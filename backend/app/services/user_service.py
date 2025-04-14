from sqlalchemy.orm import Session
from app.models import User #after adding to __init__.py
from app.schemas.user import UserCreate, UserOut
from app.utils.user_utils import get_password_hash, verify_password, create_access_token

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

def login_current_user(user_data: UserCreate, db: Session) -> dict:
    try:
        user = get_user(db, user_data.username)
        if not verify_password(user_data.password, user.password):
            raise ValueError("Invalid password")
        #create access token
        access_token = create_access_token(
            data={"sub": user.username}
        )
        return{
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserOut.model_validate(user)
        }
    except ValueError as e:
        raise ValueError(str(e))

def get_user( db: Session, username: str) -> dict:
    user = db.query(User).filter(User.username==username).first()
    if not user:
        raise ValueError("User not found")
    return user

def return_all_users(db: Session) -> dict:
    try:
        users = db.query(User).all()
        return users
    except ValueError as e:
        raise ValueError(f"Schema {User} does not exist", str(e))


