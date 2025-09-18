'use client';

import { useUser } from '@/app/context/useClientContext';
import { HistoryData } from '@/app/types/histories';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useApi from '../useAPi';

export const useVideoRouletteMale = () => {
  const router = useRouter();
  const { state } = useUser();

  const [currentDate, setCurrentDate] = useState('');
  const [histories, setHistories] = useState<HistoryData[]>([]);

  const {
    data: historiesData,
    loading: isLoading,
    error: apiError,
    execute: fetchHistories,
  } = useApi<HistoryData[]>(
    '/api/histories',
    {
      cacheTime: 2 * 60 * 1000,
      staleTime: 30 * 1000,
      retryAttempts: 3,
    },
    true,
  );

  const error = apiError ? apiError.message : null;

  useEffect(() => {
    const timeInterval = setInterval(() => {
      const now = new Date();

      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');

      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      const month = now.toLocaleString('en', { month: 'short' }).toUpperCase();
      const day = now.getDate().toString().padStart(2, '0');
      const year = now.getFullYear();
      setCurrentDate(`${ampm} ${hours}:${minutes} ${month}, ${day} ${year}`);
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (historiesData) {
      setHistories(Array.isArray(historiesData) ? historiesData : []);
    }
  }, [historiesData]);

  return {
    histories,
    isLoading,
    error,
    currentDate,
    refreshHistories: fetchHistories,
  };
};
