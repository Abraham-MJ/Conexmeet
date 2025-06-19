'use client';

import React from 'react';
import StyledModal from '../../UI/StyledModal';
import { cn } from '@/lib/utils';
import { IoMdClose } from 'react-icons/io';
import { useAgoraContext } from '@/app/context/useAgoraContext';

const NoChannelsIcon = () => (
  <svg width="90" height="90" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#a1a1aa" strokeWidth="2" />
    <line
      x1="5"
      y1="19"
      x2="19"
      y2="5"
      stroke="#a1a1aa"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ModalNotChannel = () => {
  const { state, closeNoChannelsAvailableModal } = useAgoraContext();

  return (
    <StyledModal
      isOpen={state.showNoChannelsAvailableModalForMale}
      onClose={closeNoChannelsAvailableModal}
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
          onClick={closeNoChannelsAvailableModal}
        >
          <IoMdClose className="h-6 w-6 text-[#747474]" />
        </div>

        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 rounded-full bg-gray-100 p-4">
            <NoChannelsIcon />
          </div>

          <h2 className="mb-3 text-2xl font-bold text-gray-800">
            Modelos No Disponibles
          </h2>

          <p className="mb-6 max-w-md text-gray-600">
            Lo sentimos, en este momento no hay modelos disponibles para iniciar
            una conexión.
          </p>
          <p className="text-md mb-8 max-w-md text-gray-500">
            Por favor, inténtalo de nuevo más tarde. Estamos trabajando para que
            siempre tengas opciones.
          </p>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalNotChannel;
