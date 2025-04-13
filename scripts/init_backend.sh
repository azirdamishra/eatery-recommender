#!/bin/bash

echo "📁 Setting up backend directory structure..."

mkdir -p backend/app/{api,core,models,schemas,services,recommender,utils}
mkdir -p backend/tests

touch backend/requirements.txt
touch backend/Dockerfile
touch backend/.env

# main.py
cat <<EOF > backend/app/main.py
from fastapi import FastAPI
from app.api import base_router

app = FastAPI(title="Eatery Recommender")

app.include_router(base_router)

@app.get("/")
def root():
    return {"message": "Welcome to Eatery Recommender!"}
EOF

# base_router.py
mkdir -p backend/app/api
cat <<EOF > backend/app/api/base_router.py
from fastapi import APIRouter
from app.api import user

base_router = APIRouter()
base_router.include_router(user.router, prefix="/user", tags=["User"])
EOF

# sample user router
cat <<EOF > backend/app/api/user.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/register")
def register_user():
    return {"msg": "User registered"}

@router.post("/login")
def login_user():
    return {"msg": "User logged in"}
EOF

# config.py
cat <<EOF > backend/app/core/config.py
import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "changeme")
    ALGORITHM: str = "HS256"

settings = Settings()
EOF

# .env
cat <<EOF > backend/.env
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=supersecretkey
EOF

# requirements.txt
cat <<EOF > backend/requirements.txt
fastapi[all]
sqlalchemy
pydantic
python-dotenv
alembic
EOF

# Dockerfile
cat <<EOF > backend/Dockerfile
FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

# test
cat <<EOF > backend/tests/test_root.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json() == {"message": "Welcome to Eatery Recommender!"}
EOF

echo "✅ Backend structure initialized!"
echo "📦 To install dependencies:"
echo "   cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
echo "🚀 To run server:"
echo "   uvicorn app.main:app --reload"
