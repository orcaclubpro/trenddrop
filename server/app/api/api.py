"""
API module for TrendDrop - Trendtracker

This module sets up the FastAPI application and includes all routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.app.api.product_routes import router as product_router
from server.app.api.scraper_routes import router as scraper_router

def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application
    
    Returns:
        FastAPI: Configured FastAPI application
    """
    # Create FastAPI app
    app = FastAPI(
        title="TrendDrop - Trendtracker API",
        description="API for TrendDrop - Trendtracker",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json"
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add routers
    app.include_router(product_router, prefix="/api")
    app.include_router(scraper_router, prefix="/api")
    
    return app