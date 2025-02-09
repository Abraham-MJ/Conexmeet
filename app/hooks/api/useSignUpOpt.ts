import { useState } from 'react';

interface ApiResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

export function useOTP() {
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const requestOTP = async (email: string): Promise<ApiResponse> => {
    setLoadingRequest(true);
    try {
      const response = await fetch('/api/auth/sign-in-opt/send-opt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en la solicitud OTP');
      }

      return data;
    } catch (error: any) {
      console.error(error);
      return {
        success: false,
        message: error.message || 'Error en la solicitud OTP',
      };
    } finally {
      setLoadingRequest(false);
    }
  };

  const verifyOTP = async (
    email: string,
    otp: string,
  ): Promise<ApiResponse> => {
    setLoadingVerify(true);
    try {
      const response = await fetch('/api/auth/sign-in-opt/valid-opt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en la verificación OTP');
      }

      return data;
    } catch (error: any) {
      console.error(error);
      return {
        success: false,
        message: error.message || 'Error en la verificación OTP',
      };
    } finally {
      setLoadingVerify(false);
    }
  };

  return { requestOTP, verifyOTP, loadingRequest, loadingVerify };
}
