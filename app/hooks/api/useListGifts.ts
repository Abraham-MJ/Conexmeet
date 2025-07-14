import { useState, useEffect } from 'react';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldRefetch, setShouldRefetch] = useState(0);

  const fetchGifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gift/get-gifts');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Error al obtener los GIFs: ${response.status}`,
        );
      }

      const data: ExternalGifsApiResponse = await response.json();

      if (data.status === 'Success' && Array.isArray(data.data)) {
        setContentGifts(data.data);
      } else {
        throw new Error(
          data.message || 'Formato de datos inesperado de la API.',
        );
      }
    } catch (err: any) {
      console.error('Error fetching GIFs:', err);
      setError(err.message || 'Ocurrió un error desconocido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGifs();
  }, [shouldRefetch]);

  return { contentGifts, loading, error };
};
