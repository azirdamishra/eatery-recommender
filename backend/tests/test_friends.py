import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import Base, engine, get_db
from app.models.user import User
from app.models.friend import FriendRequest, FriendRequestStatus
#from app.core.security import create_access_token
from app.utils.user_utils import create_access_token

client = TestClient(app)

# Test data
test_user1 = {
    "username": "testuser1",
    "email": "test1@example.com",
    "password": "testpass123"
}

test_user2 = {
    "username": "testuser2",
    "email": "test2@example.com",
    "password": "testpass123"
}

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    try: 
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def test_users(db_session):
    #create test users
    user1 = User(**test_user1)
    user2 = User(**test_user2)
    db_session.add(user1)
    db_session.add(user2)
    db_session.commit()  # Add commit to ensure users are saved
    return user1, user2

def test_send_friend_request(db_session, test_users):
    user1, user2 = test_users

    #Create access token for user1
    access_token = create_access_token({"sub": user1.username})
    headers = {"Authorization" : f"Bearer {access_token}"}

    #Send friend request
    response = client.post(
        "/friends/friend-requests",
        json ={"receiver_id": user2.id},
        headers = headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["sender_id"] == user1.id
    assert data["receiver_id"] == user2.id
    assert data["status"] == "pending"

def test_get_friend_requests(db_session, test_users):
    user1 , user2 = test_users
    
    #Create friend request
    friend_request = FriendRequest(
        sender_id = user1.id,
        receiver_id = user2.id
    )
    db_session.add(friend_request)
    db_session.commit()

    #Get friend requests as user2
    access_token = create_access_token({"sub" : user2.username})
    headers = {"Authorization": f"Bearer {access_token}"}

    response = client.get("/friends/friend-requests", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["sender_id"] == user1.id
    assert data[0]["receiver_id"] == user2.id

def test_accept_friend_request(db_session, test_users):
    user1, user2 = test_users

    #Create friend request
    friend_request = FriendRequest(
        sender_id = user1.id,
        receiver_id = user2.id
    )
    db_session.add(friend_request)
    db_session.commit()

   #Accept friend request as user2
    access_token = create_access_token({"sub" : user2.username})
    headers = {"Authorization": f"Bearer {access_token}"}

    response = client.put(
        f"/friends/friend-requests/{friend_request.id}",
        json={"status" : "accepted"},
        headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"

    #Verify friendship was created
    user1 = db_session.query(User).filter(User.id == user1.id).first()
    user2 = db_session.query(User).filter(User.id == user2.id).first()
    assert user2 in user1.friends
    assert user1 in user2.friends

def test_get_friends(db_session, test_users):
    user1, user2 = test_users

    #Create friendship
    user1.friends.append(user2)
    user2.friends.append(user1)
    db_session.commit()  # Add commit to ensure friendship is saved

    # Get friends as user1
    access_token = create_access_token({"sub" : user1.username})
    headers = {"Authorization" : f"Bearer {access_token}"}

    response = client.get("/friends/friends", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == user2.id
    assert data[0]["username"] == user2.username

    