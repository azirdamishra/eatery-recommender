from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import groups_router
from app.core.database import create_tables
from app.models import Base
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

# Create FastAPI app
app = FastAPI(
    title="Eatery Lite API",
    description="Simple API for sharing locations with friends",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(groups_router)

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to Eatery Lite API!",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Startup event to create tables
@app.on_event("startup")
def startup_event():
    logging.info("Starting up Eatery Lite API...")
    create_tables()
    logging.info("Database tables created successfully!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
