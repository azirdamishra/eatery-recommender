from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.group import GroupCreate, GroupUpdate
import math
from app.services.location import LocationService

class GroupService:
    def __init__(self, db: Session):
        self.db = db

    def _verify_admin_permissions(self, group_id: int, user_id: int) -> bool:
        """Helper method to verify if user is an admin of the group"""
        admin_member = self.db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
            GroupMember.is_admin == True
        ).first()
        return admin_member is not None

    def _verify_group_membership(self, group_id: int, user_id: int) -> bool:
        """Helper method to verify if user is a member of the group"""
        member = self.db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).first()
        return member is not None

    def _get_group_member(self, group_id: int, user_id: int) -> Optional[GroupMember]:
        """Helper method to get a specific group member"""
        return self.db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id
        ).first()

    def _count_admins(self, group_id: int) -> int:
        """Helper method to count the number of admins in a group"""
        return self.db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.is_admin == True
        ).count()

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

    def get_group_with_member_details(self, group_id: int) -> Optional[dict]:
        """Get group with detailed member information including usernames and emails"""
        group = self.get_group(group_id)
        if not group:
            return None

        members_with_details = []
        for member in group.group_members:
            user = self.db.query(User).filter(User.id == member.user_id).first()
            if user:
                members_with_details.append({
                    'id': member.id,
                    'user_id': member.user_id,
                    'group_id': member.group_id,
                    'is_admin': member.is_admin,
                    'joined_at': member.joined_at,
                    'username': user.username,
                    'email': user.email
                })

        return {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'radius': group.radius,
            'created_by': group.created_by,
            'created_at': group.created_at,
            'group_members': members_with_details
        }

    def update_group_radius(self, group_id: int, radius: float) -> Optional[Group]:
        group = self.get_group(group_id)
        if group:
            group.radius = radius
            self.db.commit()
            self.db.refresh(group)
        return group

    # ============= ADMIN-ONLY FUNCTIONS =============

    def admin_update_group(self, group_id: int, admin_id: int, update_data: dict) -> Group:
        """Admin-only function to update group settings"""
        # Verify admin permissions
        if not self._verify_admin_permissions(group_id, admin_id):
            raise ValueError("Only group admins can update group settings")

        group = self.get_group(group_id)
        if not group:
            raise ValueError("Group not found")

        # Update fields if provided
        if 'name' in update_data and update_data['name'] is not None:
            if not update_data['name'].strip():
                raise ValueError("Group name cannot be empty")
            group.name = update_data['name'].strip()

        if 'description' in update_data and update_data['description'] is not None:
            group.description = update_data['description'].strip() if update_data['description'].strip() else None

        if 'radius' in update_data and update_data['radius'] is not None:
            if update_data['radius'] <= 0 or update_data['radius'] > 100:
                raise ValueError("Radius must be between 0.1 and 100 kilometers")
            group.radius = update_data['radius']

        self.db.commit()
        self.db.refresh(group)
        return group

    def admin_remove_member(self, group_id: int, admin_id: int, member_id: int) -> Group:
        """Admin-only function to remove a member from the group"""
        # Verify admin permissions
        if not self._verify_admin_permissions(group_id, admin_id):
            raise ValueError("Only group admins can remove members")

        # Cannot remove yourself
        if admin_id == member_id:
            raise ValueError("Admins cannot remove themselves. Use leave group functionality instead")

        # Get the member to remove
        member_to_remove = self._get_group_member(group_id, member_id)
        if not member_to_remove:
            raise ValueError("Member not found in this group")

        # If removing an admin, ensure there's at least one admin left
        if member_to_remove.is_admin:
            remaining_admins = self._count_admins(group_id) - 1
            if remaining_admins < 1:
                raise ValueError("Cannot remove the last admin. Promote another member to admin first")

        # Remove the member
        self.db.delete(member_to_remove)
        self.db.commit()

        # Return updated group
        return self.get_group(group_id)

    def admin_promote_member(self, group_id: int, admin_id: int, member_id: int) -> Group:
        """Admin-only function to promote a member to admin"""
        # Verify admin permissions
        if not self._verify_admin_permissions(group_id, admin_id):
            raise ValueError("Only group admins can promote members")

        # Get the member to promote
        member_to_promote = self._get_group_member(group_id, member_id)
        if not member_to_promote:
            raise ValueError("Member not found in this group")

        if member_to_promote.is_admin:
            raise ValueError("Member is already an admin")

        # Promote to admin
        member_to_promote.is_admin = True
        self.db.commit()

        return self.get_group(group_id)

    def admin_demote_member(self, group_id: int, admin_id: int, member_id: int) -> Group:
        """Admin-only function to demote an admin to regular member"""
        # Verify admin permissions
        if not self._verify_admin_permissions(group_id, admin_id):
            raise ValueError("Only group admins can demote other admins")

        # Cannot demote yourself
        if admin_id == member_id:
            raise ValueError("Admins cannot demote themselves")

        # Get the member to demote
        member_to_demote = self._get_group_member(group_id, member_id)
        if not member_to_demote:
            raise ValueError("Member not found in this group")

        if not member_to_demote.is_admin:
            raise ValueError("Member is not an admin")

        # Ensure there's at least one admin left after demotion
        remaining_admins = self._count_admins(group_id) - 1
        if remaining_admins < 1:
            raise ValueError("Cannot demote the last admin. There must be at least one admin in the group")

        # Demote from admin
        member_to_demote.is_admin = False
        self.db.commit()

        return self.get_group(group_id)

    def admin_add_member(self, group_id: int, admin_id: int, new_member_id: int) -> Group:
        """Admin-only function to add a new member to the group"""
        # Verify admin permissions
        if not self._verify_admin_permissions(group_id, admin_id):
            raise ValueError("Only group admins can add new members")

        group = self.get_group(group_id)
        if not group:
            raise ValueError("Group not found")

        # Check if user is already a member
        existing_member = self._get_group_member(group_id, new_member_id)
        if existing_member:
            raise ValueError("User is already a member of this group")

        # Check if new member exists
        new_user = self.db.query(User).filter(User.id == new_member_id).first()
        if not new_user:
            raise ValueError("User not found")

        # Check if new member is a friend of the admin
        admin = self.db.query(User).filter(User.id == admin_id).first()
        if not admin:
            raise ValueError("Admin not found")
        
        if not any(friend.id == new_member_id for friend in admin.friends):
            raise ValueError("You can only add friends to the group")

        # Add new member
        new_member = GroupMember(
            group_id=group_id,
            user_id=new_member_id,
            is_admin=False
        )
        self.db.add(new_member)
        self.db.commit()
        
        # Return updated group
        return self.get_group(group_id)

    def admin_delete_group(self, group_id: int, admin_id: int) -> bool:
        """Admin-only function to permanently delete a group"""
        # Verify admin permissions
        if not self._verify_admin_permissions(group_id, admin_id):
            raise ValueError("Only group admins can delete the group")

        group = self.get_group(group_id)
        if not group:
            raise ValueError("Group not found")

        # Delete all group members first (due to foreign key constraints)
        self.db.query(GroupMember).filter(GroupMember.group_id == group_id).delete()
        
        # Delete the group
        self.db.delete(group)
        self.db.commit()

        return True

    def leave_group(self, group_id: int, user_id: int) -> bool:
        """Allow any member to leave the group (non-admin function)"""
        member = self._get_group_member(group_id, user_id)
        if not member:
            raise ValueError("You are not a member of this group")

        # If leaving member is an admin, check if there are other admins
        if member.is_admin:
            remaining_admins = self._count_admins(group_id) - 1
            if remaining_admins < 1:
                # Get total members count
                total_members = self.db.query(GroupMember).filter(GroupMember.group_id == group_id).count()
                if total_members > 1:
                    raise ValueError("Cannot leave group as the last admin. Promote another member to admin first or delete the group")

        # Remove the member
        self.db.delete(member)
        self.db.commit()

        # Check if group is now empty and auto-delete if so
        remaining_members = self.db.query(GroupMember).filter(GroupMember.group_id == group_id).count()
        if remaining_members == 0:
            group = self.get_group(group_id)
            if group:
                self.db.delete(group)
                self.db.commit()

        return True

    # ============= EXISTING FUNCTIONS =============

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
        return self.db.query(Group).join(GroupMember).filter(GroupMember.user_id == user_id).options(
            joinedload(Group.group_members)
        ).all()

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

        # Check if user is already a member
        existing_member = self._get_group_member(group_id, user_id)
        if existing_member:
            raise ValueError("User is already a member of this group")

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

    def get_member_locations(self, group_id: int) -> List[dict]:
        """Get locations of all group members"""
        group = self.get_group(group_id)
        if not group:
            return None

        location_service = LocationService(self.db)
        member_locations = []

        for member in group.group_members:
            user = self.db.query(User).filter(User.id == member.user_id).first()
            if not user:
                continue

            location = location_service.get_user_default_location(member.user_id)
            member_locations.append({
                'user_id': member.user_id,
                'username': user.username,
                'latitude': location.latitude if location else None,
                'longitude': location.longitude if location else None,
                'has_location': bool(location)
            })

        return member_locations 