"""
Database initialization script for TrendDrop - Trendtracker

This script creates all database tables required by the application.
Run this script before starting the application for the first time.
"""

import logging
import os
import sys

from sqlalchemy_utils import database_exists, create_database

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server.app.db.database import engine, Base
from server.app.models import Product, Trend, Region, Video

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    """
    Initialize the database by creating all tables
    """
    try:
        # Check if database exists, create if it doesn't
        if not database_exists(engine.url):
            create_database(engine.url)
            logger.info(f"Created database at {engine.url}")
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    logger.info("Initializing database...")
    success = init_db()
    
    if success:
        logger.info("Database initialization completed successfully")
    else:
        logger.error("Database initialization failed")
        sys.exit(1)