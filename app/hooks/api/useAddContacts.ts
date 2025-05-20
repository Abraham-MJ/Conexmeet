import { useState } from 'react';

interface ToggleContactApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface UseToggleContactOutput {
  toggleContact: (
    userId: number | string,
  ) => Promise<ToggleContactApiResponse | null>;
  isLoading: boolean;
  error: string | null;
}

export const useAddContacts = (): UseToggleContactOutput => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toggleContact = async (
    userId: number | string,
  ): Promise<ToggleContactApiResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/add-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const result: ToggleContactApiResponse = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage =
          result.message || 'Ocurrió un error al agregar/quitar el contacto.';
        setError(errorMessage);
        setIsLoading(false);
        return result;
      }

      setIsLoading(false);
      return result;
    } catch (err: any) {
      console.error('Error en useToggleContact (fetch):', err);
      const errorMessage =
        err.message || 'Un error inesperado ocurrió al contactar el servidor.';
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  return { toggleContact, isLoading, error };
};
