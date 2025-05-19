import { useState, useCallback } from 'react';

export interface ReferralItem {
  id: number;
  name: string;
  created_at: string;
}

interface ApiSuccessResponse {
  status: string;
  message: string;
  data: ReferralItem[];
}

interface ApiErrorResponse {
  success: false;
  message: string;
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

interface UseMyReferralsDataReturn {
  referrals: ReferralItem[] | null;
  isLoading: boolean;
  error: string | null;
  fetchMyReferrals: () => Promise<void>;
  apiStatus?: string;
  apiMessage?: string;
}

export function useReferral(): UseMyReferralsDataReturn {
  const [referrals, setReferrals] = useState<ReferralItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string | undefined>(undefined);
  const [apiMessage, setApiMessage] = useState<string | undefined>(undefined);

  const fetchMyReferrals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setReferrals(null);
    setApiStatus(undefined);
    setApiMessage(undefined);

    try {
      const response = await fetch('/api/referral', {
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
            `Error ${response.status}: Failed to fetch referrals.`,
        );
      }

      const successResult = result as ApiSuccessResponse;

      if (successResult.status === 'Success' && successResult.data) {
        setReferrals(successResult.data);
        setApiStatus(successResult.status);
        setApiMessage(successResult.message);
      } else if (successResult.status !== 'Success') {
        throw new Error(
          successResult.message ||
            'The referrals API did not indicate success.',
        );
      } else {
        setReferrals([]);
        setApiStatus(successResult.status);
        setApiMessage(
          successResult.message ||
            'Successful response but no referral data found.',
        );
        console.warn(
          'Successful API response but no referral data or unexpected format:',
          successResult,
        );
      }
    } catch (err: any) {
      console.error('Error in useMyReferralsData hook:', err);
      setError(
        err.message || 'An unknown error occurred while fetching referrals.',
      );
      setReferrals(null);
      setApiStatus(undefined);
      setApiMessage(undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    referrals,
    isLoading,
    error,
    fetchMyReferrals,
    apiStatus,
    apiMessage,
  };
}
