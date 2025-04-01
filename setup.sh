#!/bin/bash

# Create required directories for TrendDrop
echo "Setting up TrendDrop application..."

# Create data directory for SQLite database
mkdir -p data
echo "Created data directory for database storage"

# Create logs directory
mkdir -p logs
echo "Created logs directory"

# Create migrations directory
mkdir -p migrations
echo "Created migrations directory"

# Install required dependencies
echo "Installing dependencies..."
npm install --save-exact better-sqlite3@9.4.1
npm install --save-exact axios@1.6.2 jsdom@22.1.0 node-html-parser@6.1.12 ws@8.18.0 nanoid@5.0.4
npm install --save-dev @types/better-sqlite3@7.6.8 @types/jsdom@21.1.6

echo "Setup completed successfully!"
