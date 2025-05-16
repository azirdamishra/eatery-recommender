from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.location import (
    UserLocationCreate,
    UserLocationResponse,
    LandmarkCreate,
    LandmarkResponse
)
from app.services.location import LocationService

router = APIRouter()

@router.post("/location", response_model=UserLocationResponse)
def update_location(
    location: UserLocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return LocationService.update_user_location(db, current_user.id, location)

@router.get("/location", response_model=UserLocationResponse)
def get_location(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return LocationService.get_user_location(db, current_user.id)

@router.post("/landmarks", response_model=LandmarkResponse)
def save_landmark(
    landmark: LandmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return LocationService.save_landmark(db, current_user.id, landmark)

@router.get("/landmarks", response_model=List[LandmarkResponse])
def get_landmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return LocationService.get_user_landmarks(db, current_user.id)

@router.delete("/landmarks/{landmark_id}")
def delete_landmark(
    landmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return LocationService.delete_landmark(db, landmark_id, current_user.id)