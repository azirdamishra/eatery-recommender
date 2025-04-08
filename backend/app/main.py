from fastapi import FastAPI
from app.api import base_router

app = FastAPI(title="Eatery Recommender")

app.include_router(base_router)

@app.get("/")
def root():
    return {"message": "Welcome to Eatery Recommender!"}
