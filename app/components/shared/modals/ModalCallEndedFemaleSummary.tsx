'use client';

import React from 'react';
import StyledModal from '../../UI/StyledModal';
import { cn } from '@/lib/utils';
import { IoMdClose } from 'react-icons/io';
import { FaDollarSign, FaHourglassEnd, FaInfoCircle } from 'react-icons/fa';
import { useAgoraContext } from '@/app/context/useAgoraContext';

const CallEndedSummaryIcon = ({ reasonType }: { reasonType: string }) => {
  let icon;
  let color = '#a1a1aa';

  switch (reasonType) {
    case 'Finalizada por ti':
      icon = <FaHourglassEnd className="h-full w-full" />;
      color = '#22c55e';
      break;
    case 'Usuario finalizó la llamada':
      icon = <FaHourglassEnd className="h-full w-full" />;
      color = '#f59e0b';
      break;
    case 'Saldo agotado':
      icon = <FaDollarSign className="h-full w-full" />;
      color = '#dc2626';
      break;
    case 'Desconexión inesperada':
      icon = <FaInfoCircle className="h-full w-full" />;
      color = '#ef4444';
      break;
    default:
      icon = <FaInfoCircle className="h-full w-full" />;
      color = '#fc3d6b';
      break;
  }

  return <div className={`text-${color.replace('#', '')}`}>{icon}</div>;
};

const ModalCallEndedFemaleSummary = () => {
  const { state, closeFemaleCallEndedSummaryModal } = useAgoraContext();
  const { callSummaryInfo } = state;

  if (!callSummaryInfo) {
    return null;
  }

  const { reason, duration, earnings } = callSummaryInfo;

  return (
    <StyledModal
      isOpen={state.showFemaleCallEndedModal}
      onClose={closeFemaleCallEndedSummaryModal}
      title=""
      position="center"
      noClose
      noPadding
      width="500px"
    >
      <div
        className={cn(
          'relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-xl',
        )}
      >
        <div
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full border p-3 transition-all duration-300 hover:scale-110"
          onClick={closeFemaleCallEndedSummaryModal}
        >
          <IoMdClose className="h-6 w-6 text-[#747474]" />
        </div>

        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div
            className="mb-6 rounded-full p-4"
            style={{ width: '90px', height: '90px' }}
          >
            <CallEndedSummaryIcon reasonType={reason} />
          </div>

          <h2 className="mb-3 text-3xl font-bold text-gray-800">
            Llamada Finalizada
          </h2>

          <p className="mb-4 text-lg text-gray-700">
            Motivo:{' '}
            <span className="font-semibold text-[#fc3d6b]">{reason}</span>
          </p>

          <div className="mb-8 w-full space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="font-medium text-gray-600">Duración:</span>
              <span className="text-xl font-bold text-gray-800">
                {duration}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="font-medium text-gray-600">Ganancias:</span>
              <span className="text-xl font-bold text-green-600">
                ${earnings}
              </span>
            </div>
          </div>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalCallEndedFemaleSummary;
