#!/bin/bash

# Install required dependencies for TrendDrop
echo "Installing required dependencies..."

# Main dependencies
npm install --save better-sqlite3 axios jsdom node-html-parser ws nanoid

# Dev dependencies
npm install --save-dev @types/better-sqlite3 @types/jsdom

echo "Dependencies installed successfully!"
