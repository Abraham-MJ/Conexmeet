import { useState, useEffect, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

function useApi<T>(
  initialUrl: string = '',
  initialOptions: UseApiOptions = {},
  autoFetch: boolean = true,
) {
  const [url, setUrl] = useState<string>(initialUrl);
  const [options, setOptions] = useState<UseApiOptions>(initialOptions);
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: autoFetch && !!initialUrl,
    error: null,
  });

  const fetchData = useCallback(
    async (currentUrl?: string, currentOptions?: UseApiOptions) => {
      const targetUrl = currentUrl || url;
      if (!targetUrl) {
        setState((prevState) => ({ ...prevState, loading: false }));
        return;
      }

      setState((prevState) => ({ ...prevState, loading: true, error: null }));

      try {
        const finalOptions = {
          method: currentOptions?.method || options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            ...currentOptions?.headers,
          },
          body: currentOptions?.body
            ? JSON.stringify(currentOptions.body)
            : options.body
              ? JSON.stringify(options.body)
              : undefined,
        };

        const response = await fetch(targetUrl, finalOptions);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { message: response.statusText };
          }
          throw new Error(
            errorData?.message ||
              `Error ${response.status}: ${response.statusText}`,
          );
        }

        const { data }: any = await response.json();
        setState({ data: data, loading: false, error: null });
        return { success: true, data: data };
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('An unknown error occurred');
        setState({ data: null, loading: false, error });
        return { success: false, error: error };
      }
    },
    [url, options],
  );

  useEffect(() => {
    if (autoFetch && initialUrl) {
      fetchData(initialUrl, initialOptions);
    }
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

  return {
    ...state,
    execute,
    setApiUrl,
    setApiOptions,
    refetch: () => fetchData(url, options),
  };
}

export default useApi;
