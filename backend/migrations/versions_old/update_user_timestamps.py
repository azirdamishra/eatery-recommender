"""update user timestamps

Revision ID: update_user_timestamps
Revises: 8a826d46d46d
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'update_user_timestamps'
down_revision = '8a826d46d46d'
branch_labels = None
depends_on = None

def upgrade():
    # Update existing users with default values
    op.execute("""
        UPDATE users 
        SET is_active = true,
            created_at = NOW(),
            updated_at = NOW()
        WHERE created_at IS NULL
    """)

def downgrade():
    # No downgrade needed as we're just setting default values
    pass 