from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.group import (
    Group, GroupCreate, GroupUpdate,
    CentroidResponse, RestaurantRecommendation
)
from app.schemas.user import UserResponse
from app.core.security import get_current_user
from app.services.group_service import GroupService

router = APIRouter()

@router.post("/create-group", response_model=Group)
def create_group(
    group_data: GroupCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new group with selected friends"""
    group_service = GroupService(db)
    try:
        return group_service.create_group(group_data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{group_id}", response_model=Group)
def get_group(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get group details"""
    group_service = GroupService(db)
    group = group_service.get_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.put("/{group_id}/radius", response_model=Group)
def update_group_radius(
    group_id: int,
    radius: float,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update group's search radius"""
    group_service = GroupService(db)
    group = group_service.update_group_radius(group_id, radius)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

@router.get("/{group_id}/centroid", response_model=CentroidResponse)
def get_group_centroid(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate and return the group's centroid"""
    group_service = GroupService(db)
    centroid = group_service.calculate_centroid(group_id)
    if not centroid:
        raise HTTPException(status_code=404, detail="Group not found or no member locations available")
    return centroid

@router.get("/{group_id}/restaurants", response_model=List[RestaurantRecommendation])
def get_nearby_restaurants(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get restaurants near the group's centroid"""
    group_service = GroupService(db)
    restaurants = group_service.get_nearby_restaurants(group_id)
    return restaurants

@router.get("/{group_id}/recommendations/{restaurant_id}", response_model=List[str])
def get_restaurant_recommendations(
    group_id: int,
    restaurant_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI recommendations for a restaurant"""
    group_service = GroupService(db)
    recommendations = group_service.get_restaurant_recommendations(group_id, restaurant_id)
    return recommendations

@router.post("/{group_id}/members/{user_id}")
def add_member_to_group(
    group_id: int,
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new member to the group"""
    group_service = GroupService(db)
    try:
        return group_service.add_member_to_group(group_id, user_id, current_user["id"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/user/groups", response_model=List[Group])
def get_user_groups(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all groups the current user is a member of"""
    group_service = GroupService(db)
    return group_service.get_user_groups(current_user.id) 