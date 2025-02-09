import { useState } from 'react';

export function usePasswordRecovery() {
  const [sendIsLoading, setSendIsLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [data, setData] = useState({ email: '', token: '' });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorToken, setErrorToken] = useState(false);

  const validToken = async (token: string) => {
    setIsLoadingToken(true);
    try {
      const response = await fetch(`/api/auth/recovery-password/${token}`);
      const result = await response.json();

      if (!response.ok) {
        setErrorToken(true);
      }

      setData({ ...data, email: result.data.email, token: result.data.token });
      setTimeout(() => {
        setIsLoadingToken(false);
      }, 2000);
      return result;
    } catch (err) {
      setIsLoadingToken(false);
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

      if (!response.ok) {
        return;
      }
      setSuccessEmail(true);

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

      if (!response.ok) {
        setSuccess(false);
        setForgotLoading(false);
      }
      setSuccess(true);
      setForgotLoading(false);
      return result;
    } catch (err: any) {
      setForgotLoading(false);
      setSuccess(false);
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
