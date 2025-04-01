from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api.api import api_router
from app.db.database import create_db_and_tables, get_db

app = FastAPI(title="TrendDrop API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Mount static files for the frontend
if os.path.exists("../client/dist"):
    app.mount("/", StaticFiles(directory="../client/dist", html=True), name="static")

@app.on_event("startup")
async def startup_event():
    # Initialize database
    create_db_and_tables()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
