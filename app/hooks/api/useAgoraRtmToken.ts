import { useState, useCallback } from 'react';

interface RtmTokenApiResponse {
  rtmToken: string;
}

interface RtmTokenApiErrorResponse {
  error: string;
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
        const response = await fetch(
          `${API_ROUTE_GET_RTM_TOKEN}?uid=${encodeURIComponent(uid)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        const responseData: RtmTokenApiResponse | RtmTokenApiErrorResponse =
          await response.json();

        if (!response.ok) {
          const errorMessage =
            (responseData as RtmTokenApiErrorResponse).error ||
            `Error del servidor: ${response.status}`;
          throw new Error(errorMessage);
        }

        const successData = responseData as RtmTokenApiResponse;
        if (successData.rtmToken) {
          setToken(successData.rtmToken);
          return successData.rtmToken;
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
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { token, isLoading, error, fetchRtmToken };
}
