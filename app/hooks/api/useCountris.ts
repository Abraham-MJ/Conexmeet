import { useState, useEffect } from 'react';
import useApi from '../useAPi';

interface Country {
  code: string;
  id: number;
  name: string;
  phonecode: number;
}

export const useCountries = () => {
  const [countries, setCountries] = useState<Country[]>([]);

  const {
    data: countriesData,
    loading: isLoading,
    error: apiError,
  } = useApi<Country[]>('/api/auth/countris', {
    cacheTime: 30 * 60 * 1000, 
    staleTime: 15 * 60 * 1000, 
    retryAttempts: 3,
  }, true); 

  const error = apiError ? apiError.message : null;

  useEffect(() => {
    if (countriesData) {
      setCountries(Array.isArray(countriesData) ? countriesData : []);
    }
  }, [countriesData]);

  return { countries, isLoading, error };
};
