from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.group import (
    Group, GroupCreate, GroupUpdate,
    CentroidResponse, RestaurantRecommendation,
    MemberLocationResponse, AdminPromoteRequest,
    AdminDemoteRequest, RemoveMemberRequest,
    AdminGroupUpdate, AdminActionResponse,
    GroupWithMemberDetails, AdminAddMemberRequest
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
    
    # Verify user is a member of the group
    if not group_service._verify_group_membership(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
    return group

@router.get("/{group_id}/details", response_model=GroupWithMemberDetails)
def get_group_with_details(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get group details with member information (usernames, emails)"""
    group_service = GroupService(db)
    
    # Verify user is a member of the group
    if not group_service._verify_group_membership(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
    group_details = group_service.get_group_with_member_details(group_id)
    if not group_details:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return group_details

@router.put("/{group_id}/radius", response_model=Group)
def update_group_radius(
    group_id: int,
    radius: float,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update group's search radius"""
    group_service = GroupService(db)
    
    # Verify user is a member of the group
    if not group_service._verify_group_membership(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
    group = group_service.update_group_radius(group_id, radius)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

# ============= ADMIN-ONLY ENDPOINTS =============

@router.put("/{group_id}/admin/update", response_model=AdminActionResponse)
def admin_update_group(
    group_id: int,
    update_data: AdminGroupUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin-only: Update group settings (name, description, radius)"""
    group_service = GroupService(db)
    try:
        updated_group = group_service.admin_update_group(
            group_id, 
            current_user.id, 
            update_data.dict(exclude_unset=True)
        )
        return AdminActionResponse(
            success=True,
            message="Group settings updated successfully",
            group=updated_group
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update group settings")

@router.delete("/{group_id}/admin/members/{member_id}", response_model=AdminActionResponse)
def admin_remove_member(
    group_id: int,
    member_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin-only: Remove a member from the group"""
    group_service = GroupService(db)
    try:
        updated_group = group_service.admin_remove_member(group_id, current_user.id, member_id)
        return AdminActionResponse(
            success=True,
            message="Member removed successfully",
            group=updated_group
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to remove member")

@router.post("/{group_id}/admin/promote", response_model=AdminActionResponse)
def admin_promote_member(
    group_id: int,
    promote_data: AdminPromoteRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin-only: Promote a member to admin"""
    group_service = GroupService(db)
    try:
        updated_group = group_service.admin_promote_member(
            group_id, 
            current_user.id, 
            promote_data.user_id
        )
        return AdminActionResponse(
            success=True,
            message="Member promoted to admin successfully",
            group=updated_group
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to promote member")

@router.post("/{group_id}/admin/demote", response_model=AdminActionResponse)
def admin_demote_member(
    group_id: int,
    demote_data: AdminDemoteRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin-only: Demote an admin to regular member"""
    group_service = GroupService(db)
    try:
        updated_group = group_service.admin_demote_member(
            group_id, 
            current_user.id, 
            demote_data.user_id
        )
        return AdminActionResponse(
            success=True,
            message="Admin demoted to member successfully",
            group=updated_group
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to demote admin")

@router.post("/{group_id}/admin/add-member", response_model=AdminActionResponse)
def admin_add_member(
    group_id: int,
    add_member_data: AdminAddMemberRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin-only: Add a new member to the group"""
    group_service = GroupService(db)
    try:
        updated_group = group_service.admin_add_member(
            group_id, 
            current_user.id, 
            add_member_data.user_id
        )
        
        # Get the added user's details for the response message
        added_user = db.query(User).filter(User.id == add_member_data.user_id).first()
        username = added_user.username if added_user else "User"
        
        return AdminActionResponse(
            success=True,
            message=f"{username} has been added to the group",
            group=updated_group
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to add member")

@router.delete("/{group_id}/admin/delete", response_model=AdminActionResponse)
def admin_delete_group(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin-only: Permanently delete the group"""
    group_service = GroupService(db)
    try:
        success = group_service.admin_delete_group(group_id, current_user.id)
        if success:
            return AdminActionResponse(
                success=True,
                message="Group deleted successfully",
                group=None
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to delete group")
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete group")

# ============= MEMBER FUNCTIONS =============

@router.post("/{group_id}/leave", response_model=AdminActionResponse)
def leave_group(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave the group (available to all members)"""
    group_service = GroupService(db)
    try:
        success = group_service.leave_group(group_id, current_user.id)
        if success:
            return AdminActionResponse(
                success=True,
                message="Left group successfully",
                group=None
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to leave group")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to leave group")

@router.get("/{group_id}/centroid", response_model=CentroidResponse)
def get_group_centroid(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate and return the group's centroid"""
    group_service = GroupService(db)
    
    # Verify user is a member of the group
    if not group_service._verify_group_membership(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
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
    
    # Verify user is a member of the group
    if not group_service._verify_group_membership(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
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
    
    # Verify user is a member of the group
    if not group_service._verify_group_membership(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
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

@router.get("/{group_id}/member-locations", response_model=List[MemberLocationResponse])
def get_member_locations(
    group_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get locations of all group members"""
    group_service = GroupService(db)
    
    # Verify user is a member of the group
    if not group_service._verify_group_membership(group_id, current_user.id):
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
    locations = group_service.get_member_locations(group_id)
    if not locations:
        raise HTTPException(status_code=404, detail="Group not found")
    return locations 