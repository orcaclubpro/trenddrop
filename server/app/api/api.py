from fastapi import APIRouter

from app.api.scraper_routes import router as scraper_router
from app.api.product_routes import router as product_router

# Create the main API router
api_router = APIRouter()

# Include the scraper routes at /scraper
api_router.include_router(scraper_router, prefix="/scraper", tags=["scraper"])

# Include the product routes at /products
api_router.include_router(product_router, prefix="/products", tags=["products"])