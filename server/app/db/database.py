# app/db/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Directory for the SQLite database
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
os.makedirs(DB_DIR, exist_ok=True)

# Database URL for SQLite
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(DB_DIR, 'trenddrop.db')}"

# Create engine with SQLite configuration
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # SQLite specific argument
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()

def get_db():
    """
    Dependency function to get DB session.
    Use this with FastAPI's Depends() in route functions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
