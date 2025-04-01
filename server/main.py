import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the FastAPI app
app = FastAPI(
    title="TrendDrop API",
    description="API for TrendDrop Product Research Tool",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(api_router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

# Startup event to run when the server starts
@app.on_event("startup")
async def startup_event():
    """Initialize resources at startup"""
    logger.info("Starting TrendDrop API server")
    
    # Import at function level to avoid circular imports
    from app.db.database import get_db, SessionLocal
    from app.api.scraper_routes import check_and_start_scraper_if_needed
    
    # Create a database session for initialization
    db = SessionLocal()
    try:
        # Check and auto-start the scraper if needed
        await check_and_start_scraper_if_needed(db)
    except Exception as e:
        logger.error(f"Error during startup: {e}")
    finally:
        db.close()
    
    logger.info("TrendDrop API server initialized successfully")

# Shutdown event to run when the server stops
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources at shutdown"""
    logger.info("Shutting down TrendDrop API server")

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)