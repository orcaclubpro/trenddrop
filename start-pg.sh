#!/bin/bash

# Make sure environment variables are properly set for PostgreSQL
export DATABASE_URL=postgres://chance@localhost:5432/trenddrop
export USE_SQLITE=false
export PORT=5001
export NODE_ENV=development

# Function to handle process termination
cleanup() {
    echo "Shutting down server..."
    # Find and kill the Node.js process running on the specified port
    PID=$(lsof -ti:$PORT)
    if [ -n "$PID" ]; then
        echo "Killing process $PID on port $PORT"
        kill -15 $PID
    fi
    exit 0
}

# Set trap for proper cleanup on script termination
trap cleanup SIGINT SIGTERM EXIT

# Print environment variables for debugging
echo "Starting server with:"
echo "DATABASE_URL=$DATABASE_URL"
echo "USE_SQLITE=$USE_SQLITE"
echo "PORT=$PORT"

# Start the server directly (bypassing setup.sh)
npx tsx server/index.ts 