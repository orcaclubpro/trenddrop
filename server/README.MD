# TrendDrop Backend

This is the backend server for the TrendDrop product research tool.

## Architecture

The backend uses FastAPI for the API endpoints and SQLAlchemy for the database ORM. The architecture follows a modular design with the following components:

- **FastAPI Routes**: API endpoints for triggering the agent and retrieving data
- **Database Models**: SQLAlchemy models for Product, Trend, Region, and Video
- **Scraper Agent**: An agent component that uses LM Studio to scrape trending product data

## API Endpoints

### Scraper Control

- `POST /api/scraper/start`: Start the scraper agent to find trending products
- `GET /api/scraper/status`: Get the current status of the scraper job
- `POST /api/scraper/stop`: Stop a running scraper job (not implemented yet)

## Running the Server

To run the server:

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

## Environment Variables

The server can be configured with the following environment variables:

- `DATABASE_URL`: The database connection string (defaults to SQLite)
- `LMSTUDIO_API_URL`: URL of the LM Studio API (defaults to http://localhost:1234/v1)
- `LMSTUDIO_API_KEY`: API key for the LM Studio API

## Agent Integration

The TdScraper agent can be integrated with various LLM backends. The default configuration uses LM Studio running locally.