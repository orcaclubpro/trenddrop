"""
Base model module for TrendDrop - Trendtracker

This module provides a base model with timestamp fields.
"""

from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func

class TimeStampedBase:
    """Base class that includes created_at and updated_at fields"""
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)