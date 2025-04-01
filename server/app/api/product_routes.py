"""
Product routes module for TrendDrop - Trendtracker

This module provides API routes for product operations.
"""

import logging
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc

from server.app.db.database import get_db
from server.app.models.product import Product

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/products", tags=["products"])

@router.get("/")
async def get_products(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    category: Optional[str] = None,
    trend_score: Optional[int] = None,
    region: Optional[str] = None,
    sort_by: str = "trend_score",
    sort_order: str = "desc"
):
    """
    Get a list of trending products with pagination and filtering
    
    Args:
        page: Page number (1-indexed)
        limit: Number of results per page
        category: Filter by product category
        trend_score: Minimum trend score
        region: Filter by region
        sort_by: Field to sort by
        sort_order: Sort direction ('asc' or 'desc')
        
    Returns:
        List of products with pagination metadata
    """
    # Calculate offset
    offset = (page - 1) * limit
    
    # Start with base query
    query = db.query(Product)
    
    # Apply filters
    if category:
        query = query.filter(Product.category == category)
        
    if trend_score:
        query = query.filter(Product.trend_score >= trend_score)
        
    if region:
        # Filter by region requires a join with the regions table
        query = query.join(Product.regions).filter(
            Product.regions.any(country=region)
        )
    
    # Get total count (for pagination)
    total_count = query.count()
    
    # Apply sorting
    valid_sort_fields = {
        "trend_score": Product.trend_score,
        "created_at": Product.created_at,
        "name": Product.name,
        "category": Product.category,
        "engagement_rate": Product.engagement_rate,
        "sales_velocity": Product.sales_velocity,
        "search_volume": Product.search_volume
    }
    
    if sort_by not in valid_sort_fields:
        sort_by = "trend_score"
        
    sort_field = valid_sort_fields[sort_by]
    
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_field))
    else:
        query = query.order_by(desc(sort_field))
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    # Execute query
    products = query.all()
    
    # Format results
    result = {
        "items": [format_product(p) for p in products],
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit  # Ceiling division
    }
    
    return result

@router.get("/{product_id}")
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific product
    
    Args:
        product_id: The ID of the product
        
    Returns:
        Detailed product information
    """
    # Get product from database
    product = db.query(Product).filter(Product.id == product_id).first()
    
    # Check if product exists
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Return formatted product with details
    return format_product_with_details(product, db)

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """
    Get a list of all product categories
    
    Returns:
        List of category names
    """
    # Get distinct categories from database
    categories = db.query(Product.category).distinct().all()
    
    # Extract category names from result
    result = [c[0] for c in categories]
    
    return result

@router.get("/dashboard-summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Get summary statistics for the dashboard
    
    Returns:
        Summary metrics
    """
    # Get total product count
    total_products = db.query(func.count(Product.id)).scalar() or 0
    
    # Get count of products with high trend scores (80+)
    trending_products = db.query(func.count(Product.id)).filter(
        Product.trend_score >= 80
    ).scalar() or 0
    
    # Get average trend score
    avg_trend_score = db.query(func.avg(Product.trend_score)).scalar() or 0
    
    # Get most popular category
    category_counts = db.query(
        Product.category, 
        func.count(Product.id).label("count")
    ).group_by(Product.category).order_by(desc("count")).first()
    
    most_popular_category = category_counts[0] if category_counts else None
    
    # Get newest products (last 24 hours)
    from datetime import datetime, timedelta
    recent_cutoff = datetime.now() - timedelta(hours=24)
    
    new_products = db.query(func.count(Product.id)).filter(
        Product.created_at >= recent_cutoff
    ).scalar() or 0
    
    # Return summary data
    return {
        "total_products": total_products,
        "trending_products": trending_products,
        "avg_trend_score": round(float(avg_trend_score), 1),
        "most_popular_category": most_popular_category,
        "new_products_24h": new_products
    }

def format_product(product: Product) -> Dict[str, Any]:
    """Format a product for API response"""
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "subcategory": product.subcategory,
        "price_range": {
            "low": product.price_range_low,
            "high": product.price_range_high
        },
        "trend_score": product.trend_score,
        "engagement_rate": product.engagement_rate,
        "sales_velocity": product.sales_velocity,
        "search_volume": product.search_volume,
        "geographic_spread": product.geographic_spread,
        "image_url": product.image_url,
        "source_platform": product.source_platform,
        "created_at": product.created_at.isoformat() if product.created_at else None
    }
    
def format_product_with_details(product: Product, db: Session) -> Dict[str, Any]:
    """Format a product with all relationships for API response"""
    # Start with basic product info
    result = format_product(product)
    
    # Add full description
    result["description"] = product.description
    
    # Add wholesaler links
    result["wholesaler_links"] = {
        "aliexpress": product.aliexpress_url,
        "cjdropshipping": product.cjdropshipping_url
    }
    
    # Add trends data
    trends = []
    for trend in product.trends:
        trends.append({
            "date": trend.date.isoformat() if trend.date else None,
            "engagement_value": trend.engagement_value,
            "sales_value": trend.sales_value,
            "search_value": trend.search_value
        })
    
    result["trends"] = sorted(trends, key=lambda t: t["date"] if t["date"] else "")
    
    # Add regions data
    regions = []
    for region in product.regions:
        regions.append({
            "country": region.country,
            "percentage": region.percentage
        })
    
    result["regions"] = sorted(regions, key=lambda r: r["percentage"], reverse=True)
    
    # Add videos data
    videos = []
    for video in product.videos:
        videos.append({
            "title": video.title,
            "platform": video.platform,
            "views": video.views,
            "upload_date": video.upload_date.isoformat() if video.upload_date else None,
            "thumbnail_url": video.thumbnail_url,
            "video_url": video.video_url
        })
    
    result["videos"] = sorted(videos, key=lambda v: v["views"], reverse=True)
    
    return result