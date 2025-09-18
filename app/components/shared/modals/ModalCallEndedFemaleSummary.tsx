'use client';

import React, { useEffect, useState } from 'react';
import StyledModal from '../../UI/StyledModal';
import { cn } from '@/lib/utils';
import { IoMdClose } from 'react-icons/io';
import { FaDollarSign, FaHourglassEnd, FaInfoCircle } from 'react-icons/fa';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { useTranslation } from '@/app/hooks/useTranslation';

const CallEndedSummaryIcon = ({
  reasonType,
  t,
}: {
  reasonType: string;
  t: (key: string) => string;
}) => {
  let icon;
  let color = '#a1a1aa';

  switch (reasonType) {
    case t('modal.callEnded.endedByYou'):
      icon = <FaHourglassEnd className="h-full w-full" />;
      color = '#22c55e';
      break;
    case t('modal.callEnded.userEnded'):
      icon = <FaHourglassEnd className="h-full w-full" />;
      color = '#f59e0b';
      break;
    case t('modal.callEnded.balanceExhausted'):
      icon = <FaDollarSign className="h-full w-full" />;
      color = '#dc2626';
      break;
    case t('modal.callEnded.unexpectedDisconnection'):
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
  const { t } = useTranslation();
  const { state, closeFemaleCallEndedSummaryModal } = useAgoraContext();
  const { callSummaryInfo } = state;
  const [preventAutoClose, setPreventAutoClose] = useState(false);

  useEffect(() => {
    if (state.showFemaleCallEndedModal && callSummaryInfo) {
      setPreventAutoClose(true);
      const timer = setTimeout(() => {
        setPreventAutoClose(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.showFemaleCallEndedModal, callSummaryInfo]);

  if (!callSummaryInfo) {
    return null;
  }

  const { reason, duration, earnings } = callSummaryInfo;

  return (
    <StyledModal
      isOpen={state.showFemaleCallEndedModal}
      onClose={() => {
        if (!preventAutoClose) {
          closeFemaleCallEndedSummaryModal();
        }
      }}
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
          onClick={() => {
            setPreventAutoClose(false);
            closeFemaleCallEndedSummaryModal();
          }}
        >
          <IoMdClose className="h-6 w-6 text-[#747474]" />
        </div>

        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div
            className="mb-6 rounded-full p-4"
            style={{ width: '90px', height: '90px' }}
          >
            <CallEndedSummaryIcon reasonType={reason} t={t} />
          </div>

          <h2 className="mb-3 text-3xl font-bold text-gray-800">
            {t('modal.callEnded.title')}
          </h2>

          <p className="mb-4 text-lg text-gray-700">
            <span className="font-semibold text-[#fc3d6b]">{reason}</span>
          </p>

          <div className="mb-8 w-full space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="font-medium text-gray-600">
                {t('modal.callEnded.duration')}:
              </span>
              <span className="text-xl font-bold text-gray-800">
                {duration}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="font-medium text-gray-600">
                {t('modal.callEnded.earnings')}:
              </span>
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
