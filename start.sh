#!/bin/bash

# Start script for TrendDrop - Trendtracker
# This script starts both the Express server and the Python FastAPI backend

# Stop any running Python processes
echo "Stopping any running Python processes..."
pkill -f "python -m uvicorn" || true

# Set environment variables
export PYTHON_API_PORT=8000
export MAX_PRODUCTS=1000

# Initialize the database
echo "Initializing database..."
python -m server.init_db

# Start the Python FastAPI backend in the background
echo "Starting Python FastAPI backend..."
cd "$(dirname "$0")" && python -m server.main &

# Wait for the Python API to start
echo "Waiting for Python API to start..."
sleep 3

# Start the Express server
echo "Starting Express server..."
npm run dev