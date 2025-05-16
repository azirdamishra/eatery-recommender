from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.location import UserLocation, SavedLandmark
from app.schemas.location import UserLocationCreate, LandmarkCreate
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class LocationService:
    
    @staticmethod
    def update_user_location(db: Session, user_id: int, location: UserLocationCreate) -> UserLocation:
        #Get existing location or create new one
        user_location = db.query(UserLocation).filter(UserLocation.user_id == user_id).first()

        if user_location:
            #Update existing location
            user_location.latitude = location.latitude
            user_location.longitude = location.longitude
            user_location.last_updated = datetime.now()
        else:
            #create new location
            user_location = UserLocation(
                user_id=user_id,
                latitude=location.latitude,
                longitude=location.longitude,
                last_updated=datetime.utcnow()
            )
            db.add(user_location)

        db.commit()
        db.refresh(user_location)
        return user_location
    
    @staticmethod
    def get_user_location(db: Session, user_id: int) -> UserLocation:
        location = db.query(UserLocation).filter(UserLocation.user_id == user_id).first()
        if not location:
            # Create and save a default location
            default_location = UserLocation(
                user_id=user_id,
                latitude=40.7128,  # Default to New York City
                longitude=-74.0060,
                last_updated=datetime.utcnow()
            )
            db.add(default_location)
            db.commit()
            db.refresh(default_location)
            return default_location
        return location
    
    @staticmethod
    def save_landmark(db: Session, user_id: int, landmark: LandmarkCreate) -> SavedLandmark:
        new_landmark = SavedLandmark(
            user_id=user_id,
            name=landmark.name,
            latitude=landmark.latitude,
            longitude=landmark.longitude,
            description=landmark.description,
            locality=landmark.locality
        )
        db.add(new_landmark)
        db.commit()
        db.refresh(new_landmark)
        return new_landmark
    
    @staticmethod
    def get_user_landmarks(db: Session, user_id: int) -> list[SavedLandmark]:
        return db.query(SavedLandmark).filter(SavedLandmark.user_id == user_id).all()
    
    @staticmethod
    def delete_landmark(db: Session, landmark_id: int, user_id: int) -> dict:
        landmark = db.query(SavedLandmark).filter(
            SavedLandmark.id == landmark_id,
            SavedLandmark.user_id == user_id
        ).first()

        if not landmark:
            raise HTTPException(status_code=404, detail="Landmark not found")
        
        db.delete(landmark)
        db.commit()
        return { "message": "Landmark deleted successfully" }