"""
Scraper routes module for TrendDrop - Trendtracker

This module provides API routes for controlling the scraper agent.
"""

import asyncio
import logging
import os
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from server.app.db.database import get_db
from server.app.services.agents.tdSCRAPER import TDScraper
from server.app.models.product import Product

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/scraper", tags=["scraper"])

# Global variables to track status
SCRAPER_RUNNING = False
SCRAPER_PROGRESS = 0
SCRAPER_TOTAL_STEPS = 100
SCRAPER_FOUND_COUNT = 0
SCRAPER_ERROR = None
SCRAPER_LAST_RUN = None
SCRAPER_NEXT_RUN = None
SCHEDULER_ACTIVE = False
SCHEDULER_TASK = None

# Get maximum number of products from environment variable
MAX_PRODUCTS = int(os.getenv("MAX_PRODUCTS", "1000"))

@router.post("/start")
async def start_scraper(
    background_tasks: BackgroundTasks,
    count: Optional[int] = None,
    db: Session = Depends(get_db),
    force: bool = False
):
    """
    Start the scraper agent to find trending products
    
    Args:
        count: Number of products to find (default: use MAX_PRODUCTS env var)
        force: Force start even if already running
        
    Returns:
        dict: Job status
    """
    global SCRAPER_RUNNING, SCRAPER_ERROR
    
    # Check if already running
    if SCRAPER_RUNNING and not force:
        return {
            "status": "error",
            "message": "Scraper is already running",
            "running": True,
            "progress": SCRAPER_PROGRESS,
            "total_found": SCRAPER_FOUND_COUNT
        }
        
    # Reset status
    SCRAPER_ERROR = None
    SCRAPER_RUNNING = True
    
    # Start scraper task in background
    background_tasks.add_task(run_scraper_task, count or MAX_PRODUCTS, db)
    
    return {
        "status": "success",
        "message": f"Scraper started, looking for {count or MAX_PRODUCTS} products",
        "running": True,
        "progress": 0,
        "total_found": 0
    }

async def run_scraper_task(count, db):
    """Run the scraper task and update global status variables"""
    global SCRAPER_RUNNING, SCRAPER_PROGRESS, SCRAPER_TOTAL_STEPS
    global SCRAPER_FOUND_COUNT, SCRAPER_ERROR, SCRAPER_LAST_RUN
    
    try:
        logger.info(f"Starting scraper task to find up to {count} products")
        
        # Create scraper agent with progress callback
        scraper = TDScraper(db, max_products=count, progress_callback=update_progress)
        
        # Run the scraper
        found_count = await scraper.run()
        
        # Update global status
        SCRAPER_FOUND_COUNT = found_count
        SCRAPER_PROGRESS = 100
        SCRAPER_LAST_RUN = func.now()
        
        logger.info(f"Scraper task completed, found {found_count} products")
        
    except Exception as e:
        logger.error(f"Scraper task failed: {e}")
        SCRAPER_ERROR = str(e)
    finally:
        SCRAPER_RUNNING = False

def update_progress(current, total, found):
    """Callback to update scraper progress from the agent"""
    global SCRAPER_PROGRESS, SCRAPER_TOTAL_STEPS, SCRAPER_FOUND_COUNT
    
    SCRAPER_PROGRESS = int((current / total) * 100)
    SCRAPER_TOTAL_STEPS = total
    SCRAPER_FOUND_COUNT = found

@router.get("/status")
async def get_scraper_status(db: Session = Depends(get_db)):
    """
    Get the current status of the scraper job
    
    Returns:
        dict: Current status
    """
    # Get product count from database
    product_count = db.query(func.count(Product.id)).scalar() or 0
    
    return {
        "running": SCRAPER_RUNNING,
        "progress": SCRAPER_PROGRESS,
        "total_found": SCRAPER_FOUND_COUNT,
        "total_products": product_count,
        "error": SCRAPER_ERROR,
        "last_run": SCRAPER_LAST_RUN,
        "next_run": SCRAPER_NEXT_RUN,
        "scheduler_active": SCHEDULER_ACTIVE
    }

