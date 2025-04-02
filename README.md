# TrendDrop - AI-Powered Dropshipping Intelligence Platform

A cutting-edge dropshipping intelligence platform that transforms complex trend data into actionable, visually engaging insights for entrepreneurs, all powered by advanced AI.

## Overview

TrendDrop is a powerful tool that analyzes social media platforms, ecommerce marketplaces, and wholesaler sites to discover trending products with high sales potential. By tracking engagement rates, regional popularity, search volumes, and sales velocity, it provides entrepreneurs with data-driven insights to make informed product sourcing decisions.

The platform leverages an advanced AI layer that continuously scans the web for trending products, validates them against wholesaler sites, calculates trend scores, and provides detailed insights to help dropshippers make data-driven decisions.

## Features

- **AI-Powered Product Research**: Automated agent that continuously scans multiple platforms for trending products
- **Comprehensive Trend Metrics**: Track engagement rates, sales velocity, search volume, and geographic spread
- **Geographic Insights**: View product popularity by region to target specific markets
- **Video Marketing Analysis**: Discover successful marketing videos related to trending products
- **Real-time Updates**: Get instant notifications when new trending products are discovered
- **Interactive Dashboard**: Visualize key metrics and trends in an intuitive interface
- **Detailed Product Analytics**: Deep dive into product performance metrics
- **API Integration**: Connect to your existing systems with our comprehensive API

## Architecture

TrendDrop has a modern, modular architecture consisting of:

### Frontend

- **React**: Interactive user interface with React components
- **TailwindCSS**: Sleek, responsive design system
- **Chart.js**: Data visualization and analytics
- **WebSocket Client**: Real-time updates and notifications

### Backend

- **Express.js Server**: Fast, reliable API and WebSocket server
- **PostgreSQL/SQLite Database**: Flexible database options for data storage
- **Drizzle ORM**: Type-safe database access and migrations
- **RESTful API**: Comprehensive endpoints for all operations
- **WebSocket Server**: Real-time communication with clients

### AI Layer

- **LLM Service**: Unified access to AI models (OpenAI, local models, etc.)
- **Web Search Service**: Discovers and validates trending products
- **Trend Analysis Service**: Calculates trend scores and metrics
- **AI Agent Service**: Coordinates all AI operations
- **Product Verification**: Validates products against wholesaler sites

## Project Structure

```
trenddrop/
├── client/               # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── pages/            # Application pages
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React context providers
│   └── utils/            # Helper functions
├── server/               # Backend Express application
│   ├── controllers/      # Request handlers
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic 
│   │   ├── ai/           # AI services
│   │   └── ...           # Other services
│   ├── index.ts          # Server entry point
│   └── initialize.ts     # Database initialization
├── shared/               # Shared types and utilities
├── scripts/              # Utility scripts
└── data/                 # Data storage (for SQLite)
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+ (optional, for enhanced AI features)
- PostgreSQL database (optional, SQLite works out of the box)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/trenddrop.git
   cd trenddrop
   ```

2. Install dependencies:
   ```bash
   npm install
   
   # Or use the installation script that sets up both Node and Python dependencies
   ./install-dependencies.sh
   ```

3. Configure environment variables:
   
   Create a `.env` file in the root directory with the following variables:
   ```
   # Database Configuration
   DATABASE_URL=file:./data/trenddrop.db
   # Use this for PostgreSQL
   # DATABASE_URL=postgresql://user:password@localhost:5432/trenddrop
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # AI Configuration (optional)
   OPENAI_API_KEY=your_openai_api_key
   LMSTUDIO_API_URL=http://localhost:1234/v1/chat/completions
   LMSTUDIO_MODEL=your_model_name
   SEARCH_API_KEY=your_search_api_key
   
   # Scraping Configuration
   SCRAPING_INTERVAL=3600000
   MAX_PRODUCTS=1000
   ```

4. Initialize the database:
   
   For SQLite (default):
   ```bash
   npm run db:init
   ```
   
   For PostgreSQL:
   ```bash
   # First start PostgreSQL
   ./start-pg.sh
   
   # Then initialize the database
   npm run db:init:pg
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application:
   
   Open your browser and navigate to `http://localhost:5000`

