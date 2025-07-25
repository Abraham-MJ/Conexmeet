'use client';

import React, { useEffect, useState } from 'react';
import { useAgoraContext } from '../../../context/useAgoraContext';
import StyledModal from '../../UI/StyledModal';
import { FaRegCircleXmark } from 'react-icons/fa6';
import { useTranslation } from '@/app/hooks/useTranslation';

export const ChannelHoppingBlockedModal: React.FC = () => {
  const { t } = useTranslation();
  const {
    showChannelHoppingBlockedModal,
    closeChannelHoppingBlockedModal,
    channelHoppingBlockTimeRemaining,
  } = useAgoraContext();

  const [timeRemaining, setTimeRemaining] = useState(
    channelHoppingBlockTimeRemaining,
  );

  useEffect(() => {
    setTimeRemaining(channelHoppingBlockTimeRemaining);
  }, [channelHoppingBlockTimeRemaining]);

  useEffect(() => {
    if (!showChannelHoppingBlockedModal || timeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1);
        if (newTime === 0) {
          closeChannelHoppingBlockedModal();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    showChannelHoppingBlockedModal,
    timeRemaining,
    closeChannelHoppingBlockedModal,
  ]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <StyledModal
      isOpen={showChannelHoppingBlockedModal}
      onClose={closeChannelHoppingBlockedModal}
      title=""
      position="center"
      noClose
      noPadding
      width="500px"
    >
      <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)]">
            <FaRegCircleXmark className="text-3xl text-white" />
          </div>

          <h3 className="mb-2 text-lg font-medium text-gray-900">
            {t('modal.channelHopping.title')}
          </h3>

          <div className="mb-4 space-y-2 text-sm text-gray-600">
            <p>{t('modal.channelHopping.description1')}</p>
            <p>
              {t('modal.channelHopping.description2')}
            </p>
          </div>

          <div className="mb-4 rounded-lg bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">
              {t('modal.channelHopping.timeRemaining')}:
            </p>
            <p className="text-2xl font-bold text-red-600">
              {formatTime(timeRemaining)}
            </p>
          </div>

          <div className="mb-4 rounded bg-gray-50 p-3 text-left text-xs text-gray-500">
            <p className="mb-1 font-medium">💡 {t('modal.channelHopping.tips')}:</p>
            <ul className="space-y-1">
              <li>• {t('modal.channelHopping.tip1')}</li>
              <li>• {t('modal.channelHopping.tip2')}</li>
              <li>• {t('modal.channelHopping.tip3')}</li>
            </ul>
          </div>

          <button
            onClick={closeChannelHoppingBlockedModal}
            className={
              'w-full rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-3 text-lg font-medium text-white transition-all duration-300'
            }
          >
            {t('modal.channelHopping.understood')}
          </button>
        </div>
      </div>
    </StyledModal>
  );
};
