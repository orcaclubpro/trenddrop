import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Get database URL from environment variables or use SQLite as fallback
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./trenddrop.db")

# Create the SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Create a sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the base class for declarative models
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