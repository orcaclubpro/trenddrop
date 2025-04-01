"""
Database initialization script for TrendDrop - Trendtracker

This script creates all database tables required by the application.
Run this script before starting the application for the first time.
"""

import logging
from sqlalchemy_utils import database_exists, create_database

from app.db.database import engine, Base
from app.models.product import Product
from app.models.trend import Trend
from app.models.region import Region
from app.models.video import Video

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    """
    Initialize the database by creating all tables
    """
    logger.info("Initializing database...")
    
    # Create database if it doesn't exist
    if not database_exists(engine.url):
        create_database(engine.url)
        logger.info(f"Created database at {engine.url}")
    
    # Create tables
    logger.info("Creating tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

if __name__ == "__main__":
    init_db()