'use client';

import { useUser } from '@/app/context/useClientContext';
import { HistoryData } from '@/app/types/histories';
import { useState, useEffect, useCallback } from 'react';

export const useVideoRouletteFemale = () => {
  const { state } = useUser();

  const [histories, setHistories] = useState<HistoryData[]>([]);
  const [isLoadingHistories, setIsLoadingHistories] = useState<boolean>(true);
  const [isLoadingDelete, setIsLoadingDelete] = useState<boolean>(false);
  const [isLoadingUpload, setIsLoadingUpload] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistories = async () => {
    setIsLoadingHistories(true);
    setError(null);
    try {
      const response = await fetch('/api/get-my-historie', {
        method: 'GET',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || `Error en API: ${response.statusText}`,
        );
      }

      if (responseData.success === true) {
        const historiesArray = responseData.data?.data;
        setHistories(
          Array.isArray(historiesArray) ? historiesArray : [historiesArray],
        );
      }
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : 'Ocurrió un error desconocido') ||
          'Ocurrió un error desconocido al obtener historiales.',
      );
    } finally {
      setIsLoadingHistories(false);
    }
  };

  const deleteHistoryById = useCallback(
    async (historyId: string | number) => {
      setIsLoadingDelete(true);
      setError(null);
      try {
        const myHeaders = new Headers();
        myHeaders.append('Accept', 'application/json');
        myHeaders.append('Authorization', `Bearer ${state.user.token}`);

        const requestOptions = {
          method: 'DELETE',
          headers: myHeaders,
        };

        const response = await fetch(
          `https://app.conexmeet.live/api/v1/histories/${historyId}`,
          requestOptions,
        );

        let apiResponseMessage: string | null = null;
        let isSuccess = false;

        const externalApiResponse = await response.json();
        apiResponseMessage =
          externalApiResponse.message || 'Error del servicio externo.';
        isSuccess = externalApiResponse.status === 'Success' || response.ok;

        if (isSuccess) {
          setHistories((prevHistories) =>
            prevHistories.filter(
              (history) => String(history.id) !== String(historyId),
            ),
          );
          return {
            success: true,
            message: apiResponseMessage,
          };
        } else {
          throw new Error(
            apiResponseMessage || 'Falló la eliminación del historial.',
          );
        }
      } catch (err) {
        console.error(`Error al eliminar el historial ${historyId}:`, err);
        setError(
          (err instanceof Error
            ? err.message
            : 'Ocurrió un error desconocido') ||
            'Ocurrió un error desconocido al eliminar el historial.',
        );
        return {
          success: false,
          message:
            (err instanceof Error
              ? err.message
              : 'Ocurrió un error desconocido') ||
            'Ocurrió un error desconocido.',
        };
      } finally {
        setIsLoadingDelete(false);
      }
    },
    [state.user?.token],
  );

  const uploadStory = useCallback(
    async (file: File) => {
      setIsLoadingUpload(true);
      setError(null);
      try {
        if (!state.user?.token) {
          throw new Error('No se encontró el token de autenticación.');
        }

        const myHeaders = new Headers();
        myHeaders.append('Accept', 'application/json');
        myHeaders.append('Authorization', `Bearer ${state.user.token}`);

        const formdata = new FormData();
        formdata.append('file', file, file.name);
        formdata.append('type', 'video');

        const requestOptions = {
          method: 'POST',
          headers: myHeaders,
          body: formdata,
        };

        const response = await fetch(
          'https://app.conexmeet.live/api/v1/histories',
          requestOptions,
        );
        const result = await response.json();

        if (result.status === 'Success') {
          return {
            success: true,
            message: result.message || 'Historia subida con éxito.',
          };
        } else {
          throw new Error(result.message || 'La subida de la historia falló.');
        }
      } catch (err) {
        console.error('Error al subir la historia:', err);
        setError(
          (err instanceof Error
            ? err.message
            : 'Ocurrió un error desconocido') ||
            'Ocurrió un error desconocido al subir la historia.',
        );
        return {
          success: false,
          message:
            (err instanceof Error
              ? err.message
              : 'Ocurrió un error desconocido') ||
            'Ocurrió un error desconocido.',
        };
      } finally {
        setIsLoadingUpload(false);
        fetchHistories();
      }
    },
    [state.user?.token],
  );

  useEffect(() => {
    fetchHistories();
  }, []);

  return {
    histories,
    isLoadingHistories,
    error,
    deleteHistoryById,
    isLoadingDelete,
    uploadStory,
    isLoadingUpload,
    refreshHistories: fetchHistories,
  };
};
