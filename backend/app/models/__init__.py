"""
Database models for the Eatery Recommender application
"""

from .user import User
from .friend import FriendRequest

__all__ = ["User", "FriendRequest"]
