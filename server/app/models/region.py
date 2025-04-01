"""
Region model module for TrendDrop - Trendtracker

This module provides the region model for geographical trend data.
"""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from server.app.db.database import Base
from server.app.models.base import TimeStampedBase

class Region(Base, TimeStampedBase):
    """Region model for storing geographical trend data for products"""
    __tablename__ = "regions"
    
    # Foreign key to product
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    # Country or region name
    country = Column(String, nullable=False, index=True)
    
    # Percentage of interest from this region (0-100)
    percentage = Column(Integer, nullable=False)
    
    # Relationship back to product
    product = relationship("Product", back_populates="regions")