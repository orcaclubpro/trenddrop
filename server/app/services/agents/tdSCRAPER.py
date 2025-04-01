"""
TDScraper Agent module for TrendDrop - Trendtracker

This module provides a simulated scraper agent for finding trending products.
In a production environment, this would be replaced with a real scraper
that uses grok with lmstudio for web searching capabilities.
"""

import asyncio
import logging
import random
import datetime
from typing import List, Dict, Any, Callable, Optional
from sqlalchemy.orm import Session

from server.app.models.product import Product
from server.app.models.trend import Trend
from server.app.models.region import Region
from server.app.models.video import Video

# Configure logging
logger = logging.getLogger(__name__)

# Sample data for simulation
SAMPLE_CATEGORIES = [
    "Electronics", "Home & Kitchen", "Fashion", "Beauty", "Toys & Games",
    "Sports & Outdoors", "Health & Wellness", "Pet Supplies", "Baby", "Jewelry"
]

SAMPLE_SUBCATEGORIES = {
    "Electronics": ["Smartphone Accessories", "Smart Home", "Wearables", "Audio", "Gadgets"],
    "Home & Kitchen": ["Kitchen Gadgets", "Home Decor", "Organization", "Bedding", "Bath"],
    "Fashion": ["Accessories", "Clothing", "Footwear", "Bags", "Watches"],
    "Beauty": ["Skincare", "Makeup", "Hair Care", "Fragrance", "Tools"],
    "Toys & Games": ["Educational", "Puzzles", "Action Figures", "Board Games", "Outdoor"],
    "Sports & Outdoors": ["Fitness", "Camping", "Water Sports", "Team Sports", "Cycling"],
    "Health & Wellness": ["Supplements", "Personal Care", "Fitness Trackers", "Massage", "Aromatherapy"],
    "Pet Supplies": ["Dog Accessories", "Cat Toys", "Pet Grooming", "Food & Treats", "Beds & Furniture"],
    "Baby": ["Feeding", "Diapering", "Toys", "Clothing", "Travel Gear"],
    "Jewelry": ["Necklaces", "Earrings", "Bracelets", "Rings", "Sets"]
}

SAMPLE_PRODUCT_NAMES = {
    "Electronics": ["Magnetic Phone Mount", "Smart LED Strip", "Foldable Wireless Charger", "Mini Projector", "Bluetooth Earbuds"],
    "Home & Kitchen": ["Milk Frother", "Vegetable Chopper", "Silicone Baking Mats", "Digital Kitchen Scale", "Sous Vide Cooker"],
    "Fashion": ["Minimalist Watch", "Crossbody Phone Bag", "Stackable Rings", "Cloud Slippers", "Bamboo Socks"],
    "Beauty": ["Jade Face Roller", "Vitamin C Serum", "Hair Growth Oil", "Eyebrow Stamp", "Makeup Eraser Cloth"],
    "Toys & Games": ["Magnetic Building Blocks", "Water Drawing Mat", "LED Drone", "Wooden Puzzle Set", "Slime Kit"],
    "Sports & Outdoors": ["Resistance Bands Set", "Foldable Water Bottle", "Yoga Wheel", "Jump Rope", "Hiking Socks"],
    "Health & Wellness": ["Sleep Mask", "Digital Body Scale", "Posture Corrector", "Acupressure Mat", "Essential Oil Diffuser"],
    "Pet Supplies": ["Pet Hair Remover", "Slow Feeder Bowl", "Automatic Toy", "Grooming Glove", "Pet Water Fountain"],
    "Baby": ["Silicone Teether", "Sound Machine", "Diaper Caddy", "Baby Food Maker", "Swaddle Blanket"],
    "Jewelry": ["Layered Necklace", "Huggie Earrings", "Minimalist Bracelet", "Birthstone Ring", "Anklet"]
}

SAMPLE_COUNTRIES = [
    "United States", "United Kingdom", "Canada", "Australia", "Germany",
    "France", "Italy", "Spain", "Japan", "South Korea", "Brazil", "Mexico",
    "India", "Russia", "South Africa", "Netherlands", "Sweden", "Norway"
]

SAMPLE_PLATFORMS = ["TikTok", "Instagram", "YouTube", "Facebook", "Pinterest"]

