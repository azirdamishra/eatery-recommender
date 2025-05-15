from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    
class UserOut(UserBase):
    id: int
    
    model_config = {
        "from_attributes": True
    }

class UserSearchResult(UserOut):
    status: str #"none", "friend", "request_sent", "request_received"