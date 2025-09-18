interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();
const REQUEST_TIMEOUT = 30000;

const generateRequestKey = (url: string, options?: any): string => {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
};

const cleanupOldRequests = () => {
  const now = Date.now();
  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > REQUEST_TIMEOUT) {
      pendingRequests.delete(key);
    }
  }
};

export const deduplicateRequest = async <T>(
  url: string,
  executeFunction: () => Promise<T>,
  options?: any,
): Promise<T> => {
  const requestKey = generateRequestKey(url, options);

  cleanupOldRequests();

  const existingRequest = pendingRequests.get(requestKey);
  if (existingRequest) {
    console.log(`[DEDUPLICATION] Using existing request for: ${url}`);
    return existingRequest.promise;
  }

  console.log(`[DEDUPLICATION] Creating new request for: ${url}`);
  const promise = executeFunction().finally(() => {
    pendingRequests.delete(requestKey);
  });

  pendingRequests.set(requestKey, {
    promise,
    timestamp: Date.now(),
  });

  return promise;
};
