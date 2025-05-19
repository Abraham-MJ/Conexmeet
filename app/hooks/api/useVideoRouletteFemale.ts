'use client';

import { useUser } from '@/app/context/useClientContext';
import { HistoryData } from '@/app/types/histories';
import { useState, useEffect, useCallback } from 'react';

export const useVideoRouletteFemale = () => {
  const { state } = useUser();

  const [histories, setHistories] = useState<HistoryData[]>([]);
  const [isLoadingHistories, setIsLoadingHistories] = useState<boolean>(true);
  const [isLoadingDelete, setIsLoadingDelete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistories = useCallback(async () => {
    setIsLoadingHistories(true);
    setError(null);
    try {
      const response = await fetch('/api/get-my-historie', {
        method: 'GET',
        cache: 'no-store',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || `Error en API: ${response.statusText}`,
        );
      }

      if (responseData.success === true) {
        const historiesArray = responseData.data?.data;

        setHistories([historiesArray]);
      } else {
        setHistories([]);
        if (responseData.message) setError(responseData.message);
      }
    } catch (err: any) {
      setError(
        err.message || 'Ocurrió un error desconocido al obtener historiales.',
      );
      setHistories([]);
    } finally {
      setIsLoadingHistories(false);
    }
  }, []);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  const deleteHistoryById = async (historyId: string | number) => {
    setIsLoadingDelete(true);
    setError(null);
    try {
      const response = await fetch(`/api/delete-historie/${historyId}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();
      console.log('DELETE HISTORIE:', responseData);

      if (!response.ok) {
        throw new Error(
          responseData.message || `Error al eliminar: ${response.statusText}`,
        );
      }

      if (responseData.success === true) {
        setHistories((prevHistories) =>
          prevHistories.filter(
            (history) => String(history.id) !== String(historyId),
          ),
        );
        return {
          success: true,
          message: responseData.message || 'Historial eliminado con éxito.',
        };
      } else {
        throw new Error(
          responseData.message ||
            'Falló la eliminación del historial desde la API.',
        );
      }
    } catch (err: any) {
      console.error(`Error al eliminar el historial ${historyId}:`, err);
      setError(
        err.message || 'Ocurrió un error desconocido al eliminar el historial.',
      );
      return {
        success: false,
        message: err.message || 'Ocurrió un error desconocido.',
      };
    } finally {
      setIsLoadingDelete(false);
    }
  };

  const handleVideoChat = async () => {
    const gender = state?.user?.gender;

    if (gender === 'male') {
    } else if (gender === 'female') {
    }
  };

  return {
    histories,
    isLoadingHistories,
    error,
    handleVideoChat,
    deleteHistoryById,
    isLoadingDelete,
    refreshHistories: fetchHistories,
  };
};
