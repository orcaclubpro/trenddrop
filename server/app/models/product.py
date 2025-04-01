"""
Product model module for TrendDrop - Trendtracker

This module provides the product model.
"""

from sqlalchemy import Column, String, Float, Integer
from sqlalchemy.orm import relationship

from server.app.db.database import Base
from server.app.models.base import TimeStampedBase

class Product(Base, TimeStampedBase):
    """Product model for storing trending product information"""
    __tablename__ = "products"
    
    # Basic product information
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    subcategory = Column(String)
    price_range_low = Column(Float, nullable=False)
    price_range_high = Column(Float, nullable=False)
    
    # Trend metrics
    trend_score = Column(Integer, nullable=False)
    engagement_rate = Column(Integer, nullable=False)
    sales_velocity = Column(Integer, nullable=False)
    search_volume = Column(Integer, nullable=False)
    geographic_spread = Column(Integer, nullable=False)
    
    # Media
    image_url = Column(String)
    
    # Additional information
    description = Column(String)
    
    # Source information
    source_platform = Column(String)
    
    # Wholesaler links
    aliexpress_url = Column(String)
    cjdropshipping_url = Column(String)
    
    # Relationships
    trends = relationship("Trend", back_populates="product", cascade="all, delete-orphan")
    regions = relationship("Region", back_populates="product", cascade="all, delete-orphan")
    videos = relationship("Video", back_populates="product", cascade="all, delete-orphan")