# TrendDrop Server Documentation

This document provides comprehensive documentation for the server-side (backend) of the TrendDrop application, a dropshipping product research tool that helps you discover trending products through automated data collection and analysis.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Database](#database)
5. [API Endpoints](#api-endpoints)
6. [WebSocket Service](#websocket-service)
7. [Agent Service](#agent-service)
8. [Data Models](#data-models)
9. [Installation & Setup](#installation-setup)
10. [Development Workflow](#development-workflow)

## Overview

TrendDrop's backend is built with Node.js (Express) and Python (FastAPI) services working together to provide:

- Product data storage and retrieval
- Automated trend detection
- Real-time updates through WebSockets
- Data scraping and analysis
- REST API for frontend integration

The server automatically initializes the database on startup, retrying at 10-minute intervals if initialization fails. Once the database is ready, the trend detection agent starts collecting product data.

## Architecture

The backend follows a modular architecture with the following key technologies:

- **Express.js**: Primary web server
- **PostgreSQL/SQLite**: Database (configurable)
- **Drizzle ORM**: Database communication
- **WebSockets**: Real-time client communication
- **TDScraper Agent**: Data collection service

### Directory Structure

```
server/
├── app/                # Main application components
│   ├── api/            # API endpoints and routes
│   ├── db/             # Database configuration
│   ├── models/         # Data models
│   ├── services/       # Business logic services
│   └── __init__.py     # Package initialization
├── services/           # Node.js services
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
- Starts the agent service

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
5. If connection fails, retry after a 10-minute interval

### Database Schema

The database schema includes the following tables:

1. **products**: Stores product information
2. **trends**: Stores historical trend data
3. **regions**: Stores geographical distribution data
4. **videos**: Stores marketing video information

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
  - Path Parameters:
    - `id`: Product ID

- `GET /api/categories`: Get all product categories

- `GET /api/regions`: Get all regions

### Export Endpoint

- `GET /api/export`: Export products as CSV
  - Query Parameters:
    - (Same as `/api/products`)

### Dashboard Endpoint

- `GET /api/dashboard`: Get dashboard summary metrics

### Scraper Control Endpoints

- `POST /api/scraper/start`: Start the scraper agent
  - Body:
    - `count`: Maximum number of products to find (optional)

- `GET /api/scraper/status`: Get current scraper status

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

3. **Data Updates**:
   - `product_update`: New or updated product information

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

## Agent Service

The agent service (`agent-service.ts`) is responsible for:

1. **Product Discovery**: Finding trending products
2. **Trend Analysis**: Calculating trend metrics
3. **Regional Analysis**: Determining geographic distribution
4. **Video Collection**: Finding marketing videos

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

### Dashboard Summary

```typescript
export interface DashboardSummary {
  trendingProductsCount: number;
  averageTrendScore: number;
  topRegion: string;
  topRegionPercentage: number;
  viralVideosCount: number;
  newVideosToday: number;
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
2. Implement the business logic in a service module
3. Register the route in the Express server

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

## Error Handling

The backend implements robust error handling:

1. **Database Errors**: Retry mechanisms with exponential backoff
2. **API Errors**: Standardized error responses with status codes
3. **WebSocket Errors**: Reconnection logic with status updates
4. **Agent Errors**: Isolation of scraping failures with fallbacks

## Performance Considerations

- Database connection pooling for efficient resource usage
- Caching frequently accessed data
- Rate limiting for API endpoints
- Batch processing for agent operations
