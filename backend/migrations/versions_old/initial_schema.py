"""initial schema

Revision ID: initial_schema
Revises: 
Create Date: 2025-05-12 00:50:00.000000

"""
from typing import Sequence, Union
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from passlib.context import CryptContext

# revision identifiers, used by Alembic.
revision: str = 'initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    print("=== START upgrade() ===")
    ctx = op.get_context()
    ctx.impl.transactional_ddl = False  # prevent silent rollback
    # Create password context for hashing
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Drop existing enum type if it exists
    op.execute('DROP TYPE IF EXISTS friendrequeststatus CASCADE')
    
    # Create users table first
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Create friend_requests table with sequence
    op.execute('CREATE SEQUENCE friend_requests_id_seq')
    op.create_table('friend_requests',
        sa.Column('id', sa.Integer(), nullable=False, server_default=sa.text("nextval('friend_requests_id_seq')")),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('receiver_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'ACCEPTED', 'DECLINED', name='friendrequeststatus'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['receiver_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_friend_requests_id'), 'friend_requests', ['id'], unique=False)

    # Create friends table
    op.create_table('friends',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('friend_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['friend_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'friend_id')
    )

    # Insert test users with properly hashed passwords
    users = table('users',
        column('id', sa.Integer),
        column('username', sa.String),
        column('email', sa.String),
        column('password', sa.String)
    )
    
    op.bulk_insert(users, [
        {
            'id': 1, 
            'username': 'testuser1', 
            'email': 'test1@example.com', 
            'password': pwd_context.hash('password1')
        },
        {
            'id': 2, 
            'username': 'testuser2', 
            'email': 'test2@example.com', 
            'password': pwd_context.hash('password2')
        },
        {
            'id': 3, 
            'username': 'testuser3', 
            'email': 'test3@example.com', 
            'password': pwd_context.hash('password3')
        },
    ])

    # Insert test friend requests
    friend_requests = table('friend_requests',
        column('sender_id', sa.Integer),
        column('receiver_id', sa.Integer),
        column('status', sa.String),
        column('created_at', sa.DateTime),
        column('updated_at', sa.DateTime)
    )

    now = datetime.now()
    op.bulk_insert(friend_requests, [
        {
            'sender_id': 1,
            'receiver_id': 2,
            'status': 'PENDING',
            'created_at': now,
            'updated_at': now
        },
        {
            'sender_id': 2,
            'receiver_id': 3,
            'status': 'ACCEPTED',
            'created_at': now,
            'updated_at': now
        }
    ])

    # Insert test friendships
    friends = table('friends',
        column('user_id', sa.Integer),
        column('friend_id', sa.Integer)
    )

    op.bulk_insert(friends, [
        {
            'user_id': 2,
            'friend_id': 3
        },
        {
            'user_id': 3,
            'friend_id': 2
        }
    ])
    print("=== END upgrade() ===")

def downgrade() -> None:
    op.drop_table('friends')
    op.drop_index(op.f('ix_friend_requests_id'), table_name='friend_requests')
    op.drop_table('friend_requests')
    op.execute('DROP SEQUENCE IF EXISTS friend_requests_id_seq')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS friendrequeststatus CASCADE') 