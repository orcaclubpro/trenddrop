"""
Video model module for TrendDrop - Trendtracker

This module provides the video model for marketing videos.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from server.app.db.database import Base
from server.app.models.base import TimeStampedBase

class Video(Base, TimeStampedBase):
    """Video model for storing marketing videos related to products"""
    __tablename__ = "videos"
    
    # Foreign key to product
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    # Video information
    title = Column(String, nullable=False)
    platform = Column(String, nullable=False, index=True)
    views = Column(Integer, nullable=False)
    upload_date = Column(DateTime, nullable=False)
    
    # Media
    thumbnail_url = Column(String)
    video_url = Column(String, nullable=False)
    
    # Relationship back to product
    product = relationship("Product", back_populates="videos")