from fastapi import APIRouter

router = APIRouter()

@router.post("/register")
def register_user():
    return {"msg": "User registered"}

@router.post("/login")
def login_user():
    return {"msg": "User logged in"}