### Using PostgreSQL

To use PostgreSQL instead of the default SQLite:

1. Install PostgreSQL on your system or use Docker:
   ```bash
   # Start PostgreSQL in Docker
   ./start-pg.sh
   ```

2. Update the `DATABASE_URL` in your `.env` file:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trenddrop
   ```

3. Initialize the PostgreSQL database:
   ```bash
   npm run db:init:pg
   ```

See [README-postgresql.md](README-postgresql.md) for more detailed instructions.

## Development

### Available Scripts

- `npm run dev`: Start development server with hot reloading
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run test`: Run tests
- `npm run db:migrate`: Run database migrations
- `npm run db:seed`: Seed the database with sample data

### Adding New Features

1. **Frontend Components**:
   - Add new React components in `client/components`
   - Create new pages in `client/pages`
   - Update routes in `client/App.tsx`

2. **Backend Endpoints**:
   - Add new route handlers in `server/controllers`
   - Register routes in `server/routes.ts`
   - Implement business logic in `server/services`

3. **Database Changes**:
   - Update schema in `server/db/schema.ts`
   - Run migrations with `npm run db:migrate`

4. **AI Enhancements**:
   - Modify AI services in `server/services/ai`
   - Update agent behavior in `server/services/agent-service.ts`

## API Documentation

TrendDrop provides a comprehensive API for integration with your own systems:

### Data Endpoints

- `GET /api/dashboard`: Get summary metrics and statistics
- `GET /api/products`: Retrieve trending products with optional filtering
- `GET /api/products/:id`: Get detailed information about a specific product
- `GET /api/categories`: List all product categories
- `GET /api/products/:productId/trends`: Get trend data for a product
- `GET /api/products/:productId/regions`: Get regional data for a product
- `GET /api/products/:productId/videos`: Get marketing videos for a product

### Agent Endpoints

- `GET /api/agent/status`: Get agent status
- `POST /api/agent/start`: Start the agent
- `POST /api/agent/stop`: Stop the agent
- `POST /api/agent/trigger-scraping`: Trigger manual scraping
- `POST /api/agent/reset-counter`: Reset the agent counter

### WebSocket API

Connect to the WebSocket endpoint at `/ws` to receive real-time updates:

```javascript
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
  
  if (data.type === 'agent_status') {
    console.log('Agent status update:', data);
  } else if (data.type === 'product_update') {
    console.log('Product updated:', data);
  }
};
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check your `DATABASE_URL` environment variable
   - For PostgreSQL, ensure the database server is running
   - For SQLite, ensure the `data` directory exists and is writable

2. **AI Service Errors**:
   - Verify your API keys (OpenAI, Search API)
   - Check network connectivity to external services
   - Inspect logs for specific error messages

3. **Port Conflicts**:
   - If port 5000 is already in use, change the `PORT` in your `.env` file
   - Alternatively, use the `kill-port.sh` script to free the port:
     ```bash
     ./kill-port.sh 5000
     ```

### Logs

Application logs are stored in the `logs` directory and can be viewed with:

```bash
cat logs/app.log
```

You can also view logs through the API:

```bash
curl http://localhost:5000/api/logs
```

## Deployment

### Production Build

To build the application for production:

```bash
npm run build
```

This creates optimized builds in the `dist` directory.

### Environment Configuration

For production deployment, set these environment variables:

- `NODE_ENV=production`
- `DATABASE_URL`: Production database connection string
- `PORT`: Server port
- `OPENAI_API_KEY`: OpenAI API key (if using AI features)

### Deployment Options

1. **Traditional Hosting**:
   - Deploy the built application to your server
   - Set up a process manager like PM2:
     ```bash
     npm install -g pm2
     pm2 start dist/server/index.js
     ```

2. **Docker**:
   - Build the Docker image:
     ```bash
     docker build -t trenddrop .
     ```
   - Run the container:
     ```bash
     docker run -p 5000:5000 -e DATABASE_URL=your_db_url trenddrop
     ```

3. **Cloud Platforms**:
   - Deploy to services like Heroku, Render, or Railway
   - Configure environment variables in the platform settings

## License

Copyright © 2025 TrendDrop. All rights reserved.