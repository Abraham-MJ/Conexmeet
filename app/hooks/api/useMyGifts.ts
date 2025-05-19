import { useState, useCallback } from 'react';

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

interface ApiErrorResponse {
  success: false;
  message: string;
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

interface UseMyGiftsDataReturn {
  gifts: AugmentedGifItem[] | null;
  isLoading: boolean;
  error: string | null;
  fetchMyGifts: () => Promise<void>;
  apiStatus?: string;
  apiMessage?: string;
}

export function useMyGiftsData(): UseMyGiftsDataReturn {
  const [gifts, setGifts] = useState<AugmentedGifItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string | undefined>(undefined);
  const [apiMessage, setApiMessage] = useState<string | undefined>(undefined);

  const fetchMyGifts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGifts(null);
    setApiStatus(undefined);
    setApiMessage(undefined);

    try {
      const response = await fetch('/api/gift/get-gifts-female', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        const errorResult = result as ApiErrorResponse;
        throw new Error(
          errorResult.message ||
            `Error ${response.status}: Failed to fetch gifts.`,
        );
      }

      const successResult = result as ApiSuccessResponse;

      if (successResult.status === 'Success' && successResult.data) {
        setGifts(successResult.data);
        setApiStatus(successResult.status);
        setApiMessage(successResult.message);
      } else if (successResult.status !== 'Success') {
        throw new Error(
          successResult.message || 'The API did not indicate success.',
        );
      } else {
        setGifts([]);
        setApiStatus(successResult.status);
        setApiMessage(
          successResult.message ||
            'Successful response but no gift data found.',
        );
        console.warn(
          'Successful API response but no gift data or unexpected format:',
          successResult,
        );
      }
    } catch (err: any) {
      console.error('Error in useMyGiftsData hook:', err);
      setError(
        err.message || 'An unknown error occurred while fetching gifts.',
      );
      setGifts(null);
      setApiStatus(undefined);
      setApiMessage(undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { gifts, isLoading, error, fetchMyGifts, apiStatus, apiMessage };
}
