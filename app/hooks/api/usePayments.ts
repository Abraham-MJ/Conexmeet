import { Package } from '@/app/types/package';
import { useState, useEffect, useCallback } from 'react';

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

  const getListPackage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/get-package');
      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Error HTTP: ${response.status}`);
      }

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'No se pudieron obtener los paquetes.');
        setData(null);
      }
    } catch (err: any) {
      console.error('useFetchPackages Error:', err);
      setError(err.message || 'Ocurrió un error al realizar la solicitud.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (steps === 'payment') {
      if (selectedPackage?.id !== undefined) {
        handlePaymentIntent();
      }
    } else {
      getListPackage();
    }
  }, [steps]);

  const handlePaymentIntent = async () => {
    try {
      setIsLoadingPaymentIntent(true);
      const response = await fetch('/api/payments/intent-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ package_id: selectedPackage?.id }),
      });

      const result = await response.json();

      if (result.success) {
        setIntentPayment(result.data.data);
        return result.data;
      } else {
        console.error(
          'Error al crear el pago:',
          result.message,
          result.details,
        );
        throw new Error(
          result.message || 'Error desconocido al crear el pago.',
        );
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

        const response = await fetch('/api/payments/register-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result: ApiResponse = await response.json();

        if (result.success) {
          return { success: true, data: result.data, message: result.message };
        } else {
          return {
            success: false,
            message: result.message || 'Ocurrió un error al registrar el pago.',
          };
        }
      } catch (err: any) {
        console.error('handlePaymentRegistration Error:', err);
        const errorMessage =
          err.message || 'Ocurrió un error al registrar el pago.';
        return { success: false, message: errorMessage };
      }
    },
    [],
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
