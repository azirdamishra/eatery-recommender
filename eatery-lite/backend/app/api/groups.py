from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..schemas import GroupCreate, GroupResponse, LocationCreate, LocationResponse
from ..services import GroupService

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("", response_model=GroupResponse, status_code=201)
def create_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db)
):
    """Create a new group"""
    group_service = GroupService(db)
    return group_service.create_group(group_data)


@router.get("/{group_id}", response_model=GroupResponse)
def get_group(
    group_id: str,
    db: Session = Depends(get_db)
):
    """Get a group by ID with all its locations"""
    group_service = GroupService(db)
    group = group_service.get_group(group_id)
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return group


@router.post("/{group_id}/locations", response_model=LocationResponse, status_code=201)
def add_location_to_group(
    group_id: str,
    location_data: LocationCreate,
    db: Session = Depends(get_db)
):
    """Add a location to a group"""
    group_service = GroupService(db)
    location = group_service.add_location_to_group(group_id, location_data)
    
    if not location:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return location


@router.delete("/{group_id}/locations/{location_id}", status_code=204)
def remove_location_from_group(
    group_id: str,
    location_id: str,
    db: Session = Depends(get_db)
):
    """Remove a location from a group"""
    group_service = GroupService(db)
    success = group_service.remove_location_from_group(group_id, location_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Location or group not found")
