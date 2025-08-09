from sqlalchemy.orm import Session
from typing import Optional
from ..models import Group, Location
from ..schemas import GroupCreate, GroupResponse, LocationCreate, LocationResponse


class GroupService:
    def __init__(self, db: Session):
        self.db = db

    def create_group(self, group_data: GroupCreate) -> GroupResponse:
        """Create a new group"""
        db_group = Group(
            name=group_data.name,
            description=group_data.description
        )
        
        self.db.add(db_group)
        self.db.commit()
        self.db.refresh(db_group)
        
        return GroupResponse.model_validate(db_group)

    def get_group(self, group_id: str) -> Optional[GroupResponse]:
        """Get a group by ID with all its locations"""
        db_group = self.db.query(Group).filter(Group.id == group_id).first()
        
        if not db_group:
            return None
            
        return GroupResponse.model_validate(db_group)

    def add_location_to_group(self, group_id: str, location_data: LocationCreate) -> Optional[LocationResponse]:
        """Add a location to a group"""
        # First check if group exists
        db_group = self.db.query(Group).filter(Group.id == group_id).first()
        if not db_group:
            return None
        
        db_location = Location(
            group_id=group_id,
            name=location_data.name,
            description=location_data.description,
            latitude=location_data.latitude,
            longitude=location_data.longitude,
            added_by=location_data.added_by
        )
        
        self.db.add(db_location)
        self.db.commit()
        self.db.refresh(db_location)
        
        return LocationResponse.model_validate(db_location)

    def remove_location_from_group(self, group_id: str, location_id: str) -> bool:
        """Remove a location from a group"""
        db_location = self.db.query(Location).filter(
            Location.id == location_id,
            Location.group_id == group_id
        ).first()
        
        if not db_location:
            return False
        
        self.db.delete(db_location)
        self.db.commit()
        
        return True
