import {
  ApiResponse,
  RankingItem,
  UseRankingDataReturn,
} from '@/app/types/ranking';
import { useCallback } from 'react';
import useApi from '../useAPi';

export function useRanking(): UseRankingDataReturn {
  const {
    data: apiData,
    loading,
    error: apiError,
    execute,
  } = useApi<RankingItem[]>(
    '/api/ranking',
    {
      cacheTime: 2 * 60 * 1000,
      staleTime: 30 * 1000,
      retryAttempts: 3,
    },
    false,
  );

  const fetchRanking = useCallback(async () => {
    await execute();
  }, [execute]);

  const error = apiError ? apiError.message : null;

  return {
    data: apiData,
    loading,
    error,
    fetchRanking,
  };
}
