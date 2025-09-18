import { useState } from 'react';
import useApi from '../useAPi';

interface ApiResponse {
  success: boolean;
  message: string;
  [key: string]: any;
}

export function useOTP() {
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const { execute: sendOTPRequest } = useApi<ApiResponse>('/api/auth/sign-in-opt/send-opt', {
    method: 'POST',
    retryAttempts: 2,
    retryDelay: 2000,
  }, false);

  const { execute: verifyOTPRequest } = useApi<ApiResponse>('/api/auth/sign-in-opt/valid-opt', {
    method: 'POST',
    retryAttempts: 2,
    retryDelay: 1500,
  }, false);

  const requestOTP = async (email: string): Promise<ApiResponse> => {
    setLoadingRequest(true);
    try {
      const result = await sendOTPRequest('/api/auth/sign-in-opt/send-opt', {
        method: 'POST',
        body: { email },
      });

      if (result?.success && result.data) {
        return result.data;
      } else if (result?.error) {
        return {
          success: false,
          message: result.error.message || 'Error en la solicitud OTP',
        };
      }
      
      return {
        success: false,
        message: 'Error en la solicitud OTP',
      };
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
      const result = await verifyOTPRequest('/api/auth/sign-in-opt/valid-opt', {
        method: 'POST',
        body: { email, otp },
      });

      if (result?.success && result.data) {
        return result.data;
      } else if (result?.error) {
        return {
          success: false,
          message: result.error.message || 'Error en la verificación OTP',
        };
      }
      
      return {
        success: false,
        message: 'Error en la verificación OTP',
      };
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
