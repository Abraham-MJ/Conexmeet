import { useState, useCallback } from 'react';
import useApi from '../useAPi';

export interface AugmentedGifItem {
  id: number;
  host_id: string;
  user_id: number;
  another_user_id: number;
  gif_id: number;
  created_at: string;
  updated_at: string;
  gif_name: string;
  points: number;
  sender_name: string | null;
  sender_profile_photo_path?: string | null;
}

interface ApiSuccessResponse {
  status: string;
  message: string;
  data: AugmentedGifItem[];
}

interface UseMyGiftsDataReturn {
  gifts: AugmentedGifItem[] | null;
  isLoading: boolean;
  error: string | null;
  fetchMyGifts: () => Promise<void>;
  apiStatus?: string;
  apiMessage?: string;
}

export function useMyGiftsData(): UseMyGiftsDataReturn {
  const [apiStatus, setApiStatus] = useState<string | undefined>(undefined);
  const [apiMessage, setApiMessage] = useState<string | undefined>(undefined);

  const {
    data: apiData,
    loading: isLoading,
    error: apiError,
    execute,
  } = useApi<AugmentedGifItem[]>(
    '/api/gift/get-gifts-female',
    {
      cacheTime: 3 * 60 * 1000,
      staleTime: 60 * 1000,
      retryAttempts: 3,
    },
    false,
  );

  const fetchMyGifts = useCallback(async () => {
    setApiStatus(undefined);
    setApiMessage(undefined);

    const result = await execute();

    if (result?.success && result.data) {
      setApiStatus('Success');
      setApiMessage('Gifts fetched successfully');
    } else if (result?.error) {
      setApiStatus('Error');
      setApiMessage(result.error.message);
    }
  }, [execute]);

  const error = apiError ? apiError.message : null;

  return {
    gifts: apiData,
    isLoading,
    error,
    fetchMyGifts,
    apiStatus,
    apiMessage,
  };
}
