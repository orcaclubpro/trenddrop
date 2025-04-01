import { QueryClient } from '@tanstack/react-query';

// API request helper for mutations
export async function apiRequest<T>(
  url: string, 
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT', 
  data?: unknown
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `API request failed: ${response.status} ${response.statusText}`
    );
  }
  
  return response.json();
}

// Default fetcher for React Query
async function defaultFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `API request failed: ${response.status} ${response.statusText}`
    );
  }
  
  return response.json();
}

// Configure the query client with defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      queryFn: ({ queryKey }) => 
        defaultFetcher(Array.isArray(queryKey) ? queryKey[0] as string : queryKey as string),
    },
  },
});