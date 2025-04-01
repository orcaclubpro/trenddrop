from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.agents.tdSCRAPER import start_scraper_agent

# Global variables to track scraper status
scraper_running = False
scraper_progress = 0
scraper_total_found = 0
scraper_error = None

router = APIRouter()

@router.post("/start")
async def start_scraper(
    background_tasks: BackgroundTasks,
    count: Optional[int] = 1000,
    db: Session = Depends(get_db)
):
    """
    Start the scraper agent to find trending products
    
    Args:
        count: Number of products to find (default: 1000)
        
    Returns:
        dict: Job status
    """
    global scraper_running, scraper_progress, scraper_total_found, scraper_error
    
    if scraper_running:
        return {"status": "error", "message": "Scraper is already running"}
    
    # Reset status
    scraper_running = True
    scraper_progress = 0
    scraper_total_found = 0
    scraper_error = None
    
    # Add the scraper task to background tasks
    background_tasks.add_task(run_scraper_task, count, db)
    
    return {"status": "started", "message": f"Scraper started with target of {count} products"}

async def run_scraper_task(count, db):
    global scraper_running, scraper_progress, scraper_total_found, scraper_error
    
    try:
        # Call the scraper agent
        result = await start_scraper_agent(count, db, 
                                           progress_callback=update_progress)
        
        scraper_total_found = result.get("total_found", 0)
        scraper_error = None
    except Exception as e:
        scraper_error = str(e)
    finally:
        scraper_running = False
        
def update_progress(current, total, found):
    global scraper_progress, scraper_total_found
    scraper_progress = int((current / total) * 100)
    scraper_total_found = found

@router.get("/status")
async def get_scraper_status():
    """
    Get the current status of the scraper job
    
    Returns:
        dict: Current status
    """
    return {
        "running": scraper_running,
        "progress": scraper_progress,
        "total_found": scraper_total_found,
        "error": scraper_error
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