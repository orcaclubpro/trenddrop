# TrendDrop - Trendtracker

A cutting-edge dropshipping intelligence platform that transforms complex trend data into actionable, visually engaging insights for entrepreneurs.

## Overview

TrendDrop Trendtracker is a powerful tool that analyzes social media platforms, ecommerce marketplaces, and wholesaler sites to discover trending products with high sales potential. By tracking engagement rates, regional popularity, search volumes, and sales velocity, it provides entrepreneurs with data-driven insights to make informed product sourcing decisions.

The platform leverages an advanced AI layer that continuously scans the web for trending products, validates them against wholesaler sites, calculates trend scores, and provides detailed insights to help dropshippers make data-driven decisions.

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
- **Modular AI Layer**:
  - **LLM Service**: Provides unified access to AI models (OpenAI, local models, etc.)
  - **Web Search Service**: Discovers and validates trending products
  - **Trend Analysis Service**: Calculates trend scores and metrics
  - **AI Agent Service**: Coordinates all AI operations
- **Real-time Websocket**: Broadcasts agent status and product updates

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

**Data Endpoints:**
- `GET /api/dashboard` - Get summary metrics and statistics
- `GET /api/products` - Retrieve trending products with optional filtering
- `GET /api/products/:id` - Get detailed information about a specific product
- `GET /api/categories` - List all product categories
- `GET /api/regions` - Retrieve geographic distribution data
- `GET /api/export` - Export filtered products as CSV

**Agent Endpoints:**
- `GET /api/health` - Get detailed system health status
- `POST /api/ai-agent/initialize` - Initialize the AI agent
- `POST /api/ai-agent/start` - Start product discovery
- `POST /api/ai-agent/stop` - Stop the AI agent
- `GET /api/ai-agent/status` - Check AI agent status

**WebSocket:**
- Real-time updates via `/ws` WebSocket endpoint

## Usage Examples

### Starting the AI Agent

```javascript
// Initialize and start the AI agent
fetch('/api/ai-agent/initialize', { method: 'POST' })
  .then(response => response.json())
  .then(data => {
    console.log('AI Agent initialized:', data);
    
    // Start the agent after initialization
    return fetch('/api/ai-agent/start', { method: 'POST' });
  })
  .then(response => response.json())
  .then(data => console.log('AI Agent started:', data))
  .catch(error => console.error('Error:', error));
```

### WebSocket for Real-time Updates

```javascript
// Connect to WebSocket for real-time updates
const socket = new WebSocket(`ws://${window.location.host}/ws`);

socket.onopen = () => {
  console.log('WebSocket connected');
  
  // Send client connected message
  socket.send(JSON.stringify({
    type: 'client_connected',
    timestamp: new Date().toISOString(),
    clientId: 'my-client-id'
  }));
};

// Listen for messages
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'ai_agent_status') {
    console.log('AI Agent status update:', data);
  } else if (data.type === 'product_update') {
    console.log('Product updated:', data);
  }
};
```

## License

Copyright © 2025 TrendDrop. All rights reserved.