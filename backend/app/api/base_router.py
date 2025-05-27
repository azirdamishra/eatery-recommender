from fastapi import APIRouter
from app.api import user, friends, location, group

base_router = APIRouter()
base_router.include_router(user.router, prefix="/user", tags=["User"])
base_router.include_router(friends.router, prefix="/friends", tags=["Friends"])
base_router.include_router(location.router, prefix="/location", tags=["Location"])
base_router.include_router(group.router, prefix="/group", tags=["Group"])