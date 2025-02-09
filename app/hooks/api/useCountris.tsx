import { useState, useEffect } from 'react';

interface Country {
  code: string;
  id: number;
  name: string;
  phonecode: number;
}

export const useCountries = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/countris');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message);
        }

        setCountries(data.data.data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return { countries, isLoading, error };
};
