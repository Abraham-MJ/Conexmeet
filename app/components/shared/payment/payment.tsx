'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Appearance,
  loadStripe,
  StripeElementsOptions,
} from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import {
  IntentPayment,
  PaymentRegistrationPayload,
} from '@/app/hooks/api/usePayments';
import { Package } from '@/app/types/package';
import StripeCheckoutForm from '../../UI/StyledCheckoutForm';
import StripeSkeletonLoader from '../../loading/stripe-skeleton'; 

interface PaymentIntentProps {
  config: IntentPayment | null;
  isLoading: boolean;
  selectedPackage: Package | null;
  handlePaymentRegistration: (payload: PaymentRegistrationPayload) => Promise<{
    success: boolean;
    data?: Package[];
    message?: string;
  }>;
  onClose?: () => void;
}

const appearance: Appearance = {
  theme: 'flat',
};

export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface MessageObject {
  text: string;
  type: MessageType;
}

const PaymentPackageView: React.FC<PaymentIntentProps> = ({
  config,
  isLoading,
  selectedPackage,
  handlePaymentRegistration,
  onClose,
}) => {
  const [message, setMessage] = useState<MessageObject | null>(null);

  const clientSecret = config?.paymentIntent;
  const publishableKey = config?.publishableKey;

  useEffect(() => {
    if (message !== null) {
      handlePaymentRegistration({
        payment_intent: clientSecret ?? '',
        payment_intent_client_secret: publishableKey ?? '',
        status: message.type,
      });
    }
  }, [message]);

  const stripePromise = useMemo(() => {
    if (publishableKey) {
      return loadStripe(publishableKey);
    }
    return null;
  }, [publishableKey]);

  const options: StripeElementsOptions | undefined = useMemo(() => {
    if (clientSecret) {
      return {
        clientSecret,
        appearance,
      };
    }
    return undefined;
  }, [clientSecret]);

  if (isLoading) {
    return <StripeSkeletonLoader />;
  }

  let messageContainerClasses = 'rounded-md p-2 shadow-lg ';
  let messageTextClasses = '';

  if (message) {
    switch (message.type) {
      case 'success':
        messageContainerClasses += 'bg-green-100 rounded-lg';
        messageTextClasses = 'text-green-700 text-sm';
        break;
      case 'error':
        messageContainerClasses += 'bg-red-100 rounded-lg';
        messageTextClasses = 'text-red-700 text-sm';
        break;
      case 'info':
        messageContainerClasses += 'bg-blue-100 rounded-lg';
        messageTextClasses = 'text-blue-700 text-sm';
        break;
      case 'warning':
        messageContainerClasses += 'bg-yellow-100 rounded-lg';
        messageTextClasses = 'text-yellow-700 text-sm';
        break;
      default:
        messageContainerClasses += 'bg-gray-100 rounded-lg';
        messageTextClasses = 'text-gray-700 text-sm';
    }
    messageContainerClasses += '';
  }

  return (
    <div>
      {message && (
        <div
          id="payment-message"
          role="alert"
          className={messageContainerClasses}
        >
          <p className={messageTextClasses}>{message.text}</p>
        </div>
      )}

      <Elements stripe={stripePromise} options={options}>
        {selectedPackage && (
          <StripeCheckoutForm
            selectedPackage={selectedPackage}
            setMessage={setMessage}
            onClose={onClose}
          />
        )}
      </Elements>
    </div>
  );
};

export default PaymentPackageView;
