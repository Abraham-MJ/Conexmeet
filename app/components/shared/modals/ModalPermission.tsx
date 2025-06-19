'use client';

import React from 'react';
import StyledModal from '../../UI/StyledModal';
import { cn } from '@/lib/utils';
import { Camera, Mic } from 'lucide-react';
import { useAgoraContext } from '@/app/context/useAgoraContext';

const ModalPermission = () => {
  const { state } = useAgoraContext();

  return (
    <StyledModal
      isOpen={state.showMediaPermissionsModal}
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
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">
            Preparando tu Conexión
          </h2>

          <p className="mb-6 text-gray-600">
            Estamos preparando tu cámara y micrófono. Por favor, **acepta los
            permisos** en la ventana emergente de tu navegador.
          </p>

          <div className="mb-6 w-full">
            <div className="mb-3 flex items-center gap-4 rounded-lg bg-gray-100 p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#000]/15">
                <Camera size={24} className="text-[#000]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">
                  Acceso a la cámara
                </h3>
                <p className="text-sm text-gray-600">
                  Para que otros puedan verte durante la llamada.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-gray-100 p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#000]/15">
                <Mic size={24} className="text-[#000]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">
                  Acceso al micrófono
                </h3>
                <p className="text-sm text-gray-600">
                  Para que otros puedan escucharte durante la llamada.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 w-full rounded-lg bg-gray-50 p-4">
            <p className="text-sm italic text-gray-600">
              Estos permisos son esenciales para el video chat. Una vez
              aceptados, puedes gestionarlos desde la configuración de tu
              navegador.
            </p>
          </div>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalPermission;
