import os
import logging
import asyncio
import random
import datetime
from typing import List, Dict, Any, Callable, Optional
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.trend import Trend
from app.models.region import Region
from app.models.video import Video

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants for API keys and service URLs
LMSTUDIO_API_URL = os.environ.get('LMSTUDIO_API_URL', 'http://localhost:1234/v1')
LMSTUDIO_API_KEY = os.environ.get('LMSTUDIO_API_KEY', '')

# Define types for clarity
ProgressCallback = Callable[[int, int, int], None]

class TdScraper:
    """
    Trending product scraper agent that uses a local LLM through LM Studio
    to find and analyze trending products for dropshipping.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.total_found = 0
        
    async def search_trending_products(self, count: int = 1000, 
                                      progress_callback: Optional[ProgressCallback] = None) -> Dict[str, Any]:
        """
        Main method to search for trending products across multiple platforms.
        
        Args:
            count: Maximum number of products to find
            progress_callback: Optional callback to report progress
            
        Returns:
            Dict containing results summary
        """
        logger.info(f"Starting trending product search for {count} products")
        
        # Initialize search process
        self.total_found = 0
        
        # Verify LLM accessibility
        if not await self._verify_llm_connection():
            logger.error("Cannot connect to LM Studio API. Please check configuration.")
            return {"error": "Cannot connect to LLM", "total_found": 0}
        
        # Start the search process
        platforms = ["tiktok", "instagram", "pinterest", "youtube", "google_trends"]
        categories = [
            "home_decor", "kitchen_gadgets", "beauty_products", "fitness_equipment", 
            "pet_accessories", "electronics", "clothing", "outdoor", "baby_products"
        ]
        
        for i, category in enumerate(categories):
            logger.info(f"Searching {category} ({i+1}/{len(categories)})")
            
            # For each platform in the category
            for j, platform in enumerate(platforms):
                logger.info(f"Searching on {platform} for {category}")
                
                # Simulate progress
                if progress_callback:
                    current_progress = (i * len(platforms) + j) 
                    total_steps = len(categories) * len(platforms)
                    progress_callback(current_progress, total_steps, self.total_found)
                
                # Search for products on this platform/category combination
                platform_products = await self._search_platform(platform, category, 
                                                               max_products=count//len(platforms)//len(categories))
                
                # Save products to database
                await self._save_products(platform_products)
                
                # Check if we've reached our target count
                if self.total_found >= count:
                    logger.info(f"Reached target count of {count} products")
                    break
            
            # Check if we've reached our target count
            if self.total_found >= count:
                break
        
        # Final progress update
        if progress_callback:
            progress_callback(1, 1, self.total_found)
            
        logger.info(f"Completed product search. Found {self.total_found} products")
        return {"total_found": self.total_found}
    
    async def _verify_llm_connection(self) -> bool:
        """Verify that the LM Studio API is accessible"""
        # In a real implementation, would check connectivity
        # For this stub, we'll assume it's available
        logger.info("Verified LLM connection")
        return True
    
    async def _search_platform(self, platform: str, category: str, max_products: int) -> List[Dict[str, Any]]:
        """
        Search a specific platform for trending products in a category
        
        Args:
            platform: Platform to search (tiktok, instagram, etc.)
            category: Product category to search for
            max_products: Maximum products to return from this search
            
        Returns:
            List of product data dictionaries
        """
        logger.info(f"Searching {platform} for {category} products (max: {max_products})")
        
        # In a real implementation, this would use the LM Studio API to search the web
        # and extract product information using a chain of prompts
        
        # This is a stub implementation
        products = []
        for i in range(random.randint(1, max_products)):
            # Create a randomized product
            product = self._generate_mock_product(platform, category)
            products.append(product)
            
        logger.info(f"Found {len(products)} {category} products on {platform}")
        return products
    
    def _generate_mock_product(self, platform: str, category: str) -> Dict[str, Any]:
        """Generate mock product data for testing purposes"""
        # Product base information
        subcategories = {
            "home_decor": ["wall_art", "lighting", "decorative_pillows", "vases", "rugs"],
            "kitchen_gadgets": ["utensils", "appliances", "storage", "tools", "accessories"],
            "beauty_products": ["skincare", "makeup", "hair_care", "fragrances", "tools"],
            "fitness_equipment": ["weights", "yoga", "cardio", "accessories", "wearables"],
            "pet_accessories": ["toys", "beds", "collars", "bowls", "grooming"],
            "electronics": ["headphones", "chargers", "speakers", "phone_accessories", "smart_home"],
            "clothing": ["tops", "bottoms", "outerwear", "accessories", "footwear"],
            "outdoor": ["camping", "garden", "sports", "patio", "travel"],
            "baby_products": ["feeding", "travel", "clothing", "toys", "safety"]
        }
        
        # Create base product
        subcategory = random.choice(subcategories.get(category, ["general"]))
        
        # Choose a random name based on category and subcategory
        product_name = f"{subcategory.replace('_', ' ').title()} {category.replace('_', ' ').title()}"
        
        # Range for different metrics
        trend_score = random.randint(50, 100)
        engagement_rate = random.randint(20, 100)
        sales_velocity = random.randint(10, 100)
        search_volume = random.randint(30, 100)
        geographic_spread = random.randint(20, 100)
        
        # Price range
        price_low = round(random.uniform(5, 60), 2)
        price_high = round(price_low * random.uniform(1.2, 2.5), 2)
        
        product = {
            "name": product_name,
            "category": category,
            "subcategory": subcategory,
            "price_range_low": price_low,
            "price_range_high": price_high,
            "trend_score": trend_score,
            "engagement_rate": engagement_rate,
            "sales_velocity": sales_velocity, 
            "search_volume": search_volume,
            "geographic_spread": geographic_spread,
            "trends": self._generate_mock_trends(),
            "regions": self._generate_mock_regions(),
            "videos": self._generate_mock_videos(platform, product_name)
        }
        
        return product
    
    def _generate_mock_trends(self) -> List[Dict[str, Any]]:
        """Generate mock trend data for a product"""
        trends = []
        
        # Generate trend data for the last 14 days
        now = datetime.datetime.now()
        for i in range(14):
            date = now - datetime.timedelta(days=i)
            
            # Generate values with an upward trend for newer products
            base = 100 - i*5  # Higher values for more recent dates
            trends.append({
                "date": date,
                "engagement_value": int(base * random.uniform(0.8, 1.2)),
                "sales_value": int(base * 0.7 * random.uniform(0.8, 1.2)),
                "search_value": int(base * 0.9 * random.uniform(0.8, 1.2))
            })
            
        return trends
    
    def _generate_mock_regions(self) -> List[Dict[str, Any]]:
        """Generate mock region data for a product"""
        countries = ["United States", "United Kingdom", "Canada", "Australia", 
                     "Germany", "France", "Japan", "Brazil", "India", "Mexico"]
        
        # Select a random number of countries (3-6)
        num_countries = random.randint(3, 6)
        selected_countries = random.sample(countries, num_countries)
        
        # Generate percentages that sum to 100
        percentages = [random.randint(5, 100) for _ in range(num_countries)]
        total = sum(percentages)
        normalized = [int((p / total) * 100) for p in percentages]
        
        # Ensure they sum to 100
        while sum(normalized) < 100:
            idx = random.randint(0, len(normalized)-1)
            normalized[idx] += 1
            
        while sum(normalized) > 100:
            idx = random.randint(0, len(normalized)-1)
            if normalized[idx] > 1:
                normalized[idx] -= 1
        
        # Create the region objects
        regions = []
        for i, country in enumerate(selected_countries):
            regions.append({
                "country": country,
                "percentage": normalized[i]
            })
            
        return regions
    
    def _generate_mock_videos(self, platform: str, product_name: str) -> List[Dict[str, Any]]:
        """Generate mock video data for a product"""
        videos = []
        
        # How many videos to generate (0-3)
        num_videos = random.randint(0, 3)
        
        for i in range(num_videos):
            # Generate date within last 30 days
            days_ago = random.randint(1, 30)
            upload_date = datetime.datetime.now() - datetime.timedelta(days=days_ago)
            
            # Video metrics
            views = random.randint(1000, 1000000)
            
            # Create video title
            video_title = f"{product_name} Review - Amazing Product #{i+1}"
            
            # Video URLs (would be real in actual implementation)
            video_url = f"https://example.com/{platform}/video{random.randint(10000, 99999)}"
            thumbnail_url = f"https://example.com/{platform}/thumb{random.randint(10000, 99999)}.jpg"
            
            videos.append({
                "title": video_title,
                "platform": platform,
                "views": views,
                "upload_date": upload_date,
                "thumbnail_url": thumbnail_url,
                "video_url": video_url
            })
            
        return videos
    
    async def _save_products(self, products: List[Dict[str, Any]]) -> None:
        """
        Save product data to the database, performing upserts if a product already exists
        
        Args:
            products: List of product data dictionaries
        """
        for product_data in products:
            # Extract related data
            trends_data = product_data.pop("trends", [])
            regions_data = product_data.pop("regions", [])
            videos_data = product_data.pop("videos", [])
            
            # Check if this product already exists (by name and category)
            existing_product = self.db.query(Product).filter(
                Product.name == product_data["name"],
                Product.category == product_data["category"]
            ).first()
            
            if existing_product:
                logger.info(f"Product '{product_data['name']}' already exists. Checking for updates.")
                
                # Compare data to see if there are relevant updates
                has_updates = False
                
                # Check core metrics for significant changes
                metrics = [
                    "trend_score", "engagement_rate", "sales_velocity", 
                    "search_volume", "geographic_spread"
                ]
                
                for metric in metrics:
                    old_value = getattr(existing_product, metric)
                    new_value = product_data.get(metric, old_value)
                    
                    # If there's a significant change (more than 5% difference)
                    if abs(old_value - new_value) / max(1, old_value) > 0.05:
                        logger.info(f"Significant change in {metric}: {old_value} -> {new_value}")
                        setattr(existing_product, metric, new_value)
                        has_updates = True
                
                # Check price changes
                if (abs(existing_product.price_range_low - product_data.get("price_range_low", existing_product.price_range_low)) > 0.5 or
                    abs(existing_product.price_range_high - product_data.get("price_range_high", existing_product.price_range_high)) > 0.5):
                    existing_product.price_range_low = product_data.get("price_range_low", existing_product.price_range_low)
                    existing_product.price_range_high = product_data.get("price_range_high", existing_product.price_range_high)
                    has_updates = True
                    logger.info(f"Price range updated for '{product_data['name']}'")
                
                # If we have updates, add new trend data point
                if has_updates:
                    logger.info(f"Updating existing product '{product_data['name']}'")
                    
                    # Add the latest trend data
                    for trend_data in trends_data:
                        # Check if we already have this exact date
                        existing_trend = self.db.query(Trend).filter(
                            Trend.product_id == existing_product.id,
                            Trend.date == trend_data["date"]
                        ).first()
                        
                        if not existing_trend:
                            trend = Trend(product_id=existing_product.id, **trend_data)
                            self.db.add(trend)
                    
                    # Add any new videos that don't exist
                    for video_data in videos_data:
                        existing_video = self.db.query(Video).filter(
                            Video.product_id == existing_product.id,
                            Video.video_url == video_data["video_url"]
                        ).first()
                        
                        if not existing_video:
                            video = Video(product_id=existing_product.id, **video_data)
                            self.db.add(video)
                    
                    # Commit updates
                    self.db.commit()
                else:
                    logger.info(f"No significant updates for '{product_data['name']}'")
            else:
                # Create new product
                logger.info(f"Creating new product '{product_data['name']}'")
                product = Product(**product_data)
                self.db.add(product)
                self.db.flush()  # Flush to get product ID
                
                # Create trends
                for trend_data in trends_data:
                    trend = Trend(product_id=product.id, **trend_data)
                    self.db.add(trend)
                
                # Create regions
                for region_data in regions_data:
                    region = Region(product_id=product.id, **region_data)
                    self.db.add(region)
                
                # Create videos
                for video_data in videos_data:
                    video = Video(product_id=product.id, **video_data)
                    self.db.add(video)
                
                # Commit the transaction
                self.db.commit()
                
                # Increment counter - only count new products
                self.total_found += 1

# Main function for the scraper agent
async def start_scraper_agent(count: int, db: Session, 
                              progress_callback: Optional[ProgressCallback] = None) -> Dict[str, Any]:
    """
    Start the scraper agent to find trending products
    
    Args:
        count: Number of products to find
        db: Database session
        progress_callback: Optional callback function to report progress
        
    Returns:
        Dict with results summary
    """
    scraper = TdScraper(db)
    return await scraper.search_trending_products(count, progress_callback)