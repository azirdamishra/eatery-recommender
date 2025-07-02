from app.core.database import engine, Base
from app.models import User, FriendRequest, Group, GroupMember
from app.models.location import UserLocation, SavedLandmark

def init_db():
    # Drop all tables first
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped.")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")
    
if __name__ == "__main__":
    init_db()