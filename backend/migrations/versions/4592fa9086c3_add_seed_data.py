"""add_seed_data

Revision ID: 4592fa9086c3
Revises: c5ed7598750d
Create Date: 2025-06-30 22:43:11.123533

"""
from typing import Sequence, Union
from datetime import datetime, timedelta
import bcrypt

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer, Float, Boolean, DateTime


# revision identifiers, used by Alembic.
revision: str = '4592fa9086c3'
down_revision: Union[str, None] = 'c5ed7598750d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def upgrade() -> None:
    """Add seed data to all tables."""
    
    # Define table structures for data insertion
    users_table = table('users',
        column('id', Integer),
        column('username', String),
        column('email', String),
        column('password', String),  # Now properly hashed
        column('is_active', Boolean),
        column('created_at', DateTime),
        column('updated_at', DateTime)
    )
    
    groups_table = table('groups',
        column('id', Integer),
        column('name', String),
        column('description', String),
        column('radius', Float),
        column('created_by', Integer),
        column('created_at', DateTime),
        column('updated_at', DateTime)
    )
    
    friends_table = table('friends',
        column('user_id', Integer),
        column('friend_id', Integer)
    )
    
    friend_requests_table = table('friend_requests',
        column('id', Integer),
        column('sender_id', Integer),
        column('receiver_id', Integer),
        column('status', String),
        column('created_at', DateTime),
        column('updated_at', DateTime)
    )
    
    group_members_table = table('group_members',
        column('id', Integer),
        column('group_id', Integer),
        column('user_id', Integer),
        column('is_admin', Boolean),
        column('joined_at', DateTime)
    )
    
    saved_landmarks_table = table('saved_landmarks',
        column('id', Integer),
        column('user_id', Integer),
        column('name', String),
        column('latitude', Float),
        column('longitude', Float),
        column('description', String),
        column('is_current', Boolean),
        column('created_at', DateTime)
    )
    
    user_locations_table = table('user_locations',
        column('id', Integer),
        column('user_id', Integer),
        column('latitude', Float),
        column('longitude', Float),
        column('last_updated', DateTime)
    )
    
    # Current time for timestamps
    now = datetime.utcnow()
    
    # 1. INSERT USERS with properly hashed passwords
    op.bulk_insert(users_table, [
        {
            'id': 1,
            'username': 'alice_foodie',
            'email': 'alice@example.com',
            'password': hash_password('password123'),  # Hashed: password123
            'is_active': True,
            'created_at': now - timedelta(days=30),
            'updated_at': now - timedelta(days=30)
        },
        {
            'id': 2,
            'username': 'bob_chef',
            'email': 'bob@example.com',
            'password': hash_password('password456'),  # Hashed: password456
            'is_active': True,
            'created_at': now - timedelta(days=25),
            'updated_at': now - timedelta(days=25)
        },
        {
            'id': 3,
            'username': 'charlie_eater',
            'email': 'charlie@example.com',
            'password': hash_password('password789'),  # Hashed: password789
            'is_active': True,
            'created_at': now - timedelta(days=20),
            'updated_at': now - timedelta(days=20)
        },
        {
            'id': 4,
            'username': 'diana_critic',
            'email': 'diana@example.com',
            'password': hash_password('password101'),  # Hashed: password101
            'is_active': True,
            'created_at': now - timedelta(days=15),
            'updated_at': now - timedelta(days=15)
        },
        {
            'id': 5,
            'username': 'eve_explorer',
            'email': 'eve@example.com',
            'password': hash_password('password202'),  # Hashed: password202
            'is_active': False,  # Inactive user for testing
            'created_at': now - timedelta(days=10),
            'updated_at': now - timedelta(days=10)
        }
    ])
    
    # 2. INSERT GROUPS
    op.bulk_insert(groups_table, [
        {
            'id': 1,
            'name': 'Downtown Food Lovers',
            'description': 'Exploring the best restaurants in downtown area',
            'radius': 5.0,  # 5km radius
            'created_by': 1,  # Alice
            'created_at': now - timedelta(days=28),
            'updated_at': now - timedelta(days=28)
        },
        {
            'id': 2,
            'name': 'Lunch Break Squad',
            'description': 'Quick lunch spots for office workers',
            'radius': 2.5,  # 2.5km radius
            'created_by': 2,  # Bob
            'created_at': now - timedelta(days=22),
            'updated_at': now - timedelta(days=22)
        },
        {
            'id': 3,
            'name': 'Weekend Brunch Club',
            'description': 'Finding the perfect weekend brunch spots',
            'radius': 10.0,  # 10km radius
            'created_by': 3,  # Charlie
            'created_at': now - timedelta(days=18),
            'updated_at': now - timedelta(days=18)
        }
    ])
    
    # 3. INSERT FRIENDSHIPS (bidirectional relationships)
    op.bulk_insert(friends_table, [
        # Alice and Bob are friends
        {'user_id': 1, 'friend_id': 2},
        {'user_id': 2, 'friend_id': 1},
        
        # Alice and Charlie are friends
        {'user_id': 1, 'friend_id': 3},
        {'user_id': 3, 'friend_id': 1},
        
        # Bob and Diana are friends
        {'user_id': 2, 'friend_id': 4},
        {'user_id': 4, 'friend_id': 2},
        
        # Charlie and Diana are friends
        {'user_id': 3, 'friend_id': 4},
        {'user_id': 4, 'friend_id': 3}
    ])
    
    # 4. INSERT FRIEND REQUESTS
    op.bulk_insert(friend_requests_table, [
        {
            'id': 1,
            'sender_id': 1,  # Alice
            'receiver_id': 4,  # Diana
            'status': 'PENDING',
            'created_at': now - timedelta(days=5),
            'updated_at': now - timedelta(days=5)
        },
        {
            'id': 2,
            'sender_id': 5,  # Eve
            'receiver_id': 2,  # Bob
            'status': 'PENDING',
            'created_at': now - timedelta(days=3),
            'updated_at': now - timedelta(days=3)
        },
        {
            'id': 3,
            'sender_id': 3,  # Charlie
            'receiver_id': 5,  # Eve
            'status': 'DECLINED',
            'created_at': now - timedelta(days=7),
            'updated_at': now - timedelta(days=6)
        }
    ])
    
    # 5. INSERT GROUP MEMBERS
    op.bulk_insert(group_members_table, [
        # Downtown Food Lovers group
        {'id': 1, 'group_id': 1, 'user_id': 1, 'is_admin': True, 'joined_at': now - timedelta(days=28)},   # Alice (creator)
        {'id': 2, 'group_id': 1, 'user_id': 2, 'is_admin': False, 'joined_at': now - timedelta(days=26)},  # Bob
        {'id': 3, 'group_id': 1, 'user_id': 3, 'is_admin': False, 'joined_at': now - timedelta(days=24)},  # Charlie
        
        # Lunch Break Squad
        {'id': 4, 'group_id': 2, 'user_id': 2, 'is_admin': True, 'joined_at': now - timedelta(days=22)},   # Bob (creator)
        {'id': 5, 'group_id': 2, 'user_id': 4, 'is_admin': False, 'joined_at': now - timedelta(days=20)},  # Diana
        
        # Weekend Brunch Club
        {'id': 6, 'group_id': 3, 'user_id': 3, 'is_admin': True, 'joined_at': now - timedelta(days=18)},   # Charlie (creator)
        {'id': 7, 'group_id': 3, 'user_id': 1, 'is_admin': False, 'joined_at': now - timedelta(days=16)},  # Alice
        {'id': 8, 'group_id': 3, 'user_id': 4, 'is_admin': True, 'joined_at': now - timedelta(days=14)},   # Diana (promoted to admin)
    ])
    
    # 6. INSERT SAVED LANDMARKS
    op.bulk_insert(saved_landmarks_table, [
        # Alice's landmarks (San Francisco area)
        {
            'id': 1,
            'user_id': 1,
            'name': 'Home - Alice',
            'latitude': 37.7749,
            'longitude': -122.4194,
            'description': 'My apartment in downtown SF',
            'is_current': True,  # Current location
            'created_at': now - timedelta(days=30)
        },
        {
            'id': 2,
            'user_id': 1,
            'name': 'Work - Tech Company',
            'latitude': 37.7849,
            'longitude': -122.4094,
            'description': 'Office building in SOMA',
            'is_current': False,
            'created_at': now - timedelta(days=29)
        },
        
        # Bob's landmarks (New York area)
        {
            'id': 3,
            'user_id': 2,
            'name': 'Home - Bob',
            'latitude': 40.7128,
            'longitude': -74.0060,
            'description': 'Apartment in Manhattan',
            'is_current': True,  # Current location
            'created_at': now - timedelta(days=25)
        },
        {
            'id': 4,
            'user_id': 2,
            'name': 'Favorite Restaurant',
            'latitude': 40.7589,
            'longitude': -73.9851,
            'description': 'Amazing Italian place in Times Square',
            'is_current': False,
            'created_at': now - timedelta(days=24)
        },
        
        # Charlie's landmarks (Los Angeles area)
        {
            'id': 5,
            'user_id': 3,
            'name': 'Home - Charlie',
            'latitude': 34.0522,
            'longitude': -118.2437,
            'description': 'House in downtown LA',
            'is_current': True,  # Current location
            'created_at': now - timedelta(days=20)
        },
        
        # Diana's landmarks (Chicago area)
        {
            'id': 6,
            'user_id': 4,
            'name': 'Home - Diana',
            'latitude': 41.8781,
            'longitude': -87.6298,
            'description': 'Condo in The Loop',
            'is_current': False,  # No current location set
            'created_at': now - timedelta(days=15)
        },
        {
            'id': 7,
            'user_id': 4,
            'name': 'University',
            'latitude': 41.7886,
            'longitude': -87.5987,
            'description': 'University of Chicago campus',
            'is_current': True,  # Current location
            'created_at': now - timedelta(days=14)
        }
    ])
    
    # 7. INSERT USER LOCATIONS (current GPS coordinates)
    op.bulk_insert(user_locations_table, [
        {
            'id': 1,
            'user_id': 1,  # Alice
            'latitude': 37.7749,
            'longitude': -122.4194,
            'last_updated': now - timedelta(hours=2)
        },
        {
            'id': 2,
            'user_id': 2,  # Bob
            'latitude': 40.7128,
            'longitude': -74.0060,
            'last_updated': now - timedelta(hours=1)
        },
        {
            'id': 3,
            'user_id': 3,  # Charlie
            'latitude': 34.0522,
            'longitude': -118.2437,
            'last_updated': now - timedelta(minutes=30)
        },
        {
            'id': 4,
            'user_id': 4,  # Diana
            'latitude': 41.7886,
            'longitude': -87.5987,
            'last_updated': now - timedelta(minutes=15)
        }
        # Eve (user 5) has no location data
    ])
    
    # 8. RESET SEQUENCES to avoid ID conflicts with future inserts
    # This ensures auto-increment starts from the correct next value
    op.execute("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))")
    op.execute("SELECT setval('groups_id_seq', (SELECT MAX(id) FROM groups))")
    op.execute("SELECT setval('friend_requests_id_seq', (SELECT MAX(id) FROM friend_requests))")
    op.execute("SELECT setval('group_members_id_seq', (SELECT MAX(id) FROM group_members))")
    op.execute("SELECT setval('saved_landmarks_id_seq', (SELECT MAX(id) FROM saved_landmarks))")
    op.execute("SELECT setval('user_locations_id_seq', (SELECT MAX(id) FROM user_locations))")


def downgrade() -> None:
    """Remove seed data."""
    # Delete in reverse order to respect foreign key constraints
    op.execute("DELETE FROM user_locations")
    op.execute("DELETE FROM saved_landmarks")
    op.execute("DELETE FROM group_members")
    op.execute("DELETE FROM friend_requests")
    op.execute("DELETE FROM friends")
    op.execute("DELETE FROM groups")
    op.execute("DELETE FROM users")
