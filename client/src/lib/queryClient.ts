import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  method?: string;
  body?: string | object;
  headers?: Record<string, string>;
}

/**
 * Utility for making API requests with proper error handling
 * @param url API endpoint URL
 * @param options Request options
 */
export async function apiRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const requestOptions: RequestInit = {
    method,
    headers: {
      ...(typeof body === 'string' || body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    credentials: "include",
  };

  if (body) {
    requestOptions.body = typeof body === 'string' ? 
      body : 
      JSON.stringify(body);
  }

  const response = await fetch(url, requestOptions);
  await throwIfResNotOk(response);
  
  // Check if response has content
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return (await response.text()) as unknown as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
