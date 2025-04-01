#SERVICE LAYER
server/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point
│   ├── models/                  # Database models
│   │   ├── __init__.py
│   │   ├── product.py
│   │   ├── trend.py
│   │   ├── region.py
│   │   └── video.py
│   ├── schemas/                 # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── product.py
│   │   ├── trend.py 
│   │   └── common.py
│   ├── api/                     # API routes
│   │   ├── __init__.py
│   │   ├── endpoints/
│   │   │   ├── __init__.py
│   │   │   ├── dashboard.py
│   │   │   ├── products.py
│   │   │   └── regions.py
│   │   └── api.py               # API router
│   ├── services/                # Business logic
│   │   ├── __init__.py
│   │   ├── product_service.py
│   │   ├── trend_service.py
│   │   └── analysis_service.py
│   ├── scrapers/                # Web scraping functionality
│   │   ├── __init__.py
│   │   ├── product_scraper.py
│   │   ├── trend_scraper.py
│   │   └── social_media_scraper.py
│   ├── analysis/                # Data analysis modules
│   │   ├── __init__.py
│   │   ├── sentiment.py
│   │   ├── trend_detection.py
│   │   └── geographic_analysis.py
│   ├── db/                      # Database setup
│   │   ├── __init__.py
│   │   ├── database.py
│   │   └── storage.py
│   └── core/                    # Core settings
│       ├── __init__.py
│       └── config.py
└── requirements.txt            # Python dependencies
