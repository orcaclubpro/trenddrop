from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.base import TimeStampedBase

class Product(Base, TimeStampedBase):
    __tablename__ = "products"
    
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    subcategory = Column(String)
    price_range_low = Column(Float, nullable=False)
    price_range_high = Column(Float, nullable=False)
    trend_score = Column(Integer, nullable=False)
    engagement_rate = Column(Integer, nullable=False)
    sales_velocity = Column(Integer, nullable=False)
    search_volume = Column(Integer, nullable=False)
    geographic_spread = Column(Integer, nullable=False)
    
    # Relationships
    trends = relationship("Trend", back_populates="product", cascade="all, delete-orphan")
    regions = relationship("Region", back_populates="product", cascade="all, delete-orphan")
    videos = relationship("Video", back_populates="product", cascade="all, delete-orphan")