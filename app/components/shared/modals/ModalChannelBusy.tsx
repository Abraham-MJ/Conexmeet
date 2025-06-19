'use client';

import React from 'react';
import StyledModal from '../../UI/StyledModal';
import { cn } from '@/lib/utils';
import { IoMdClose } from 'react-icons/io';
import { useAgoraContext } from '@/app/context/useAgoraContext';

const ChannelBusyIcon = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
      fill="#dc2626"
    />
  </svg>
);

const ModalChannelBusy = () => {
  const { state, closeChannelIsBusyModal } = useAgoraContext();

  return (
    <StyledModal
      isOpen={state.showChannelIsBusyModal}
      onClose={() => {}}
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
          onClick={closeChannelIsBusyModal}
        >
          <IoMdClose className="h-6 w-6 text-[#747474]" />
        </div>

        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 rounded-full bg-gray-100 p-4">
            <ChannelBusyIcon />
          </div>

          <h2 className="mb-3 text-2xl font-bold text-gray-800">
            Llamada Ocupada
          </h2>

          <p className="mb-6 max-w-md text-lg text-gray-600">
            La conexión que intentaste establecer ya se encuentra activa con
            otro usuario.
          </p>
          <p className="text-md mb-8 max-w-md text-gray-500">
            Por favor, elige otra modelo o inténtalo con esta más tarde.
          </p>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalChannelBusy;
