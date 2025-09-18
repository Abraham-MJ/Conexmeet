'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import useApi from '../useAPi';

interface LoginResponse {
  success: boolean;
  message: string;
}

const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);

  const { execute } = useApi<LoginResponse>(
    '/api/auth/sign-in',
    {
      method: 'POST',
      retryAttempts: 2,
      retryDelay: 1500,
    },
    false,
  );

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const result = await execute('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { email, password },
      });

      if (result?.success && result.data) {
        return result.data;
      } else if (result?.error) {
        return { success: false, message: result.error.message };
      }

      return { success: false, message: 'Error en el login' };
    } catch (err) {
      return { success: false, message: 'Error en el login' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });

      await signOut({
        redirect: true,
        callbackUrl: '/auth/sign-in',
      });
    } catch (error) {
      console.error('Error during logout:', error);
      await signOut({
        redirect: true,
        callbackUrl: '/auth/sign-in',
      });
    }
  };

  return { login, isLoading, logout, setIsLoading };
};

export default useLogin;