class TDScraper:
    """
    TDScraper Agent for finding trending products.
    
    In a production environment, this would use a local grok agent with
    lmstudio for web searching capabilities. For now, it generates
    simulated product data.
    """
    
    def __init__(
        self, 
        db: Session, 
        max_products: int = 1000, 
        progress_callback: Optional[Callable[[int, int, int], None]] = None
    ):
        """
        Initialize the scraper agent.
        
        Args:
            db: Database session
            max_products: Maximum number of products to find
            progress_callback: Callback function to report progress
        """
        self.db = db
        self.max_products = max_products
        self.progress_callback = progress_callback
        self.existing_product_names = set()
        
    async def run(self) -> int:
        """
        Run the scraper to find trending products.
        
        Returns:
            int: Number of products found
        """
        logger.info(f"Starting TDScraper to find up to {self.max_products} products")
        
        # Load existing product names to avoid duplicates
        self._load_existing_product_names()
        
        # Get current product count
        current_count = len(self.existing_product_names)
        
        # Determine how many products to find
        products_to_find = max(0, self.max_products - current_count)
        
        if products_to_find <= 0:
            logger.info(f"Already have {current_count} products, no need to find more")
            
            # Still report progress
            if self.progress_callback:
                self.progress_callback(1, 1, current_count)
                
            return 0
            
        logger.info(f"Need to find {products_to_find} more products")
        
        # Simulate finding products
        products_found = 0
        total_steps = min(products_to_find, 100)  # Use 100 steps for simulation
        
        for step in range(total_steps):
            # Calculate how many products to "find" in this step
            batch_size = max(1, products_to_find // total_steps)
            
            if step == total_steps - 1:
                # Make sure we find exactly the right number on the last step
                batch_size = products_to_find - products_found
                
            # Simulate delay for searching
            await asyncio.sleep(0.1)
            
            # Create products
            for _ in range(batch_size):
                await self._create_simulated_product()
                products_found += 1
                
            # Report progress
            if self.progress_callback:
                self.progress_callback(step + 1, total_steps, current_count + products_found)
                
        logger.info(f"Found {products_found} new products")
        return products_found
        
    def _load_existing_product_names(self):
        """Load existing product names to avoid duplicates"""
        products = self.db.query(Product.name).all()
        self.existing_product_names = set(p[0] for p in products)
        
    async def _create_simulated_product(self) -> Product:
        """
        Create a simulated product with trends, regions, and videos.
        
        Returns:
            Product: The created product
        """
        # Select a random category
        category = random.choice(SAMPLE_CATEGORIES)
        
        # Select a random subcategory
        subcategory = random.choice(SAMPLE_SUBCATEGORIES[category])
        
        # Generate a product name that doesn't exist yet
        base_name = random.choice(SAMPLE_PRODUCT_NAMES[category])
        product_name = base_name
        
        # Add a suffix if the name already exists
        name_counter = 1
        while product_name in self.existing_product_names:
            product_name = f"{base_name} {name_counter}"
            name_counter += 1
            
        # Add to set of existing names
        self.existing_product_names.add(product_name)
        
        # Generate price range
        price_low = round(random.uniform(5, 50), 2)
        price_high = round(price_low * random.uniform(1.2, 2.5), 2)
        
        # Generate trend metrics (all between 1-100)
        trend_score = random.randint(40, 100)  # Bias towards higher trend scores
        engagement_rate = random.randint(1, 100)
        sales_velocity = random.randint(1, 100)
        search_volume = random.randint(1, 100)
        geographic_spread = random.randint(1, 100)
        
        # Create image URL (placeholder)
        image_url = f"https://picsum.photos/id/{random.randint(1, 1000)}/500/500"
        
        # Create product description
        description = f"Trending {product_name} in the {category} category. This {subcategory} product has been gaining popularity with a trend score of {trend_score}."
        
        # Source platform
        source_platform = random.choice(SAMPLE_PLATFORMS)
        
        # Wholesaler URLs (placeholders)
        aliexpress_url = f"https://www.aliexpress.com/wholesale?SearchText={product_name.replace(' ', '+')}"
        cjdropshipping_url = f"https://cjdropshipping.com/search?q={product_name.replace(' ', '+')}"
        
        # Create the product
        product = Product(
            name=product_name,
            category=category,
            subcategory=subcategory,
            price_range_low=price_low,
            price_range_high=price_high,
            trend_score=trend_score,
            engagement_rate=engagement_rate,
            sales_velocity=sales_velocity,
            search_volume=search_volume,
            geographic_spread=geographic_spread,
            image_url=image_url,
            description=description,
            source_platform=source_platform,
            aliexpress_url=aliexpress_url,
            cjdropshipping_url=cjdropshipping_url
        )
        
        # Add to database
        self.db.add(product)
        self.db.flush()  # Get the ID without committing
        
        # Create trends (historical data for the past 7 days)
        await self._create_trends_for_product(product)
        
        # Create regions
        await self._create_regions_for_product(product)
        
        # Create videos
        await self._create_videos_for_product(product)
        
        # Commit to database
        self.db.commit()
        
        return product
        
    async def _create_trends_for_product(self, product: Product):
        """Create historical trend data for a product"""
        # Generate data for the past 7 days
        for days_ago in range(7, 0, -1):
            # Calculate date
            date = datetime.datetime.now() - datetime.timedelta(days=days_ago)
            
            # Generate random values with a trend towards increasing recently
            day_factor = (7 - days_ago) / 7  # 0.0 to 1.0
            base_engagement = int(product.engagement_rate * 0.7)
            base_sales = int(product.sales_velocity * 0.7)
            base_search = int(product.search_volume * 0.7)
            
            # Add random fluctuations
            engagement = max(1, int(base_engagement + (product.engagement_rate - base_engagement) * day_factor * random.uniform(0.8, 1.2)))
            sales = max(1, int(base_sales + (product.sales_velocity - base_sales) * day_factor * random.uniform(0.8, 1.2)))
            search = max(1, int(base_search + (product.search_volume - base_search) * day_factor * random.uniform(0.8, 1.2)))
            
            # Create the trend record
            trend = Trend(
                product_id=product.id,
                date=date,
                engagement_value=engagement,
                sales_value=sales,
                search_value=search
            )
            
            self.db.add(trend)
            
    async def _create_regions_for_product(self, product: Product):
        """Create geographical distribution data for a product"""
        # Select 3-6 random countries
        num_countries = random.randint(3, 6)
        selected_countries = random.sample(SAMPLE_COUNTRIES, num_countries)
        
        # Assign percentages (must sum to 100%)
        percentages = []
        remaining = 100
        
        for i in range(num_countries - 1):
            # Give more percentage to earlier countries (primary markets)
            if i == 0:
                # Primary market gets 30-60%
                percentage = random.randint(30, 60)
            else:
                # Secondary markets get smaller percentages
                percentage = random.randint(5, remaining - (num_countries - i - 1) * 5)
                
            percentages.append(percentage)
            remaining -= percentage
            
        # Last country gets whatever is left
        percentages.append(remaining)
        
        # Create region records
        for country, percentage in zip(selected_countries, percentages):
            region = Region(
                product_id=product.id,
                country=country,
                percentage=percentage
            )
            
            self.db.add(region)
            
    async def _create_videos_for_product(self, product: Product):
        """Create marketing videos for a product"""
        # Decide how many videos to create (1-3)
        num_videos = random.randint(1, 3)
        
        for i in range(num_videos):
            # Select a platform
            platform = random.choice(SAMPLE_PLATFORMS)
            
            # Generate a title
            adjectives = ["Amazing", "Unbelievable", "Must-Have", "Trending", "Viral", "Best"]
            verbs = ["Unboxing", "Review", "Try-On", "Haul", "Test", "Demo"]
            
            title = f"{random.choice(adjectives)} {product.name} {random.choice(verbs)}"
            
            # Generate view count (higher for first video)
            if i == 0:
                views = random.randint(10000, 1000000)
            else:
                views = random.randint(1000, 100000)
                
            # Generate upload date (more recent for first video)
            days_ago = random.randint(1, 14) if i == 0 else random.randint(14, 60)
            upload_date = datetime.datetime.now() - datetime.timedelta(days=days_ago)
            
            # Generate thumbnail URL (placeholder)
            thumbnail_id = random.randint(1, 1000)
            thumbnail_url = f"https://picsum.photos/id/{thumbnail_id}/320/180"
            
            # Generate video URL (placeholder)
            video_platforms = {
                "TikTok": "https://www.tiktok.com/",
                "Instagram": "https://www.instagram.com/p/",
                "YouTube": "https://www.youtube.com/watch?v=",
                "Facebook": "https://www.facebook.com/watch/?v=",
                "Pinterest": "https://www.pinterest.com/pin/"
            }
            
            video_id = ''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=11))
            video_url = f"{video_platforms[platform]}{video_id}"
            
            # Create the video record
            video = Video(
                product_id=product.id,
                title=title,
                platform=platform,
                views=views,
                upload_date=upload_date,
                thumbnail_url=thumbnail_url,
                video_url=video_url
            )
            
            self.db.add(video)