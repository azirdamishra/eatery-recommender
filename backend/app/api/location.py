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
    location_service = LocationService(db)
    return location_service.update_user_location(current_user.id, location)

@router.get("/location", response_model=UserLocationResponse)
def get_location(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    return location_service.get_user_default_location(current_user.id)

@router.post("/landmarks", response_model=LandmarkResponse)
def save_landmark(
    landmark: LandmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    return location_service.save_landmark(current_user.id, landmark)

@router.get("/landmarks", response_model=List[LandmarkResponse])
def get_landmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    return location_service.get_user_landmarks(current_user.id)

@router.post("/landmarks/{landmark_id}/set-current", response_model=LandmarkResponse)
def set_current_landmark(
    landmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    return location_service.set_current_landmark(landmark_id, current_user.id)

@router.get("/landmarks/current", response_model=LandmarkResponse)
def get_current_landmark(
    user_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    # If user_id is provided, use it; otherwise use current_user's ID
    target_user_id = user_id if user_id is not None else current_user.id
    current = location_service.get_current_landmark(target_user_id)
    if not current:
        raise HTTPException(status_code=404, detail="No current landmark set")
    return current

@router.delete("/landmarks/{landmark_id}")
def delete_landmark(
    landmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    location_service = LocationService(db)
    return location_service.delete_landmark(landmark_id, current_user.id)