# TrendDrop - Trendtracker

A comprehensive dropshipping intelligence platform that leverages advanced data analysis and geographic insights to help entrepreneurs identify and capitalize on emerging product trends.

## Overview

TrendDrop Trendtracker is a powerful tool that analyzes social media platforms, ecommerce marketplaces, and wholesaler sites to discover trending products with high sales potential. By tracking engagement rates, regional popularity, search volumes, and sales velocity, it provides entrepreneurs with data-driven insights to make informed product sourcing decisions.

## Features

- **AI-Powered Product Research**: Automated agent that continuously scans multiple platforms for trending products
- **Comprehensive Trend Metrics**: Track engagement rates, sales velocity, search volume, and geographic spread
- **Geographic Insights**: View product popularity by region to target specific markets
- **Video Marketing Analysis**: Discover successful marketing videos related to trending products
- **API Integration**: Connect to your existing systems with our comprehensive API

## Architecture

TrendDrop Trendtracker has a robust architecture consisting of:

- **Express.js Frontend**: Responsive web interface for interacting with the tool
- **Python FastAPI Backend**: Handles the complex data processing and scraping operations
- **SQL Database**: Stores product data, trend metrics, regional information, and marketing videos
- **AI Research Agent**: Utilizes advanced machine learning to identify trending products and predict their success potential

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install Node.js dependencies:
   ```
   npm install
   ```
3. Install Python dependencies:
   ```
   pip install -r server/requirements.txt
   ```
4. Set up environment variables:
   ```
   DATABASE_URL=your_postgres_connection_string
   ```
5. Run the development server:
   ```
   npm run dev
   ```

## API Documentation

TrendDrop Trendtracker provides a RESTful API for integration with your own systems:

- `GET /api/dashboard` - Get summary metrics and statistics
- `GET /api/products` - Retrieve trending products with optional filtering
- `GET /api/products/:id` - Get detailed information about a specific product
- `GET /api/categories` - List all product categories
- `GET /api/regions` - Retrieve geographic distribution data
- `POST /api/scraper/start` - Trigger the product research agent
- `GET /api/scraper/status` - Check current agent status

## Usage Example

Starting the research agent to search for trending products:

```javascript
fetch('/api/scraper/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ count: 100 })
})
.then(response => response.json())
.then(data => console.log(data));
```

## License

Copyright © 2025 TrendDrop. All rights reserved.