#!/bin/bash

# Install dependencies for the TrendDrop application
echo "Installing dependencies for TrendDrop..."

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r server/requirements.txt

# Initialize the database schema
echo "Initializing database schema..."
npx drizzle-kit push:pg

# Success message
echo "Dependencies installed successfully!"
echo ""
echo "To start the application, run:"
echo "npm run dev"
echo ""
echo "To use the AI Agent, set up the following environment variables (optional):"
echo "- OPENAI_API_KEY: For OpenAI integration"
echo "- LMSTUDIO_API_URL: For LM Studio integration"
echo "- GROK_API_URL and GROK_API_KEY: For Grok integration"
echo "- SEARCH_API_KEY: For web search integration"
echo ""
echo "Visit http://localhost:3000 to access the application"