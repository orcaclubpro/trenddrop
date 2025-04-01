# app/models/trend.py
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.base import TimeStampedBase

class Trend(Base, TimeStampedBase):
    __tablename__ = "trends"
    
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, nullable=False)
    engagement_value = Column(Integer, nullable=False)
    sales_value = Column(Integer, nullable=False)
    search_value = Column(Integer, nullable=False)
    
    # Relationship to product
    product = relationship("Product", back_populates="trends")
