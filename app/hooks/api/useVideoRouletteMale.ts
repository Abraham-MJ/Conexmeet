'use client';

import { useUser } from '@/app/context/useClientContext';
import { HistoryData } from '@/app/types/histories';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export const useVideoRouletteMale = () => {
  const router = useRouter();
  const { state } = useUser();

  const [currentDate, setCurrentDate] = useState('');
  const [histories, setHistories] = useState<HistoryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    const getHistories = async () => {
      try {
        const response = await fetch('/api/histories', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Error en API externa: ${response.statusText}`,
          );
        }

        const data = await response.json();
        if (data.success === true) {
          setHistories(data.data);
        } else {
          setHistories([]);
        }

        return data;
      } catch (error) {
        console.error('Error al obtener historiales:', error);
        throw error;
      }
    };

    getHistories();
  }, []);

  return { histories, isLoading, error, currentDate };
};
