# AI Layer Services for TrendDrop

This directory contains the AI services used by TrendDrop for discovering, analyzing, and validating trending products for dropshipping.

## Overview

The AI layer is structured as a collection of modular services that work together to provide product intelligence:

1. **LLM Service**: Provides a unified interface to interact with various LLM providers (OpenAI, local models, etc.)
2. **Web Search Service**: Searches the web for trending products and validates them against wholesaler sites
3. **Trend Analysis Service**: Analyzes product trends and calculates trend scores
4. **AI Agent Service**: Main service that coordinates all other services

## Directory Structure

- `interfaces.ts`: Common interfaces used across all AI services
- `index.ts`: Exports all services and functions
- `llm-service.ts`: LLM interaction service
- `web-search-service.ts`: Web search and product validation service
- `trend-analysis-service.ts`: Trend analysis and scoring service
- `ai-agent-service.ts`: Main AI agent service

## Usage

### Initialization and Starting

```typescript
import { initializeAIAgent, startAIAgent } from './services/ai';

// Initialize the AI agent
await initializeAIAgent();

// Start the AI agent (runs product discovery)
await startAIAgent();
```

### Stopping and Status Checking

```typescript
import { stopAIAgent, getAIAgentStatus } from './services/ai';

// Stop the AI agent
stopAIAgent();

// Get the current status
const status = getAIAgentStatus();
```

## Environment Variables

The AI services can be configured using the following environment variables:

- `OPENAI_API_KEY`: OpenAI API key for LLM interactions (optional)
- `LMSTUDIO_API_URL`: URL for LM Studio API (optional, defaults to http://localhost:1234/v1/chat/completions)
- `LMSTUDIO_MODEL`: Model to use with LM Studio (optional)
- `GROK_API_URL`: Grok API URL (optional)
- `GROK_API_KEY`: Grok API key (optional)
- `GROK_MODEL`: Grok model to use (optional, defaults to grok-1)
- `SEARCH_API_KEY`: API key for web search (optional)

## Features

The AI agent performs the following tasks:

1. Discovers trending product categories
2. Searches for specific products within those categories
3. Validates products against wholesaler sites (AliExpress, CJ Dropshipping, etc.)
4. Calculates trend scores based on engagement, sales, and search metrics
5. Generates geographic distribution data
6. Generates marketing video data
7. Stores everything in the database

The server broadcasts status updates and product changes via WebSocket, enabling real-time updates to the client.