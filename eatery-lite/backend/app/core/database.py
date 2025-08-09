from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL - using SQLite for simplicity
SQLITE_DATABASE_URL = "sqlite:///./eatery_lite.db"

# Create engine
engine = create_engine(
    SQLITE_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Only needed for SQLite
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)
