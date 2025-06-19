'use client';

import React, { useState } from 'react';
import StyledModal from '../../UI/StyledModal';
import { IoMdClose } from 'react-icons/io';
import { cn } from '@/lib/utils';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import ModalPackage from './ModalPackage';

const InsufficientMinutesIcon = () => (
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

const ModalInsufficientMinutes = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { state } = useAgoraContext();

  const handleRechargeClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      <StyledModal
        isOpen={false}
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
            onClick={() => {}}
          >
            <IoMdClose className="h-6 w-6 text-[#747474]" />
          </div>

          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 rounded-full bg-gray-50 p-4">
              <InsufficientMinutesIcon />
            </div>

            <h2 className="mb-3 text-2xl font-bold text-gray-800">
              Minutos Insuficientes
            </h2>

            <p className="mb-6 max-w-md text-gray-600">
              No tienes suficientes minutos disponibles para iniciar esta
              conexión.
            </p>
            <p className="text-md mb-8 max-w-md text-gray-500">
              Por favor, recarga tu saldo para poder conectar con nuestras
              modelos.
            </p>

            <div className="flex w-full flex-col space-y-3">
              <button
                onClick={handleRechargeClick}
                className="w-full rounded-xl bg-[#fc3d6b] px-6 py-3 text-lg font-semibold text-white outline-none transition-all duration-300 hover:bg-[#e03762]"
              >
                Recargar Minutos
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

export default ModalInsufficientMinutes;
