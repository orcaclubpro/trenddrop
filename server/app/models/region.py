from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.base import TimeStampedBase

class Region(Base, TimeStampedBase):
    __tablename__ = "regions"
    
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    country = Column(String, nullable=False)
    percentage = Column(Integer, nullable=False)
    
    # Relationships
    product = relationship("Product", back_populates="regions")