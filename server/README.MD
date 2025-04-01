# TrendDrop - Trendtracker Server

This is the backend server for TrendDrop - Trendtracker, a tool for finding trending dropshipping products.

## Architecture

The server consists of two main components:

1. **Express Server** - Handles the client requests and serves the static frontend.
2. **Python FastAPI Backend** - Provides the core functionality for scraping, analyzing, and storing product data.

## Python Backend (FastAPI)

The Python backend is responsible for:

- Managing the product database
- Scraping trending products data
- Analyzing product trends
- Providing API endpoints for the frontend

### Key Components

- `app/api/api.py` - Main FastAPI application setup
- `app/api/product_routes.py` - API routes for product operations
- `app/api/scraper_routes.py` - API routes for controlling the scraper agent
- `app/services/agents/tdSCRAPER.py` - Scraper agent implementation
- `app/models/` - Database models (Product, Trend, Region, Video)
- `app/db/database.py` - Database connection setup
- `init_db.py` - Database initialization script
- `main.py` - FastAPI server entry point

### Database Models

- **Product** - Information about trending products
- **Trend** - Historical trend data for products
- **Region** - Geographical distribution of product interest
- **Video** - Marketing videos related to products

## Running the Server

To start the server, run:

```
./start.sh
```

This will start both the Express server and the Python FastAPI backend.

## Environment Variables

The server requires the following environment variables:

- `DATABASE_URL` - PostgreSQL database connection URL
- `PYTHON_API_PORT` - Port for the Python FastAPI backend (default: 8000)
- `MAX_PRODUCTS` - Maximum number of products to find (default: 1000)