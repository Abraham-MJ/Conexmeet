'use client';

import { useState, useEffect } from 'react';
import useApi from '../useAPi';

interface UseGifsResult {
  contentGifts: ExternalGifItem[];
  loading: boolean;
  error: string | null;
}

export interface ExternalGifItem {
  created_at: string | null;
  id: number;
  image: string;
  minutes: number;
  name: string;
  points: number;
  price: number;
  sort: number;
  status: number;
  updated_at: string | null;
}

export interface ExternalGifsApiResponse {
  status: string;
  message: string;
  data: ExternalGifItem[];
}

export interface ExternalUserItem {
  id: number;
  name: string;
  profile_photo_path: string | null;
}

export interface ExternalUsersApiResponse {
  status: string;
  message: string;
  data: ExternalUserItem[];
}

export interface AugmentedGifItem extends ExternalGifItem {
  sender_name: string | null;
  sender_profile_photo_path?: string | null;
}

export const useListGifts = (): UseGifsResult => {
  const [contentGifts, setContentGifts] = useState<ExternalGifItem[]>([]);
  const [shouldRefetch, setShouldRefetch] = useState(0);

  const {
    data: giftsData,
    loading,
    error: apiError,
    execute: fetchGifts,
  } = useApi<ExternalGifItem[]>(
    '/api/gift/get-gifts',
    {
      cacheTime: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
      retryAttempts: 3,
    },
    false,
  );

  const error = apiError ? apiError.message : null;

  const loadGifts = async () => {
    const result = await fetchGifts();

    if (result?.success && result.data) {
      setContentGifts(result.data);
    } else {
      setContentGifts([]);
    }
  };

  useEffect(() => {
    loadGifts();
  }, [shouldRefetch]);

  return { contentGifts, loading, error };
};
