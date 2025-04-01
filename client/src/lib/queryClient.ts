import { QueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface ApiRequestOptions extends RequestInit {
  queryKey?: any;
  baseUrl?: string;
}

/**
 * Default fetcher for React Query
 */
async function defaultFetcher<TData>(url: string, options: RequestInit = {}): Promise<TData> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Handle session/auth errors
    if (response.status === 401) {
      toast({
        title: 'Session expired',
        description: 'Please refresh the page and log in again.',
        variant: 'destructive',
      });
      throw new Error('Unauthorized');
    }

    // Handle other API errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'An error occurred';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorText;
      } catch (e) {
        errorMessage = errorText || 'An unknown error occurred';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as TData;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Make an API request
 */
export async function apiRequest<TData>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<TData> {
  // Create a URL if a baseUrl was provided
  const requestUrl = options.baseUrl ? new URL(url, options.baseUrl).toString() : url;
  
  // Handle cache keys for mutations
  if (options.queryKey && queryClient) {
    const method = options.method || 'GET';
    
    // Invalidate query cache after mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      await defaultFetcher<TData>(requestUrl, options);
      await queryClient.invalidateQueries({ queryKey: options.queryKey as string });
      return {} as TData; // Return empty for mutations
    }
  }
  
  // Otherwise, use the default fetcher
  return defaultFetcher<TData>(requestUrl, options);
}

// Create and configure the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      queryFn: ({ queryKey }) => 
        defaultFetcher(Array.isArray(queryKey) ? queryKey[0] as string : queryKey as string),
    },
  },
});