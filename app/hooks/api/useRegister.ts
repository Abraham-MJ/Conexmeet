import { useState } from 'react';
import useApi from '../useAPi';

interface RegisterUserPayload {
  email: string;
  password: string;
  password_confirmation: string;
  name: string;
  gender: string;
  terms: string;
  phone?: string;
  referral_code?: string;
  country_id: string;
  otp?: string;
  birthdate: string;
}

interface UseRegisterUser {
  registerUser: (payload: RegisterUserPayload) => Promise<any>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function useRegisterUser(): UseRegisterUser {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { execute } = useApi<any>('/api/auth/register', {
    method: 'POST',
    retryAttempts: 2,
    retryDelay: 2000,
  }, false);

  const registerUser = async (payload: RegisterUserPayload) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await execute('/api/auth/register', {
        method: 'POST',
        body: payload,
      });

      if (result?.success && result.data) {
        setSuccess(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
        return result.data;
      } else if (result?.error) {
        setError(result.error.message || 'Error en el registro');
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
        return { success: false, message: result.error.message };
      }
      
      setError('Error en el registro');
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      return { success: false, message: 'Error en el registro' };
    } catch (err) {
      setError('Error al conectar con el servidor');
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      return { success: false, message: 'Error al conectar con el servidor' };
    }
  };

  return { registerUser, isLoading, error, success };
}
