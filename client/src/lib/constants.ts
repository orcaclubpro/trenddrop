// API endpoints
export const API = {
  DASHBOARD: '/api/dashboard',
  PRODUCTS: '/api/products',
  CATEGORIES: '/api/categories',
  REGIONS: '/api/regions',
  EXPORT: '/api/export',
  HEALTH: '/api/health',
  PING: '/api/ping',
  AI_AGENT: {
    INITIALIZE: '/api/ai-agent/initialize',
    START: '/api/ai-agent/start',
    STOP: '/api/ai-agent/stop',
    STATUS: '/api/ai-agent/status',
  },
  WEBSOCKET: 'ws://localhost:5000/ws',
};

// Chart colors for consistency
export const CHART_COLORS = {
  ENGAGEMENT: 'hsl(var(--chart-1))',
  SALES: 'hsl(var(--chart-2))',
  SEARCH: 'hsl(var(--chart-3))',
  GEOGRAPHIC: 'hsl(var(--chart-4))',
  TREND: 'hsl(var(--chart-5))',
};

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 10;

// Trend score ranges for visual indicators
export const TREND_SCORE_RANGES = {
  LOW: { min: 0, max: 30, color: 'text-yellow-500' },
  MEDIUM: { min: 31, max: 70, color: 'text-blue-500' },
  HIGH: { min: 71, max: 100, color: 'text-green-500' },
};

// Date format for display
export const DATE_FORMAT = 'MMM dd, yyyy';

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  CONNECTION_ESTABLISHED: 'connection_established',
  CLIENT_CONNECTED: 'client_connected',
  AGENT_STATUS: 'agent_status',
  NEW_PRODUCT: 'new_product',
  PRODUCT_UPDATE: 'product_update',
  DATABASE_STATUS: 'database_status',
};