from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.location import UserLocation, SavedLandmark
from app.schemas.location import UserLocationCreate, LandmarkCreate
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class LocationService:
    def __init__(self, db: Session):
        self.db = db
    
    def update_user_location(self, user_id: int, location: UserLocationCreate) -> UserLocation:
        #Get existing location or create new one
        user_location = self.db.query(UserLocation).filter(UserLocation.user_id == user_id).first()

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
            self.db.add(user_location)

        self.db.commit()
        self.db.refresh(user_location)
        return user_location
    
    def get_user_default_location(self, user_id: int) -> UserLocation:
        # First check if user has a current landmark
        current_landmark = self.db.query(SavedLandmark).filter(
            SavedLandmark.user_id == user_id,
            SavedLandmark.is_current == True
        ).first()

        if current_landmark:
            # Update user location with current landmark
            user_location = self.db.query(UserLocation).filter(UserLocation.user_id == user_id).first()
            if user_location:
                user_location.latitude = current_landmark.latitude
                user_location.longitude = current_landmark.longitude
                user_location.last_updated = datetime.now()
            else:
                user_location = UserLocation(
                    user_id=user_id,
                    latitude=current_landmark.latitude,
                    longitude=current_landmark.longitude,
                    last_updated=datetime.utcnow()
                )
                self.db.add(user_location)
            self.db.commit()
            self.db.refresh(user_location)
            return user_location

        # If no current landmark, return existing location or create default
        location = self.db.query(UserLocation).filter(UserLocation.user_id == user_id).first()
        if not location:
            # Create and save a default location
            default_location = UserLocation(
                user_id=user_id,
                latitude=40.7128,  # Default to New York City
                longitude=-74.0060,
                last_updated=datetime.utcnow()
            )
            self.db.add(default_location)
            self.db.commit()
            self.db.refresh(default_location)
            return default_location
        return location
    
    def save_landmark(self, user_id: int, landmark: LandmarkCreate) -> SavedLandmark:
        new_landmark = SavedLandmark(
            user_id=user_id,
            name=landmark.name,
            latitude=landmark.latitude,
            longitude=landmark.longitude,
            description=landmark.description
        )
        self.db.add(new_landmark)
        self.db.commit()
        self.db.refresh(new_landmark)
        return new_landmark
    
    def get_user_landmarks(self, user_id: int) -> list[SavedLandmark]:
        return self.db.query(SavedLandmark).filter(SavedLandmark.user_id == user_id).all()
    
    def set_current_landmark(self, landmark_id: int, user_id: int) -> SavedLandmark:
        # First, unset any current landmarks for this user
        self.db.query(SavedLandmark).filter(
            SavedLandmark.user_id == user_id,
            SavedLandmark.is_current == True
        ).update({"is_current": False})

        # Set the new current landmark
        landmark = self.db.query(SavedLandmark).filter(
            SavedLandmark.id == landmark_id,
            SavedLandmark.user_id == user_id
        ).first()

        if not landmark:
            raise HTTPException(status_code=404, detail="Landmark not found")

        landmark.is_current = True
        self.db.commit()
        self.db.refresh(landmark)
        return landmark
    
    def get_current_landmark(self, user_id: int) -> SavedLandmark:
        return self.db.query(SavedLandmark).filter(
            SavedLandmark.user_id == user_id,
            SavedLandmark.is_current == True
        ).first()
    
    def delete_landmark(self, landmark_id: int, user_id: int) -> dict:
        landmark = self.db.query(SavedLandmark).filter(
            SavedLandmark.id == landmark_id,
            SavedLandmark.user_id == user_id
        ).first()

        if not landmark:
            raise HTTPException(status_code=404, detail="Landmark not found")
        
        self.db.delete(landmark)
        self.db.commit()
        return { "message": "Landmark deleted successfully" }