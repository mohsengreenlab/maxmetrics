import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const controller = new AbortController();
    // Use longer timeout for detailed API calls
    const isDetailedCall = queryKey.join('/').includes('details=true');
    const timeoutDuration = isDetailedCall ? 90000 : 60000; // 90s for detailed, 60s for regular
    
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutDuration);
    
    // Combine external signal (from React Query) with our timeout signal
    const combinedSignal = signal || controller.signal;
    
    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        signal: combinedSignal,
      });
      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle all types of abort/cancellation errors
      if (error instanceof Error && (
        error.name === 'AbortError' || 
        error.message?.includes('aborted') ||
        error.message?.includes('cancelled')
      )) {
        // Create a specific error that won't trigger unhandled rejection
        const cancelError = new Error('Request was cancelled by user or timeout');
        cancelError.name = 'CancelledError';
        throw cancelError;
      }
      
      // For other errors, wrap them to prevent unhandled rejections
      if (error instanceof Error) {
        const wrappedError = new Error(error.message);
        wrappedError.name = error.name;
        throw wrappedError;
      }
      
      throw new Error('Unknown error occurred');
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      // Cache detailed calls longer since they're expensive
      gcTime: 300000, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});