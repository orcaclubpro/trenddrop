# app/models/video.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.base import TimeStampedBase

class Video(Base, TimeStampedBase):
    __tablename__ = "videos"
    
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    platform = Column(String, nullable=False)
    views = Column(Integer, nullable=False)
    upload_date = Column(DateTime, nullable=False)
    thumbnail_url = Column(String, nullable=False)
    video_url = Column(String, nullable=False)
    
    # Relationship to product
    product = relationship("Product", back_populates="videos")
