import { useState, useEffect, useCallback, useRef } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  cacheTime?: number;
  staleTime?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
}

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, PendingRequest>();
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 100;

const generateCacheKey = (url: string, options: UseApiOptions): string => {
  return `${url}_${JSON.stringify({
    method: options.method || 'GET',
    body: options.body,
    headers: options.headers,
  })}`;
};

const isRateLimited = (cacheKey: string): boolean => {
  const now = Date.now();
  const rateLimitData = requestCounts.get(cacheKey);

  if (!rateLimitData || now > rateLimitData.resetTime) {
    requestCounts.set(cacheKey, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return false;
  }

  if (rateLimitData.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  rateLimitData.count++;
  return false;
};

const getCachedData = <T>(cacheKey: string, staleTime: number): T | null => {
  const cached = cache.get(cacheKey);
  if (!cached) return null;

  const now = Date.now();
  const isStale = now - cached.timestamp > staleTime;
  const isExpired = now - cached.timestamp > cached.staleTime;

  if (isExpired) {
    cache.delete(cacheKey);
    return null;
  }

  return cached.data;
};

const setCachedData = <T>(
  cacheKey: string,
  data: T,
  cacheTime: number,
): void => {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    staleTime: cacheTime,
  });
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function useApi<T>(
  initialUrl: string = '',
  initialOptions: UseApiOptions = {},
  autoFetch: boolean = true,
) {
  const [url, setUrl] = useState<string>(initialUrl);
  const [options, setOptions] = useState<UseApiOptions>({
    cacheTime: 5 * 60 * 1000,
    staleTime: 60 * 1000,
    retryAttempts: 3,
    retryDelay: 1000,
    ...initialOptions,
  });
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: autoFetch && !!initialUrl,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (currentUrl?: string, currentOptions?: UseApiOptions) => {
      const targetUrl = currentUrl || url;
      if (!targetUrl) {
        setState((prevState) => ({ ...prevState, loading: false }));
        return;
      }

      const mergedOptions = {
        ...options,
        ...currentOptions,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          ...currentOptions?.headers,
        },
      };

      const cacheKey = generateCacheKey(targetUrl, mergedOptions);

      if (isRateLimited(cacheKey)) {
        const error = new Error('Rate limit exceeded. Please try again later.');
        setState({ data: null, loading: false, error });
        return { success: false, error };
      }

      if (mergedOptions.method === 'GET' || !mergedOptions.method) {
        const cachedData = getCachedData<T>(
          cacheKey,
          mergedOptions.staleTime || 60000,
        );
        if (cachedData) {
          setState({ data: cachedData, loading: false, error: null });
          return { success: true, data: cachedData };
        }
      }

      const pendingRequest = pendingRequests.get(cacheKey);
      if (pendingRequest) {
        try {
          const result = await pendingRequest.promise;
          return result;
        } catch (error) {}
      }

      setState((prevState) => ({ ...prevState, loading: true, error: null }));

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const executeRequest = async (attempt: number = 1): Promise<any> => {
        try {
          const finalOptions = {
            method: mergedOptions.method || 'GET',
            headers: mergedOptions.headers,
            body: mergedOptions.body
              ? JSON.stringify(mergedOptions.body)
              : undefined,
            signal: abortControllerRef.current?.signal,
          };

          const response = await fetch(targetUrl, finalOptions);

          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch (e) {
              errorData = { message: response.statusText };
            }

            if (response.status === 429) {
              throw new Error('Too Many Requests - Rate limit exceeded');
            }

            throw new Error(
              errorData?.message ||
                `Error ${response.status}: ${response.statusText}`,
            );
          }

          const responseData: any = await response.json();

          const data =
            responseData.data !== undefined ? responseData.data : responseData;

          if (finalOptions.method === 'GET') {
            setCachedData(cacheKey, data, mergedOptions.cacheTime || 300000);
          }

          setState({ data: data, loading: false, error: null });
          return { success: true, data: data };
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            return { success: false, error: new Error('Request cancelled') };
          }

          const maxRetries = mergedOptions.retryAttempts || 3;
          const retryDelay = mergedOptions.retryDelay || 1000;

          if (
            attempt < maxRetries &&
            err instanceof Error &&
            (err.message.includes('fetch') || err.message.includes('network'))
          ) {
            await sleep(retryDelay * attempt);
            return executeRequest(attempt + 1);
          }

          const error =
            err instanceof Error ? err : new Error('An unknown error occurred');
          setState({ data: null, loading: false, error });
          return { success: false, error: error };
        }
      };

      const requestPromise = executeRequest();
      pendingRequests.set(cacheKey, {
        promise: requestPromise,
        timestamp: Date.now(),
      });

      try {
        const result = await requestPromise;
        return result;
      } finally {
        pendingRequests.delete(cacheKey);
      }
    },
    [url, options],
  );

  useEffect(() => {
    if (autoFetch && initialUrl) {
      fetchData(initialUrl, initialOptions);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(
    async (executeUrl?: string, executeOptions?: UseApiOptions) => {
      return fetchData(executeUrl || url, executeOptions || options);
    },
    [fetchData, url, options],
  );

  const setApiUrl = (newUrl: string) => {
    setUrl(newUrl);
  };

  const setApiOptions = (newOptions: UseApiOptions) => {
    setOptions((prevOptions) => ({ ...prevOptions, ...newOptions }));
  };

  const clearCache = useCallback(
    (targetUrl?: string) => {
      if (targetUrl) {
        const cacheKey = generateCacheKey(targetUrl, options);
        cache.delete(cacheKey);
      } else {
        cache.clear();
      }
    },
    [options],
  );

  const invalidateCache = useCallback((pattern?: string) => {
    if (pattern) {
      for (const [key] of cache) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  }, []);

  return {
    ...state,
    execute,
    setApiUrl,
    setApiOptions,
    refetch: () => fetchData(url, options),
    clearCache,
    invalidateCache,
    getCacheSize: () => cache.size,
    getPendingRequests: () => pendingRequests.size,
  };
}

setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now - entry.timestamp > entry.staleTime) {
        cache.delete(key);
      }
    }

    for (const [key, request] of pendingRequests) {
      if (now - request.timestamp > 30000) {
        pendingRequests.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

export default useApi;
