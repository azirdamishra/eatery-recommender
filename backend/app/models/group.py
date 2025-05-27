from sqlalchemy import Column, Integer, String, Float, ForeignKey, Table, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    radius = Column(Float, default=1.0)  # Default radius in kilometers
    created_by = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.utcnow)
    
    # Relationships
    # This gives direct access to members
    members = relationship(
        "User",
        secondary="group_members",
        back_populates="groups",
        viewonly=True  # This relationship won't try to manage the foreign key
    )
    # This gives access to the creator
    creator = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="created_groups"
    )
    # This gives access to membership details
    group_members = relationship(
        "GroupMember",
        back_populates="group",
        overlaps="members"  # Tell SQLAlchemy these relationships overlap
    )

class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey('groups.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    is_admin = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group = relationship(
        "Group",
        back_populates="group_members",
        overlaps="members"  # Tell SQLAlchemy these relationships overlap
    )
    user = relationship(
        "User",
        back_populates="group_memberships",
        overlaps="groups"  # Tell SQLAlchemy these relationships overlap
    ) 