# TrendDrop - Trendtracker Backend

This is the Python FastAPI backend server for the TrendDrop Trendtracker product research tool.

## Architecture

The backend leverages FastAPI for high-performance API endpoints and SQLAlchemy for robust database ORM capabilities. The architecture follows a clean, modular design with the following components:

- **FastAPI Routes**: REST API endpoints for triggering the agent and retrieving product data
- **Database Models**: SQLAlchemy models for Product, Trend, Region, and Video entities
- **Research Agent**: Advanced AI agent component that utilizes LM Studio with a Grok model to discover trending products
- **Data Analysis Module**: Processes raw data to calculate trend scores and other metrics
- **Wholesaler Integration**: Verifies products on sites like AliExpress and CJDropshipping

## Components

### 1. API Layer (`/app/api`)
- RESTful API endpoints for frontend communication
- Authentication and rate limiting
- Input validation and error handling

### 2. Database Layer (`/app/db`)
- SQLAlchemy database connection and session management
- Database migration tools
- Query optimization

### 3. Models (`/app/models`)
- `Product`: Core product data with trend metrics
- `Trend`: Historical trend data points for time-series analysis
- `Region`: Geographic distribution information
- `Video`: Marketing video content associated with products

### 4. Research Agent (`/app/services/agents`)
- `tdSCRAPER.py`: Main agent implementation
- Web scraping capabilities
- Natural language processing for product analysis
- Trend detection algorithms

## API Endpoints

### Data Retrieval
- `GET /api/products`: Get trending products with filtering options
- `GET /api/products/:id`: Get detailed product information
- `GET /api/categories`: List available product categories
- `GET /api/regions`: Get geographical distribution data
- `GET /api/dashboard`: Get summary dashboard statistics

### Agent Control
- `POST /api/scraper/start`: Start the research agent to find trending products
- `GET /api/scraper/status`: Check the current status of the research job
- `POST /api/scraper/stop`: Stop a running research job (planned)

## Running the Server

To run the server:

```bash
# Install dependencies
pip install -r requirements.txt

# Create database tables
python -c "from app.db.database import Base, engine; from app.models.product import Product; from app.models.trend import Trend; from app.models.region import Region; from app.models.video import Video; Base.metadata.create_all(bind=engine)"

# Run the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Environment Variables

The server can be configured with the following environment variables:

- `DATABASE_URL`: The database connection string (PostgreSQL recommended)
- `LMSTUDIO_API_URL`: URL of the LM Studio API (defaults to http://localhost:1234/v1)
- `LMSTUDIO_API_KEY`: API key for the LM Studio API
- `WHOLESALER_API_KEY`: API key for verifying products with wholesalers
- `MAX_PRODUCTS`: Maximum number of products to process (default: 1000)
- `LOG_LEVEL`: Logging level (default: INFO)

## Agent Integration

The TrendDrop research agent leverages advanced language models to analyze trends across multiple platforms. Key capabilities include:

1. **Multiplatform Analysis**: Scans social media, marketplaces, and trend sources
2. **Intelligent Filtering**: Prioritizes products with high potential
3. **Wholesaler Verification**: Confirms product availability and pricing
4. **Trend Scoring**: Calculates comprehensive trend scores based on multiple factors

By default, the agent uses LM Studio with a Grok model running locally, but it can be configured to use other LLM backends, including remotely hosted models.

## Development

For local development:

1. Set up a local PostgreSQL database
2. Install LM Studio and load a Grok model
3. Configure environment variables in a `.env` file
4. Run the server in development mode

The agent can run in simulation mode for testing without making actual web requests by setting `SIMULATION_MODE=true` in the environment variables.