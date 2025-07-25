'use client';

import React, { useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { FaHourglassEnd } from 'react-icons/fa';

import ModalPackage from './ModalPackage';
import StyledModal from '../../UI/StyledModal';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { useTranslation } from '../../../hooks/useTranslation';

const ModalMinutesExhausted = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const { state, closeMinutesExhaustedModal } = useAgoraContext();

  return (
    <>
      <StyledModal
        isOpen={state.showMinutesExhaustedModal}
        onClose={closeMinutesExhaustedModal}
        title=""
        position="center"
        noClose
        noPadding
        width="500px"
      >
        <div
          className={
            'relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-xl'
          }
        >
          <div
            className="absolute right-4 top-4 z-10 cursor-pointer rounded-full border p-3 transition-all duration-300 hover:scale-110"
            onClick={closeMinutesExhaustedModal}
          >
            <IoMdClose className="h-6 w-6 text-[#747474]" />
          </div>

          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 rounded-full bg-gray-50 p-4">
              <FaHourglassEnd size={48} className="mx-auto text-[#fc3d6b]" />
            </div>

            <h2 className="mb-3 text-2xl font-bold text-gray-800">
              {t('modal.minutesExhausted.title')}
            </h2>

            <p className="mb-6 max-w-md text-gray-600">
              {t('modal.minutesExhausted.description')}
            </p>
            <p className="text-md mb-8 max-w-md text-gray-500">
              {t('modal.minutesExhausted.instruction')}
            </p>

            <div className="flex w-full flex-col space-y-3">
              <button
                onClick={() => {
                  closeMinutesExhaustedModal();
                  setIsOpen(true);
                }}
                className="w-full rounded-xl bg-[#fc3d6b] px-6 py-3 text-lg font-semibold text-white outline-none transition-all duration-300 hover:bg-[#e03762]"
              >
                {t('modal.minutesExhausted.rechargeNow')}
              </button>
            </div>
          </div>
        </div>
      </StyledModal>
      <ModalPackage
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </>
  );
};

export default ModalMinutesExhausted;
