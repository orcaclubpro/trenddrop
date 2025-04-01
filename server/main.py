"""
Main module for TrendDrop - Trendtracker

This module starts the FastAPI server and handles lifecycle events.
"""

import asyncio
import logging
import os
from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from server.app.api.api import create_app
from server.app.db.database import init_db, get_db
from server.app.api.scraper_routes import check_and_start_scraper_if_needed

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = create_app()

# Add root endpoint
@app.get("/")
async def root():
    """
    Root endpoint that redirects to API documentation
    """
    return {
        "message": "Welcome to TrendDrop - Trendtracker API",
        "docs": "/api/docs",
        "redoc": "/api/redoc"
    }

# Add health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

# Add startup event handler
@app.on_event("startup")
async def startup_event():
    """Initialize resources at startup"""
    logger.info("Starting up TrendDrop - Trendtracker...")
    
    # Initialize database
    if init_db():
        logger.info("Database initialized successfully")
    else:
        logger.error("Failed to initialize database")
        
    # Start background tasks
    background_tasks = BackgroundTasks()
    background_tasks.add_task(start_background_tasks)
    
    logger.info("TrendDrop - Trendtracker startup complete")

# Add shutdown event handler
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources at shutdown"""
    logger.info("Shutting down TrendDrop - Trendtracker...")
    logger.info("Shutdown complete")

async def start_background_tasks():
    """Start background tasks"""
    logger.info("Starting background tasks...")
    
    # Get a database session
    # Note: This is a bit of a hack to get a DB session outside of a request context
    from sqlalchemy.orm import Session
    from server.app.db.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Check if we need to populate the database
        await check_and_start_scraper_if_needed(db)
    finally:
        db.close()
        
    logger.info("Background tasks started")

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variable or use default
    port = int(os.getenv("PYTHON_API_PORT", "8000"))
    
    # Start server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )