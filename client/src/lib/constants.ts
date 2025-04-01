/**
 * API endpoints for interacting with the backend
 */
export const API = {
  BASE: '/api',
  PRODUCTS: '/api/products',
  GET_PRODUCT: (id: number) => `/api/products/${id}`,
  TRENDING_PRODUCTS: '/api/products/trending',
  PRODUCTS_BY_CATEGORY: (category: string) => `/api/products/category/${category}`,
  PRODUCTS_BY_REGION: (region: string) => `/api/products/region/${region}`,
  CATEGORIES: '/api/categories',
  REGIONS: '/api/regions',
  TRENDS: '/api/trends',
  TRENDS_FOR_PRODUCT: (productId: number) => `/api/trends/product/${productId}`,
  VIDEOS: '/api/videos',
  VIDEOS_FOR_PRODUCT: (productId: number) => `/api/videos/product/${productId}`,
  REGIONS_FOR_PRODUCT: (productId: number) => `/api/regions/product/${productId}`,
  DASHBOARD: '/api/dashboard',
  EXPORT: '/api/export',
  EXPORT_PRODUCT: (id: number) => `/api/export/product/${id}`,
  HEALTH: '/api/health',
  AI_AGENT: '/api/agent',
  WEBSOCKET: (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + 
             '//' + window.location.host + '/ws'
};

/**
 * Websocket message types
 */
export const WS_MESSAGE_TYPES = {
  CLIENT_CONNECTED: 'client_connected',
  CLIENT_DISCONNECTED: 'client_disconnected',
  AGENT_STATUS: 'agent_status',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_UPDATE: 'product_update',
  INITIALIZE: 'initialize',
  START: 'start',
  STOP: 'stop'
};

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Trend score ranges for visualization
 */
export const TREND_SCORE_RANGES = [
  { min: 0, max: 20, label: 'Very Low' },
  { min: 21, max: 40, label: 'Low' },
  { min: 41, max: 60, label: 'Medium' },
  { min: 61, max: 80, label: 'High' },
  { min: 81, max: 100, label: 'Very High' }
];

/**
 * Chart colors for different metrics
 */
export const CHART_COLORS = {
  TREND: '#3b82f6',       // Blue
  ENGAGEMENT: '#10b981',  // Green
  SALES: '#8b5cf6',       // Purple
  SEARCH: '#f59e0b',      // Amber
  GEOGRAPHIC: '#ef4444'   // Red
};