@router.post("/stop")
async def stop_scraper():
    """
    Not implemented yet - would stop a running scraper job
    
    Returns:
        dict: Status message
    """
    # This would be implemented to stop a running scraper job
    # For now, it's just a placeholder
    return {
        "status": "error",
        "message": "Stopping scraper jobs not implemented yet"
    }

@router.post("/schedule")
async def schedule_scraper(
    background_tasks: BackgroundTasks,
    active: bool = True,
    db: Session = Depends(get_db)
):
    """
    Enable or disable the hourly scraper scheduler
    
    Args:
        active: Set to true to enable or false to disable
    
    Returns:
        dict: Scheduler status
    """
    global SCHEDULER_ACTIVE, SCHEDULER_TASK, SCRAPER_NEXT_RUN
    
    if active:
        # Start scheduler if not already active
        if not SCHEDULER_ACTIVE:
            SCHEDULER_ACTIVE = True
            SCRAPER_NEXT_RUN = "In about 1 hour"
            background_tasks.add_task(start_scheduler, db)
            return {
                "status": "success",
                "message": "Scheduler activated, scraper will run every hour",
                "active": True
            }
        else:
            return {
                "status": "info",
                "message": "Scheduler is already active",
                "active": True
            }
    else:
        # Stop scheduler
        SCHEDULER_ACTIVE = False
        SCRAPER_NEXT_RUN = None
        
        # Cancel the task if it's running
        if SCHEDULER_TASK and not SCHEDULER_TASK.done():
            SCHEDULER_TASK.cancel()
            
        return {
            "status": "success",
            "message": "Scheduler deactivated",
            "active": False
        }

async def start_scheduler(db):
    """Start the scheduler that runs the scraper every hour"""
    global SCHEDULER_TASK, SCHEDULER_ACTIVE, SCRAPER_NEXT_RUN
    
    logger.info("Starting scraper scheduler")
    
    while SCHEDULER_ACTIVE:
        try:
            # Check if we need to run the scraper
            await check_and_start_scraper_if_needed(db)
            
            # Wait for an hour
            for minute in range(60):
                if not SCHEDULER_ACTIVE:
                    break
                    
                # Update next run time (only if still active)
                if SCHEDULER_ACTIVE:
                    minutes_left = 60 - minute
                    SCRAPER_NEXT_RUN = f"In about {minutes_left} minute{'s' if minutes_left != 1 else ''}"
                    
                await asyncio.sleep(60)  # Sleep for a minute
                
        except asyncio.CancelledError:
            logger.info("Scheduler task cancelled")
            break
        except Exception as e:
            logger.error(f"Error in scheduler: {e}")
            await asyncio.sleep(60)  # Sleep for a minute before retrying
            
    logger.info("Scheduler stopped")

async def check_and_start_scraper_if_needed(db: Session):
    """
    Checks if database has enough products and starts scraper if needed
    """
    global SCRAPER_RUNNING, SCRAPER_ERROR
    
    # Skip if scraper is already running
    if SCRAPER_RUNNING:
        return
        
    try:
        # Check current product count
        product_count = db.query(func.count(Product.id)).scalar() or 0
        
        # If we have fewer than MAX_PRODUCTS, start the scraper
        if product_count < MAX_PRODUCTS:
            logger.info(f"Scheduler: Only have {product_count} products, starting scraper")
            
            # Reset status and start scraper
            SCRAPER_ERROR = None
            SCRAPER_RUNNING = True
            
            # Run scraper directly (not in background)
            await run_scraper_task(MAX_PRODUCTS, db)
        else:
            logger.info(f"Scheduler: Already have {product_count} products, not starting scraper")
            
    except Exception as e:
        logger.error(f"Error checking products: {e}")
        SCRAPER_ERROR = str(e)