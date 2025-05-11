from fastapi import APIRouter
from app.api import user, friends#, location, recommender

base_router = APIRouter()
base_router.include_router(user.router, prefix="/user", tags=["User"])
base_router.include_router(friends.router, prefix="/friends", tags=["Friends"])
# base_router.include_router(location.router, prefix="/location", tags=["Location"])
# base_router.include_router(recommender.router, prefix="/ai", tags=["Recommender"])