import {
  ApiResponse,
  RankingItem,
  UseRankingDataReturn,
} from '@/app/types/ranking';
import { useState, useCallback } from 'react';

export function useRanking(): UseRankingDataReturn {
  const [data, setData] = useState<RankingItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/ranking', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Error ${response.status}: Fallo al obtener el ranking.`,
        );
      }

      if (result.data) {
        setData(result.data);
      } else {
        setData([]);
        console.warn('Respuesta exitosa pero sin datos de ranking.');
      }
    } catch (err: any) {
      console.error('Error en el hook useRankingData:', err);
      setError(err.message || 'Ocurrió un error desconocido.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchRanking };
}
