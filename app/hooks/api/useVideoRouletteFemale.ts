'use client';

import { useUser } from '@/app/context/useClientContext';
import { HistoryData } from '@/app/types/histories';
import { useState, useEffect, useCallback } from 'react';
import useApi from '../useAPi';

export const useVideoRouletteFemale = () => {
  const { state } = useUser();

  const [histories, setHistories] = useState<HistoryData[]>([]);
  const [isLoadingDelete, setIsLoadingDelete] = useState<boolean>(false);
  const [isLoadingUpload, setIsLoadingUpload] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const {
    data: historiesData,
    loading: isLoadingHistories,
    error: historiesError,
    execute: fetchHistoriesRequest,
    invalidateCache,
  } = useApi<HistoryData[]>(
    '/api/get-my-historie',
    {
      cacheTime: 3 * 60 * 1000,
      staleTime: 60 * 1000,
      retryAttempts: 3,
    },
    false,
  );

  const fetchHistories = async () => {
    setError(null);
    try {
      const result = await fetchHistoriesRequest();

      if (result?.success && result.data) {
        const historiesArray = Array.isArray(result.data)
          ? result.data
          : [result.data];
        setHistories(historiesArray);
      } else if (result?.error) {
        setError(result.error.message);
      }
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : 'Ocurrió un error desconocido') ||
          'Ocurrió un error desconocido al obtener historiales.',
      );
    }
  };

  const { execute: deleteHistoryRequest } = useApi<any>(
    'https://app.conexmeet.live/api/v1/histories',
    {
      method: 'DELETE',
      retryAttempts: 2,
      retryDelay: 2000,
    },
    false,
  );

  const deleteHistoryById = useCallback(
    async (historyId: string | number) => {
      setIsLoadingDelete(true);
      setError(null);
      try {
        const result = await deleteHistoryRequest(
          `https://app.conexmeet.live/api/v1/histories/${historyId}`,
          {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${state.user.token}`,
            },
          },
        );

        if (result?.success) {
          setHistories((prevHistories) =>
            prevHistories.filter(
              (history) => String(history.id) !== String(historyId),
            ),
          );

          invalidateCache('get-my-historie');

          return {
            success: true,
            message: 'Historia eliminada exitosamente',
          };
        } else if (result?.error) {
          throw new Error(
            result.error.message || 'Falló la eliminación del historial.',
          );
        }

        throw new Error('Falló la eliminación del historial.');
      } catch (err) {
        console.error(`Error al eliminar el historial ${historyId}:`, err);
        const errorMessage =
          (err instanceof Error
            ? err.message
            : 'Ocurrió un error desconocido') ||
          'Ocurrió un error desconocido al eliminar el historial.';

        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setIsLoadingDelete(false);
      }
    },
    [state.user?.token, deleteHistoryRequest, invalidateCache],
  );

  const uploadStory = useCallback(
    async (file: File) => {
      setIsLoadingUpload(true);
      setError(null);
      try {
        if (!state.user?.token) {
          throw new Error('No se encontró el token de autenticación.');
        }

        const formdata = new FormData();
        formdata.append('file', file, file.name);
        formdata.append('type', 'video');

        const response = await fetch(
          'https://app.conexmeet.live/api/v1/histories',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${state.user.token}`,
            },
            body: formdata,
          },
        );

        const result = await response.json();

        if (result.status === 'Success' || response.ok) {
          invalidateCache('get-my-historie');
          await fetchHistories();

          return {
            success: true,
            message: result.message || 'Historia subida con éxito.',
          };
        } else {
          throw new Error(result.message || 'La subida de la historia falló.');
        }
      } catch (err) {
        console.error('Error al subir la historia:', err);
        const errorMessage =
          (err instanceof Error
            ? err.message
            : 'Ocurrió un error desconocido') ||
          'Ocurrió un error desconocido al subir la historia.';

        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setIsLoadingUpload(false);
      }
    },
    [state.user?.token, invalidateCache, fetchHistories],
  );

  useEffect(() => {
    fetchHistories();
  }, []);

  const combinedError =
    error || (historiesError ? historiesError.message : null);

  return {
    histories,
    isLoadingHistories,
    error: combinedError,
    deleteHistoryById,
    isLoadingDelete,
    uploadStory,
    isLoadingUpload,
    refreshHistories: fetchHistories,
  };
};
