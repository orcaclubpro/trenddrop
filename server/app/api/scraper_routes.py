import os
import asyncio
import datetime
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.product import Product
from app.services.agents.tdSCRAPER import start_scraper_agent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables to track scraper status
scraper_running = False
scraper_progress = 0
scraper_total_found = 0
scraper_total_products = 0
scraper_error = None
scraper_last_run = None
scraper_next_run = None
scraper_scheduler_active = False
scheduler_task = None

# Configuration
MAX_PRODUCTS = int(os.environ.get('MAX_PRODUCTS', '1000'))
AUTO_START_THRESHOLD = 10  # Auto-start if fewer than this many products in DB

router = APIRouter()

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
    global scraper_running, scraper_progress, scraper_total_found, scraper_error
    
    if scraper_running and not force:
        return {"status": "error", "message": "Scraper is already running"}
    
    # Use configured max products if none provided
    if count is None:
        count = MAX_PRODUCTS
    
    # Reset status
    scraper_running = True
    scraper_progress = 0
    scraper_total_found = 0
    scraper_error = None
    
    # Add the scraper task to background tasks
    background_tasks.add_task(run_scraper_task, count, db)
    
    logger.info(f"Scraper started with target of {count} products")
    return {"status": "started", "message": f"Scraper started with target of {count} products"}

async def run_scraper_task(count, db):
    """Run the scraper task and update global status variables"""
    global scraper_running, scraper_progress, scraper_total_found, scraper_error, scraper_last_run, scraper_next_run
    
    try:
        # Call the scraper agent
        logger.info(f"Starting scraper agent to find up to {count} products")
        result = await start_scraper_agent(count, db, progress_callback=update_progress)
        
        scraper_total_found = result.get("total_found", 0)
        scraper_error = None
        scraper_last_run = datetime.datetime.now()
        scraper_next_run = scraper_last_run + datetime.timedelta(hours=1)
        
        logger.info(f"Scraper finished. Found {scraper_total_found} products.")
    except Exception as e:
        scraper_error = str(e)
        logger.error(f"Scraper error: {e}")
    finally:
        scraper_running = False
        
def update_progress(current, total, found):
    """Callback to update scraper progress from the agent"""
    global scraper_progress, scraper_total_found
    scraper_progress = int((current / total) * 100)
    scraper_total_found = found
    logger.debug(f"Progress update: {scraper_progress}%, Found: {found} products")

@router.get("/status")
async def get_scraper_status(db: Session = Depends(get_db)):
    """
    Get the current status of the scraper job
    
    Returns:
        dict: Current status
    """
    global scraper_running, scraper_progress, scraper_total_found, scraper_error
    global scraper_last_run, scraper_next_run, scraper_scheduler_active, scraper_total_products
    
    # Get total product count from database
    try:
        scraper_total_products = db.query(func.count(Product.id)).scalar() or 0
    except Exception as e:
        logger.error(f"Error getting product count: {e}")
        scraper_total_products = 0
    
    return {
        "running": scraper_running,
        "progress": scraper_progress,
        "total_found": scraper_total_found,
        "total_products": scraper_total_products,
        "error": scraper_error,
        "last_run": scraper_last_run.isoformat() if scraper_last_run else None,
        "next_run": scraper_next_run.isoformat() if scraper_next_run else None,
        "scheduler_active": scraper_scheduler_active
    }

@router.post("/stop")
async def stop_scraper():
    """
    Not implemented yet - would stop a running scraper job
    
    Returns:
        dict: Status message
    """
    global scraper_running
    
    if not scraper_running:
        return {"status": "error", "message": "No scraper job is currently running"}
    
    # This would stop the scraper process if we had a way to do that
    # For now, just report that we don't support this
    return {"status": "error", "message": "Stopping a running scraper is not yet implemented"}

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
    global scraper_scheduler_active, scheduler_task
    
    if active and not scraper_scheduler_active:
        scraper_scheduler_active = True
        background_tasks.add_task(start_scheduler, db)
        return {"status": "enabled", "message": "Scraper scheduler has been enabled"}
    elif not active and scraper_scheduler_active:
        scraper_scheduler_active = False
        return {"status": "disabled", "message": "Scraper scheduler has been disabled"}
    else:
        status = "enabled" if scraper_scheduler_active else "disabled"
        return {"status": status, "message": f"Scraper scheduler is already {status}"}

async def start_scheduler(db):
    """Start the scheduler that runs the scraper every hour"""
    global scraper_scheduler_active, scraper_next_run
    
    logger.info("Starting scraper scheduler")
    
    if scraper_next_run is None:
        scraper_next_run = datetime.datetime.now() + datetime.timedelta(hours=1)
    
    # Loop while scheduler is active
    while scraper_scheduler_active:
        now = datetime.datetime.now()
        
        # Run if it's time for next run
        if scraper_next_run and now >= scraper_next_run and not scraper_running:
            logger.info("Scheduler triggering scraper run")
            # Start the scraper
            asyncio.create_task(run_scraper_task(MAX_PRODUCTS, db))
            # Wait for initial setup
            await asyncio.sleep(1)
        
        # Sleep for a minute before checking again
        await asyncio.sleep(60)
    
    logger.info("Scraper scheduler stopped")

# Check database on startup and start scraper if needed
async def check_and_start_scraper_if_needed(db: Session):
    """
    Checks if database has enough products and starts scraper if needed
    """
    global scraper_running, scraper_scheduler_active
    
    try:
        product_count = db.query(func.count(Product.id)).scalar() or 0
        logger.info(f"Database has {product_count} products")
        
        # Start the scheduler regardless
        if not scraper_scheduler_active:
            scraper_scheduler_active = True
            asyncio.create_task(start_scheduler(db))
            logger.info("Automatic scheduler started")
        
        # If we have fewer than the threshold, start the scraper
        if product_count < AUTO_START_THRESHOLD and not scraper_running:
            logger.info(f"Found only {product_count} products (below threshold of {AUTO_START_THRESHOLD}). Auto-starting scraper.")
            asyncio.create_task(run_scraper_task(MAX_PRODUCTS, db))
    except Exception as e:
        logger.error(f"Error during auto-start check: {e}")