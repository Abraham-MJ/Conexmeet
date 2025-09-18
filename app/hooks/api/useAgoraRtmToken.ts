import { useState, useCallback } from 'react';
import useApi from '../useAPi';

interface RtmTokenApiResponse {
  rtmToken: string;
}

const API_ROUTE_GET_RTM_TOKEN = '/api/agora/get-token-rtm';

interface UseAgoraRtmTokenReturn {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  fetchRtmToken: (uid: string) => Promise<string | null>;
}

export function useAgoraRtmToken(): UseAgoraRtmTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { execute: getRtmTokenRequest } = useApi<RtmTokenApiResponse>(
    API_ROUTE_GET_RTM_TOKEN,
    {
      cacheTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
      retryAttempts: 3,
      retryDelay: 1500,
    },
    false,
  );

  const fetchRtmToken = useCallback(
    async (uid: string): Promise<string | null> => {
      if (!uid || uid.trim() === '') {
        const errMsg =
          'El UID de usuario es requerido para obtener el token RTM.';
        console.error(errMsg);
        setError(errMsg);
        return null;
      }

      setIsLoading(true);
      setError(null);
      setToken(null);

      try {
        const result = await getRtmTokenRequest(
          `${API_ROUTE_GET_RTM_TOKEN}?uid=${encodeURIComponent(uid)}`,
        );

        if (result?.success && result.data?.rtmToken) {
          setToken(result.data.rtmToken);
          setIsLoading(false);
          return result.data.rtmToken;
        } else if (result?.error) {
          throw new Error(result.error.message || 'Error del servidor');
        } else {
          throw new Error('Token RTM no encontrado en la respuesta de la API.');
        }
      } catch (err) {
        const caughtError =
          err instanceof Error
            ? err.message
            : 'Ocurrió un error desconocido al obtener el token.';
        console.error('Error al obtener el token RTM:', caughtError);
        setError(caughtError);
        setToken(null);
        setIsLoading(false);
        return null;
      }
    },
    [getRtmTokenRequest],
  );

  return { token, isLoading, error, fetchRtmToken };
}
