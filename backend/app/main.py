from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.base_router import base_router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # This will print logs to console
    ]
)

app = FastAPI(title="Eatery Recommender")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(base_router)

@app.get("/")
def root():
    return {"message": "Welcome to Eatery Recommender!"}
