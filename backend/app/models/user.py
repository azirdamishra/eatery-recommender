from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

#Association table for friends
friends = Table(
    'friends',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('friend_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    # Friend relationships
    friends = relationship(
        "User",
        secondary=friends,
        primaryjoin=(id == friends.c.user_id),
        secondaryjoin=(id == friends.c.friend_id),
        backref="friend_of"
    )

    #Friend request relationships
    sent_friend_requests = relationship(
        "FriendRequest",
        foreign_keys="FriendRequest.sender_id",
        back_populates="sender",
        cascade="all, delete-orphan"
    )
    received_friend_requests = relationship(
        "FriendRequest",
        foreign_keys="FriendRequest.receiver_id",
        back_populates="receiver",
        cascade="all, delete-orphan"
    )

    # Location relationships
    location = relationship("UserLocation", back_populates="user", uselist=False)
    landmarks = relationship("SavedLandmark", back_populates="user")
    
    # Group relationships
    # This gives direct access to groups
    groups = relationship(
        "Group",
        secondary="group_members",
        back_populates="members",
        viewonly=True  # This relationship won't try to manage the foreign key
    )
    # This gives access to membership details
    group_memberships = relationship(
        "GroupMember",
        back_populates="user",
        overlaps="groups"  # Tell SQLAlchemy these relationships overlap
    )
    # This gives access to groups created by the user
    created_groups = relationship(
        "Group",
        foreign_keys="Group.created_by",
        back_populates="creator"
    )
    
    
