import { useState, useCallback } from 'react';
import useApi from '../useAPi';

export interface ReferralItem {
  id: number;
  name: string;
  created_at: string;
}

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
  const [apiStatus, setApiStatus] = useState<string | undefined>(undefined);
  const [apiMessage, setApiMessage] = useState<string | undefined>(undefined);

  const {
    data: referralsData,
    loading: isLoading,
    error: apiError,
    execute: fetchReferralsRequest,
  } = useApi<ReferralItem[]>(
    '/api/referral',
    {
      cacheTime: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
      retryAttempts: 3,
    },
    false,
  );

  const error = apiError ? apiError.message : null;

  const fetchMyReferrals = useCallback(async () => {
    setApiStatus(undefined);
    setApiMessage(undefined);

    const result = await fetchReferralsRequest();

    if (result?.success && result.data) {
      setReferrals(result.data);
      setApiStatus('Success');
      setApiMessage('Referrals fetched successfully');
    } else if (result?.error) {
      setReferrals(null);
      setApiStatus('Error');
      setApiMessage(result.error.message);
    } else {
      setReferrals([]);
      setApiStatus('Success');
      setApiMessage('No referral data found');
    }
  }, [fetchReferralsRequest]);

  return {
    referrals,
    isLoading,
    error,
    fetchMyReferrals,
    apiStatus,
    apiMessage,
  };
}
