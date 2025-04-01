#!/bin/bash

# Exit on any error
set -e

echo "Starting TrendDrop Trendtracker..."

# Check if PostgreSQL environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL environment variable is not set."
  echo "The application will start without database access."
  echo "Please configure the database connection before starting the agent."
fi

# Start the Express.js server (will attempt to connect to the database)
echo "Starting server..."
npm run dev

# The server will be running in the foreground