import React, { useEffect } from 'react';
import StyledModal from '../../UI/StyledModal';
import { IoMdClose } from 'react-icons/io';
import { FaCoins } from 'react-icons/fa6';
import { useUser } from '@/app/context/useClientContext';
import usePayments from '@/app/hooks/api/usePayments';
import { Package } from '@/app/types/package';
import ListPackagesView from '../payment/list-package';
import PaymentPackageView from '../payment/payment';
import { cn } from '@/lib/utils';

const ModalPackage = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const {
    data: packages,
    error: errorPackage,
    loading: loadingPackage,
    steps,
    handlePayment,
    selectedPackage,
    setSelectedPackage,
    intentPayment,
    isLoadingPaymentIntent,
    setSteps,
    handlePaymentRegistration,
  } = usePayments();

  const { state: user } = useUser();

  useEffect(() => {
    setSelectedPackage(null);
    setSteps('package');
  }, [isOpen]);

  return (
    <StyledModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      position="left"
      width="600px"
      height="100%"
      noPadding
      noClose
    >
      <div
        className={cn(
          'relative h-full w-full overflow-auto rounded-2xl p-4',
          steps === 'package'
            ? 'bg-gradient-to-b from-orange-500 via-orange-400 to-orange-600'
            : 'bg-gradient-to-b from-orange-400 via-orange-400 to-orange-500',
        )}
      >
        <div className="flex w-full flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCoins className="h-6 w-6 text-[#ffd000]" />
            <span className="font-medium text-white">
              Minutes: {user.user.minutes}
            </span>
          </div>
          <div
            className="cursor-pointer rounded-full border p-3"
            onClick={onClose}
          >
            <IoMdClose className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="py-4">
          {steps === 'package' && (
            <ListPackagesView
              packages={packages ?? []}
              selectedPackage={selectedPackage as Package}
              setSelectedPackage={setSelectedPackage}
              handlePayment={handlePayment}
            />
          )}
          {steps === 'payment' && selectedPackage && (
            <PaymentPackageView
              config={intentPayment}
              isLoading={isLoadingPaymentIntent}
              selectedPackage={selectedPackage}
              handlePaymentRegistration={handlePaymentRegistration}
            />
          )}
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalPackage;
