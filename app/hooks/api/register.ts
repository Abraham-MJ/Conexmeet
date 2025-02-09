import { useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const registerUser = async (payload: RegisterUserPayload) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Error en el registro');
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      }

      return data;
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
