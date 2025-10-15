import { Package } from '@/app/types/package';
import { useState, useEffect, useCallback } from 'react';
import useApi from '../useAPi';

interface ApiResponse {
  success: boolean;
  data?: Package[];
  message?: string;
}

interface UseFetchPackagesReturn {
  data: Package[] | null;
  error: string | null;
  loading: boolean;
  steps: 'package' | 'payment';
  isLoadingPaymentIntent: boolean;
  handlePayment: () => void;
  setSelectedPackage: React.Dispatch<React.SetStateAction<Package | null>>;
  selectedPackage: Package | null;
  intentPayment: IntentPayment;
  setSteps: React.Dispatch<React.SetStateAction<'package' | 'payment'>>;
  handlePaymentRegistration: (
    payload: PaymentRegistrationPayload,
  ) => Promise<{ success: boolean; data?: Package[]; message?: string }>;
}

export interface IntentPayment {
  customer: string;
  ephemeralKey: string;
  order_id: number;
  package_id: number;
  package_name: string;
  package_price: number;
  paymentIntent: string;
  publishableKey: string;
  session_id: string;
}

export interface PaymentRegistrationPayload {
  payment_intent: string;
  payment_intent_client_secret: string;
  status: string;
}

function usePayments(): UseFetchPackagesReturn {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [steps, setSteps] = useState<'package' | 'payment'>('package');
  const [data, setData] = useState<Package[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [intentPayment, setIntentPayment] = useState<IntentPayment>({
    customer: '',
    ephemeralKey: '',
    order_id: 0,
    package_id: 0,
    package_name: '',
    package_price: 0,
    paymentIntent: '',
    publishableKey: '',
    session_id: '',
  });

  const [isLoadingPaymentIntent, setIsLoadingPaymentIntent] =
    useState<boolean>(false);

  const {
    data: packagesData,
    loading: packagesLoading,
    error: packagesError,
    execute: fetchPackages,
  } = useApi<Package[]>(
    '/api/get-package',
    {
      cacheTime: 10 * 60 * 1000,
      staleTime: 5 * 60 * 1000,
      retryAttempts: 3,
    },
    false,
  );

  const getListPackage = useCallback(async () => {
    const result = await fetchPackages();

    if (result?.success && result.data) {
      setData(result.data);
      setError(null);
    } else if (result?.error) {
      setError(result.error.message);
      setData(null);
    }
  }, [fetchPackages]);

  useEffect(() => {
    if (steps === 'payment') {
      if (selectedPackage?.id !== undefined) {
        handlePaymentIntent();
      }
    } else {
      getListPackage();
    }
  }, [steps]);

  const { execute: createPaymentIntent } = useApi<IntentPayment>(
    '/api/payments/intent-payment',
    {
      method: 'POST',
      retryAttempts: 2,
      retryDelay: 2000,
    },
    false,
  );

  const handlePaymentIntent = async () => {
    try {
      setIsLoadingPaymentIntent(true);

      const result = await createPaymentIntent('/api/payments/intent-payment', {
        method: 'POST',
        body: { package_id: selectedPackage?.id },
      });

      if (result?.success && result.data) {
        const paymentData = result.data.data || result.data;
        setIntentPayment(paymentData);
        return { data: paymentData };
      } else if (result?.error) {
        console.error('Error al crear el pago:', result.error.message);
        throw new Error(
          result.error.message || 'Error desconocido al crear el pago.',
        );
      } else {
        console.error('Respuesta inesperada:', result);
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error) {
      console.error('Error en la solicitud de creación de pago:', error);
      throw error;
    } finally {
      setIsLoadingPaymentIntent(false);
    }
  };

  const handlePayment = () => {
    setSteps('payment');
  };

  const { execute: registerPayment } = useApi<Package[]>(
    '/api/payments/register-payment',
    {
      method: 'POST',
      retryAttempts: 3,
      retryDelay: 1500,
    },
    false,
  );

  const handlePaymentRegistration = useCallback(
    async ({
      payment_intent,
      payment_intent_client_secret,
      status,
    }: PaymentRegistrationPayload) => {
      try {
        const payload: PaymentRegistrationPayload = {
          payment_intent,
          payment_intent_client_secret,
          status,
        };

        const result = await registerPayment('/api/payments/register-payment', {
          method: 'POST',
          body: payload,
        });

        if (result?.success && result.data) {
          return {
            success: true,
            data: result.data,
            message: 'Payment registered successfully',
          };
        } else if (result?.error) {
          return {
            success: false,
            message:
              result.error.message || 'Ocurrió un error al registrar el pago.',
          };
        }

        return {
          success: false,
          message: 'Ocurrió un error al registrar el pago.',
        };
      } catch (err: any) {
        console.error('handlePaymentRegistration Error:', err);
        const errorMessage =
          err.message || 'Ocurrió un error al registrar el pago.';
        return { success: false, message: errorMessage };
      }
    },
    [registerPayment],
  );

  return {
    data,
    error,
    loading,
    steps,
    isLoadingPaymentIntent,
    handlePayment,
    setSelectedPackage,
    selectedPackage,
    intentPayment,
    setSteps,
    handlePaymentRegistration,
  };
}

export default usePayments;
