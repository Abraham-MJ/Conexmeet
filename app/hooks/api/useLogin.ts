'use client';

import { redirect } from 'next/navigation';
import { useState } from 'react';

interface LoginResponse {
  success: boolean;
  message: string;
}

const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        return data;
      }

      return data;
    } catch (err) {
      return { success: false, message: 'Error en el login' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout');
      const data = await response.json();

      window.location.href = '/auth/sign-in';
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/auth/sign-in';
    }
  };

  return { login, isLoading, logout };
};

export default useLogin;
