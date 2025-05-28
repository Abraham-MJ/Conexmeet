'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Package } from '@/app/types/package';
import { MessageObject } from '../shared/payment/payment';

interface StripeCheckoutFormProps {
  selectedPackage: Package;
  setMessage: (message: MessageObject | null) => void;
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  selectedPackage,
  setMessage,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecretFromUrl = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret',
    );

    if (!clientSecretFromUrl) {
      return;
    }

    stripe
      .retrievePaymentIntent(clientSecretFromUrl)
      .then(({ paymentIntent, error: retrieveError }) => {
        if (retrieveError) {
          setMessage({
            text: `Error al recuperar el intento de pago: ${retrieveError.message}`,
            type: 'error',
          });
          return;
        }
        if (!paymentIntent) {
          setMessage({
            text: 'Error al recuperar la información del pago después de la redirección (intento no encontrado).',
            type: 'error',
          });
          return;
        }
        switch (paymentIntent.status) {
          case 'succeeded':
            setMessage({
              text: '¡Pago exitoso (verificado después de redirección)!',
              type: 'success',
            });
            break;
          case 'processing':
            setMessage({
              text: 'Tu pago se está procesando (verificado después de redirección).',
              type: 'info',
            });
            break;
          case 'requires_payment_method':
            setMessage({
              text: 'Tu pago no fue exitoso, por favor intenta de nuevo (verificado después de redirección).',
              type: 'error',
            });
            break;
          default:
            setMessage({
              text: `Algo salió mal con el pago (estado: ${paymentIntent.status}, verificado después de redirección).`,
              type: 'error',
            });
            break;
        }
      });
  }, [stripe, setMessage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setMessage({
        text: 'Stripe no está listo. Por favor, espera un momento.',
        type: 'warning',
      });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required',
    });

    if (error) {
      setMessage({
        text: error.message || 'Ocurrió un error inesperado durante el pago.',
        type: 'error',
      });
    } else if (paymentIntent) {
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage({ text: '¡Pago confirmado y exitoso!', type: 'success' });
          break;
        case 'processing':
          setMessage({
            text: 'Tu pago se está procesando. Te notificaremos cuando se complete.',
            type: 'info',
          });
          break;
        case 'requires_payment_method':
          setMessage({
            text: 'El pago falló o requiere un método de pago diferente. Por favor, intenta de nuevo.',
            type: 'error',
          });
          break;
        case 'requires_action':
          setMessage({
            text: 'Se requiere una acción adicional para completar el pago (ej. autenticación). Sigue las instrucciones.',
            type: 'info',
          });
          break;
        default:
          setMessage({
            text: `Estado del pago: ${paymentIntent.status}.`,
            type: 'info',
          });
          break;
      }
    } else {
      setMessage({
        text: 'El estado del pago es desconocido después del intento de confirmación.',
        type: 'warning',
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs' }} />

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className={`active:scale-[0.98]' group relative mt-8 w-full transform overflow-hidden rounded-full bg-gradient-to-b from-orange-300/90 to-orange-400/90 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-gray-500/25 ${
          !stripe || !elements || isProcessing
            ? 'cursor-not-allowed opacity-50'
            : ''
        }`}
      >
        <div className="relative flex items-center justify-center gap-3 px-2 py-3">
          <div className="flex flex-col items-center">
            <span className="font-medium tracking-wide text-white">
              {isProcessing ? 'Procesando...' : 'Continuar Compra'}
            </span>
            {selectedPackage && (
              <span className="text-sm font-medium text-white">
                ${selectedPackage.price} - {selectedPackage.description}
              </span>
            )}
          </div>
        </div>
      </button>
    </form>
  );
};

export default StripeCheckoutForm;
