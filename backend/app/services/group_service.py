from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.group import GroupCreate, GroupUpdate
import math
from app.services.location import LocationService

class GroupService:
    def __init__(self, db: Session):
        self.db = db

    def create_group(self, group_data: GroupCreate, creator_id: int) -> Group:
        # Get creator's friends
        creator = self.db.query(User).filter(User.id == creator_id).first()
        if not creator:
            raise ValueError("Creator not found")
        
        creator_friend_ids = {friend.id for friend in creator.friends}
        
        # Check if all members are friends with the creator
        non_friend_members = [member_id for member_id in group_data.member_ids 
                            if member_id not in creator_friend_ids]
        if non_friend_members:
            raise ValueError(f"Users {non_friend_members} are not friends with the creator")

        # Create the group
        group = Group(
            name=group_data.name,
            description=group_data.description,
            radius=group_data.radius,
            created_by=creator_id
        )
        self.db.add(group)
        self.db.flush()  # Get the group ID

        # Add members
        for member_id in group_data.member_ids:
            member = GroupMember(
                group_id=group.id,
                user_id=member_id,
                is_admin=(member_id == creator_id)
            )
            self.db.add(member)

        # Add creator as a member if not already included
        if creator_id not in group_data.member_ids:
            creator_member = GroupMember(
                group_id=group.id,
                user_id=creator_id,
                is_admin=True
            )
            self.db.add(creator_member)

        self.db.commit()
        self.db.refresh(group)
        
        # Ensure we're returning the group with its group_members relationship
        return self.db.query(Group).filter(Group.id == group.id).first()

    def get_group(self, group_id: int) -> Optional[Group]:
        return self.db.query(Group).filter(Group.id == group_id).first()

    def update_group_radius(self, group_id: int, radius: float) -> Optional[Group]:
        group = self.get_group(group_id)
        if group:
            group.radius = radius
            self.db.commit()
            self.db.refresh(group)
        return group

    def calculate_centroid(self, group_id: int) -> Optional[dict]:
        group = self.get_group(group_id)
        if not group:
            return None

        # Get all member locations
        member_locations = []
        for member in group.members:
            location = LocationService(self.db).get_user_default_location(member.id)
            if location:
                member_locations.append({
                    'latitude': location.latitude,
                    'longitude': location.longitude
                })

        if not member_locations:
            return None

        # Calculate centroid
        total_lat = sum(loc['latitude'] for loc in member_locations)
        total_lng = sum(loc['longitude'] for loc in member_locations)
        count = len(member_locations)

        return {
            'latitude': total_lat / count,
            'longitude': total_lng / count,
            'radius': group.radius
        }

    def get_nearby_restaurants(self, group_id: int) -> List[dict]:
        centroid = self.calculate_centroid(group_id)
        if not centroid:
            return []

        # TODO: Implement restaurant search using Google Places API
        # This will be implemented in the next step
        return []

    def get_restaurant_recommendations(self, group_id: int, restaurant_id: str) -> List[str]:
        # TODO: Implement AI recommendations
        # This will be implemented in the next step
        return []

    def get_user_groups(self, user_id: int) -> List[Group]:
        """Get all groups a user is a member of"""
        return self.db.query(Group).join(GroupMember).filter(GroupMember.user_id == user_id).all()

    def add_member_to_group(self, group_id: int, user_id: int, added_by_id: int) -> Group:
        """Add a new member to the group if they are friends with the adder"""
        group = self.get_group(group_id)
        if not group:
            raise ValueError("Group not found")

        # Check if adder is a group member
        adder_member = self.db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == added_by_id
        ).first()
        if not adder_member:
            raise ValueError("You are not a member of this group")

        # Check if new member is a friend of the adder
        adder = self.db.query(User).filter(User.id == added_by_id).first()
        if not adder:
            raise ValueError("Adder not found")
        
        if not any(friend.id == user_id for friend in adder.friends):
            raise ValueError("You can only add friends to the group")

        # Add new member
        new_member = GroupMember(
            group_id=group_id,
            user_id=user_id,
            is_admin=False
        )
        self.db.add(new_member)
        self.db.commit()
        self.db.refresh(group)
        return group 