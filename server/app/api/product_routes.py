from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.database import get_db
from app.models.product import Product
from app.models.trend import Trend
from app.models.region import Region
from app.models.video import Video

router = APIRouter()

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
    # Build the query
    query = db.query(Product)
    
    # Apply filters
    if category:
        query = query.filter(Product.category == category)
    
    if trend_score:
        query = query.filter(Product.trend_score >= trend_score)
    
    if region:
        query = query.join(Region).filter(Region.country.ilike(f"%{region}%"))
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply sorting
    if sort_order.lower() == "desc":
        query = query.order_by(desc(getattr(Product, sort_by)))
    else:
        query = query.order_by(getattr(Product, sort_by))
    
    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit)
    
    # Get results
    products = query.all()
    
    # Format the response
    return {
        "items": [format_product(p) for p in products],
        "meta": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "pages": (total_count + limit - 1) // limit
        }
    }

@router.get("/{product_id}")
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific product
    
    Args:
        product_id: The ID of the product
        
    Returns:
        Detailed product information
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        return {"error": "Product not found"}
    
    # Format the full product with all related data
    return format_product_with_details(product, db)

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    """
    Get a list of all product categories
    
    Returns:
        List of category names
    """
    categories = db.query(Product.category).distinct().all()
    return {"categories": [cat[0] for cat in categories]}

@router.get("/dashboard-summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Get summary statistics for the dashboard
    
    Returns:
        Summary metrics
    """
    # Get total product count
    total_products = db.query(func.count(Product.id)).scalar() or 0
    
    # Get average trend score
    avg_trend_score = db.query(func.avg(Product.trend_score)).scalar() or 0
    
    # Get top categories
    top_categories_query = (
        db.query(
            Product.category, 
            func.count(Product.id).label("count")
        )
        .group_by(Product.category)
        .order_by(desc("count"))
        .limit(5)
    )
    top_categories = [
        {"name": cat, "count": count}
        for cat, count in top_categories_query.all()
    ]
    
    # Get latest products
    newest_products = db.query(Product).order_by(desc(Product.created_at)).limit(5).all()
    
    # Get top regions
    top_regions_query = (
        db.query(
            Region.country,
            func.count(Region.id).label("count")
        )
        .group_by(Region.country)
        .order_by(desc("count"))
        .limit(5)
    )
    top_regions = [
        {"name": region, "count": count}
        for region, count in top_regions_query.all()
    ]
    
    return {
        "total_products": total_products,
        "avg_trend_score": round(avg_trend_score, 1),
        "top_categories": top_categories,
        "top_regions": top_regions,
        "newest_products": [format_product(p) for p in newest_products]
    }

def format_product(product: Product) -> Dict[str, Any]:
    """Format a product for API response"""
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "subcategory": product.subcategory,
        "price_range_low": product.price_range_low,
        "price_range_high": product.price_range_high,
        "trend_score": product.trend_score,
        "engagement_rate": product.engagement_rate,
        "sales_velocity": product.sales_velocity,
        "search_volume": product.search_volume,
        "geographic_spread": product.geographic_spread,
        "created_at": product.created_at.isoformat(),
        "updated_at": product.updated_at.isoformat()
    }

def format_product_with_details(product: Product, db: Session) -> Dict[str, Any]:
    """Format a product with all relationships for API response"""
    # Get trends, regions and videos
    trends = db.query(Trend).filter(Trend.product_id == product.id).all()
    regions = db.query(Region).filter(Region.product_id == product.id).all()
    videos = db.query(Video).filter(Video.product_id == product.id).all()
    
    # Format as dictionary
    result = format_product(product)
    
    # Add relationships
    result["trends"] = [
        {
            "id": t.id,
            "date": t.date.isoformat(),
            "engagement_value": t.engagement_value,
            "sales_value": t.sales_value,
            "search_value": t.search_value
        }
        for t in trends
    ]
    
    result["regions"] = [
        {
            "id": r.id,
            "country": r.country,
            "percentage": r.percentage
        }
        for r in regions
    ]
    
    result["videos"] = [
        {
            "id": v.id,
            "title": v.title,
            "platform": v.platform,
            "views": v.views,
            "upload_date": v.upload_date.isoformat(),
            "thumbnail_url": v.thumbnail_url,
            "video_url": v.video_url
        }
        for v in videos
    ]
    
    return result