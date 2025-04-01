"""
Database connection module for TrendDrop - Trendtracker

This module provides database connection utilities for the application.
"""

import os
import logging
from typing import Generator

import sqlalchemy
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy_utils import database_exists, create_database
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

# Create SQLAlchemy engine
engine = sqlalchemy.create_engine(DATABASE_URL)

# Create all tables in the engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for database models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get DB session.
    Use this with FastAPI's Depends() in route functions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize the database connection.
    Creates the database if it doesn't exist.
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