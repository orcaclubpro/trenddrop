# Create a new file: setup.sh

#!/bin/bash

echo "Setting up TrendDrop application..."

# Create required directories
mkdir -p data
mkdir -p logs
mkdir -p .env

# Check if .env file exists, create if not
if [ ! -f .env ]; then
  echo "Creating default .env file..."
  cat > .env << EOF
# Database Configuration
DATABASE_URL=file:./data/trenddrop.db
# Uncomment the line below to use PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/trenddrop

# Application Configuration
PORT=5000
SCRAPING_INTERVAL=3600000
MAX_PRODUCTS=1000
NODE_ENV=production
EOF
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application for production
echo "Building application..."
npm run build

echo "Setup complete! You can now run the application using:"
echo "npm start"
