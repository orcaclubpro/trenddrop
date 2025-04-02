# TrendDrop Server Documentation

This document provides comprehensive documentation for the server-side (backend) of the TrendDrop application, a dropshipping product research tool that helps you discover trending products through automated data collection and AI-powered analysis.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Database](#database)
5. [API Endpoints](#api-endpoints)
6. [WebSocket Service](#websocket-service)
7. [AI Layer](#ai-layer)
8. [Agent Service](#agent-service)
9. [Data Models](#data-models)
10. [Installation & Setup](#installation-setup)
11. [Development Workflow](#development-workflow)

## Overview

TrendDrop's backend is built with Node.js (Express) and integrates advanced AI capabilities to provide:

- Product data storage and retrieval
- AI-powered trend detection and analysis
- Real-time updates through WebSockets
- Smart data scraping and validation
- Comprehensive REST API for frontend integration

The server automatically initializes the database on startup, retrying at intervals if initialization fails. Once the database is ready, the AI-powered trend detection agent starts collecting and analyzing product data.

## Architecture

The backend follows a modular architecture with the following key technologies:

- **Express.js**: Primary web server
- **PostgreSQL/SQLite**: Database (configurable)
- **Drizzle ORM**: Database communication
- **WebSockets**: Real-time client communication
- **AI Layer**: Modular AI services for trend detection and analysis
- **Agent Service**: Coordinates data collection and processing

### Directory Structure

```
server/
├── app/                # Main application components
│   ├── api/            # API endpoints and routes
│   ├── db/             # Database configuration
│   ├── models/         # Data models
│   ├── services/       # Business logic services
│   └── __init__.py     # Package initialization
├── controllers/        # Request handlers for API endpoints
├── routes/             # Route definitions
├── services/           # Node.js services
│   ├── ai/             # AI layer services
│   │   ├── llm-service.ts           # LLM provider integration
│   │   ├── web-search-service.ts    # Web search for products
│   │   ├── trend-analysis-service.ts # Trend analysis
│   │   ├── ai-agent-service.ts      # Main AI agent orchestrator
│   │   └── interfaces.ts            # Common interfaces
│   ├── agent-service.ts       # Trend detection agent
│   ├── database-service.ts    # Database connection
│   ├── product-service.ts     # Product-related operations
│   ├── trend-service.ts       # Trend analysis operations
│   └── video-service.ts       # Video-related operations
├── index.ts            # Main server entry point
├── initialize.ts       # Database initialization
├── routes.ts           # API route registration
├── storage.ts          # Data storage interface
├── vite.ts             # Development server utilities
├── package.json        # Dependencies and scripts
└── README.md           # This documentation
```

## Core Components

### Express Server (`index.ts`)

The main server component built on Express.js that:
- Serves the frontend application
- Hosts the REST API
- Manages WebSocket connections
- Coordinates database initialization
- Starts the agent service and AI layer

### Database Manager (`initialize.ts`)

Handles database initialization and connection:
- Supports both PostgreSQL and SQLite
- Creates tables if they don't exist
- Seeds initial data when necessary
- Provides connection retries

### Storage Interface (`storage.ts`)

Abstracts database operations:
- Defines the `IStorage` interface for data operations
- Implements the interface with `DbStorage` class
- Provides CRUD operations for all data models

### API Routes (`routes.ts`)

Registers API endpoints for frontend consumption:
- Product-related endpoints
- Dashboard summary data
- Export functionality
- WebSocket setup
- Agent control endpoints
- Log management

### Controllers

Handle request processing for API endpoints:
- `productController`: Product CRUD operations and dashboard data
- `trendController`: Trend data and analysis
- `regionController`: Geographic distribution data
- `videoController`: Marketing video management
- `agentController`: AI agent control and status
- `logController`: Log retrieval and management

## Database

TrendDrop supports both PostgreSQL and SQLite databases:

### Configuration

The database connection is configured through the `DATABASE_URL` environment variable:

- **PostgreSQL**: `postgresql://user:password@host:port/database`
- **SQLite**: `file:./path/to/database.db`

If no `DATABASE_URL` is provided, the application defaults to a local SQLite database in the `./data` directory.

### Initialization Process

1. Check if `DATABASE_URL` is set, use default SQLite path if not
2. Attempt to connect to the database
3. Check if tables exist, create them if not
4. If tables are newly created, seed with initial data
5. If connection fails, retry after a defined interval

### Database Schema

The database schema includes the following tables:

1. **products**: Stores product information
2. **trends**: Stores historical trend data
3. **regions**: Stores geographical distribution data
4. **videos**: Stores marketing video information
5. **logs**: Stores system and operation logs

## API Endpoints

### Product Endpoints

- `GET /api/products`: Get products with filtering
  - Query Parameters:
    - `trendScore`: Minimum trend score
    - `category`: Product category
    - `region`: Regional filter
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- `GET /api/products/:id`: Get a specific product with details
- `POST /api/products`: Create a new product
- `PUT /api/products/:id`: Update a product
- `DELETE /api/products/:id`: Delete a product

### Dashboard Endpoints

- `GET /api/dashboard`: Get dashboard summary metrics
- `GET /api/dashboard/trends`: Get trend data for dashboard
- `GET /api/dashboard/products`: Get product data for dashboard
- `GET /api/dashboard/regions`: Get regional data for dashboard
- `GET /api/dashboard/videos`: Get video data for dashboard

### Category Endpoints

- `GET /api/categories`: Get all product categories

### Trend Endpoints

- `GET /api/products/:productId/trends`: Get trends for a product
- `POST /api/trends`: Create a new trend
- `GET /api/products/:productId/trend-velocities`: Get trend velocities

### Region Endpoints

- `GET /api/products/:productId/regions`: Get regions for a product
- `POST /api/regions`: Create a new region
- `GET /api/top-regions`: Get top regions
- `GET /api/products/:productId/geographic-spread`: Calculate geographic spread

### Video Endpoints

- `GET /api/products/:productId/videos`: Get videos for a product
- `POST /api/videos`: Create a new video
- `GET /api/top-videos`: Get top videos
- `GET /api/platform-distribution`: Get platform distribution

### Agent Endpoints

- `GET /api/agent/status`: Get agent status
- `POST /api/agent/start`: Start the agent
- `POST /api/agent/stop`: Stop the agent
- `POST /api/agent/trigger-scraping`: Trigger manual scraping
- `POST /api/agent/reset-counter`: Reset the agent counter

### Log Endpoints

- `GET /api/logs`: Get system logs
- `DELETE /api/logs`: Clear system logs

## WebSocket Service

The WebSocket service provides real-time updates to connected clients:

### Connection

WebSocket connections are established at the `/ws` endpoint.

### Message Types

1. **Connection Messages**:
   - `connection_established`: Sent when a client connects
   - `client_connected`: Received when a client connects

2. **Status Updates**:
   - `agent_status`: Updates on agent activities
   - `database_status`: Database connection status
   - `ai_agent_status`: AI agent operation status

3. **Data Updates**:
   - `product_update`: New or updated product information
   - `trend_update`: Updated trend information
   - `log_update`: New log entries

Example WebSocket message:

```json
{
  "type": "agent_status",
  "status": "running",
  "timestamp": "2023-01-01T12:00:00Z",
  "message": "Searching for trending products",
  "progress": 45,
  "productsFound": 12
}
```

## AI Layer

The AI layer is a collection of modular services that provide intelligent product discovery and analysis:

### LLM Service (`llm-service.ts`)

Provides a unified interface to interact with various LLM providers:
- OpenAI API integration
- Local model support (LM Studio)
- Grok model support
- Prompt templates for various tasks

### Web Search Service (`web-search-service.ts`)

Searches the web for trending products and validates them:
- Discovers trending products across platforms
- Validates products against wholesaler sites
- Extracts product details and links

### Trend Analysis Service (`trend-analysis-service.ts`)

Analyzes product trends and calculates metrics:
- Engagement rate calculation
- Sales velocity analysis
- Search volume estimation
- Geographic spread calculation
- Overall trend score generation

### AI Agent Service (`ai-agent-service.ts`)

Coordinates all AI operations:
- Orchestrates the product discovery process
- Manages LLM interactions
- Schedules periodic trend updates
- Handles error recovery and retry logic

## Agent Service

The agent service (`agent-service.ts`) is responsible for:

1. **Product Discovery**: Finding trending products using the AI layer
2. **Trend Analysis**: Calculating trend metrics
3. **Regional Analysis**: Determining geographic distribution
4. **Video Collection**: Finding marketing videos
5. **Database Updates**: Storing and updating product data

### Agent Workflow

1. Agent initializes when the database is ready
2. Periodically searches for trending products
3. Processes each product:
   - Calculates trend metrics
   - Determines geographic distribution
   - Finds marketing videos
4. Stores data in the database
5. Sends real-time updates via WebSockets

### Configuration

Agent behavior is controlled through environment variables:

- `SCRAPING_INTERVAL`: Time between scraping operations (default: 1 hour)
- `MAX_PRODUCTS`: Maximum products to find (default: 1000)
- `OPENAI_API_KEY`: OpenAI API key for LLM interactions
- `LMSTUDIO_API_URL`: URL for LM Studio API
- `SEARCH_API_KEY`: API key for web search

## Data Models

The backend defines the following data models:

### Product

```typescript
export interface Product {
  id: number;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  priceRangeLow: number;
  priceRangeHigh: number;
  trendScore: number;
  engagementRate: number;
  salesVelocity: number;
  searchVolume: number;
  geographicSpread: number;
  aliexpressUrl: string | null;
  cjdropshippingUrl: string | null;
  imageUrl: string | null;
  sourcePlatform: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Trend

```typescript
export interface Trend {
  id: number;
  productId: number;
  date: Date;
  engagementValue: number;
  salesValue: number;
  searchValue: number;
}
```

### Region

```typescript
export interface Region {
  id: number;
  productId: number;
  country: string;
  percentage: number;
}
```

### Video

```typescript
export interface Video {
  id: number;
  productId: number;
  title: string;
  platform: string;
  views: number;
  uploadDate: Date;
  thumbnailUrl: string;
  videoUrl: string;
}
```

### Log

```typescript
export interface Log {
  id: number;
  level: string;
  message: string;
  source: string;
  timestamp: Date;
}
```

### Dashboard Summary

```typescript
export interface DashboardSummary {
  trendingProductsCount: number;
  averageTrendScore: number;
  topRegion: string;
  topRegionPercentage: number;
  viralVideosCount: number;
  newVideosToday: number;
  totalScrapingCount: number;
  lastScrapingTime: Date;
}
```

## Installation & Setup

### Prerequisites

- Node.js 18+
- Python 3.9+ (for FastAPI components)
- PostgreSQL (optional)

### Environment Variables

Create a `.env` file in the server root with:

```
# Database Configuration
DATABASE_URL=file:./data/trenddrop.db
# Uncomment the line below to use PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/trenddrop

# Application Configuration
PORT=5000
SCRAPING_INTERVAL=3600000
MAX_PRODUCTS=1000
NODE_ENV=development

# AI Configuration
OPENAI_API_KEY=your_openai_api_key
LMSTUDIO_API_URL=http://localhost:1234/v1/chat/completions
LMSTUDIO_MODEL=your_model_name
SEARCH_API_KEY=your_search_api_key
```

### Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Development Workflow

### Database Migrations

During development, you can modify the database schema by:

1. Updating model definitions in `schema.ts`
2. Running migrations:
   ```bash
   npm run db:migrate
   ```

### Seeding Test Data

To populate the database with test data:

```bash
npm run db:seed
```

### API Development

To add new API endpoints:

1. Define the endpoint in `routes.ts`
2. Create a controller method in the appropriate controller
3. Implement the business logic in a service module

### AI Layer Development

To modify the AI layer:

1. Update the relevant service in the `services/ai` directory
2. Implement new LLM prompts or analysis methods
3. Update the AI agent orchestration in `ai-agent-service.ts`

### Agent Development

To modify the scraping agent:

1. Update the `AgentService` class in `agent-service.ts`
2. Implement new scraping methods
3. Update the data processing workflow

## Deployment

### Production Build

```bash
npm run build
```

### Docker Deployment

A Dockerfile is provided to containerize the application:

```bash
docker build -t trenddrop .
docker run -p 5000:5000 trenddrop
```

### Environment Configuration

For production deployment, set these environment variables:

- `NODE_ENV=production`
- `DATABASE_URL`: Production database connection string
- `PORT`: Server port (default: 5000)
- `OPENAI_API_KEY`: OpenAI API key for LLM interactions

## Error Handling

The backend implements robust error handling:

1. **Database Errors**: Retry mechanisms with exponential backoff
2. **API Errors**: Standardized error responses with status codes
3. **WebSocket Errors**: Reconnection logic with status updates
4. **Agent Errors**: Isolation of scraping failures with fallbacks
5. **LLM Errors**: Graceful fallbacks to alternative models

## Performance Considerations

- Database connection pooling for efficient resource usage
- Caching frequently accessed data
- Rate limiting for API endpoints
- Batch processing for agent operations
- Efficient LLM prompt design for cost optimization
