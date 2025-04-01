"""
Trend model module for TrendDrop - Trendtracker

This module provides the trend model for historical trend data.
"""

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from server.app.db.database import Base
from server.app.models.base import TimeStampedBase

class Trend(Base, TimeStampedBase):
    """Trend model for storing historical trend data for products"""
    __tablename__ = "trends"
    
    # Foreign key to product
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    # Date of trend measurement
    date = Column(DateTime, nullable=False, index=True)
    
    # Trend metrics for this date
    engagement_value = Column(Integer, nullable=False)
    sales_value = Column(Integer, nullable=False)
    search_value = Column(Integer, nullable=False)
    
    # Relationship back to product
    product = relationship("Product", back_populates="trends")