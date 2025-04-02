/**
 * QueryClient configuration for TrendDrop
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * Custom API request function for use with React Query
 */
export async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'An error occurred while fetching data');
  }

  return response.json();
}

// Set up query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false
    },
  },
});

export default queryClient;