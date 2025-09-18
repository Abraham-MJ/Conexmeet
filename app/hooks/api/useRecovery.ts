import { useState } from 'react';
import useApi from '../useAPi';

export function usePasswordRecovery() {
  const [sendIsLoading, setSendIsLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [data, setData] = useState({ email: '', token: '' });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorToken, setErrorToken] = useState(false);

  const { execute: validateTokenRequest } = useApi<any>('/api/auth/recovery-password', {
    retryAttempts: 2,
    retryDelay: 1500,
  }, false);

  const { execute: sendEmailRequest } = useApi<any>('/api/auth/recovery-password/recovery', {
    method: 'POST',
    retryAttempts: 2,
    retryDelay: 2000,
  }, false);

  const { execute: resetPasswordRequest } = useApi<any>('/api/auth/recovery-password/forgot-password', {
    method: 'POST',
    retryAttempts: 2,
    retryDelay: 2000,
  }, false);

  const validToken = async (token: string) => {
    setIsLoadingToken(true);
    setErrorToken(false);
    
    try {
      const result = await validateTokenRequest(`/api/auth/recovery-password/${token}`);

      if (result?.success && result.data) {
        setData({ 
          email: result.data.email || '', 
          token: result.data.token || token 
        });
      } else {
        setErrorToken(true);
      }

      setTimeout(() => {
        setIsLoadingToken(false);
      }, 2000);
      
      return result?.data || result;
    } catch (err) {
      setIsLoadingToken(false);
      setErrorToken(true);
      console.error(err);
    }
  };

  const sendEmailRecovery = async (email: string) => {
    setSendIsLoading(true);
    setSuccessEmail(false);

    try {
      const formData = new FormData();
      formData.append('email', email);

      const response = await fetch('/api/auth/recovery-password/recovery', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessEmail(true);
      }

      return data;
    } catch (err: any) {
      setSuccessEmail(false);
      return;
    } finally {
      setSendIsLoading(false);
    }
  };

  const resetPassword = async ({
    token,
    email,
    password,
    password_confirmation,
  }: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    setForgotLoading(true);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('password_confirmation', password_confirmation);

      const response = await fetch(
        '/api/auth/recovery-password/forgot-password',
        {
          method: 'POST',
          body: formData,
        },
      );

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      }
      
      return result;
    } catch (err: any) {
      setSuccess(false);
      console.error('Reset password error:', err);
    } finally {
      setForgotLoading(false);
    }
  };

  return {
    validToken,
    sendEmailRecovery,
    sendIsLoading,
    successEmail,
    isLoadingToken,
    data,
    resetPassword,
    forgotLoading,
    success,
    errorToken,
  };
}
