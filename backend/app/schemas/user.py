from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
class UserOut(UserBase):
    id: int
    
    model_config = {
        "from_attributes": True
    }

class UserSearchResult(UserOut):
    status: str #"none", "friend", "request_sent", "request_received"

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }