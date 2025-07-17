'use client';

import React, { useState } from 'react';
import ContainerGlobal from './ContainerGlobal';
import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IoMdClose } from 'react-icons/io';
import { MdOutlineSecurity } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import ModalUploadKyc from '../modals/ModalUploadKyc';

export type StatusType = '2' | '0' | '-1';

const VerifyDocuments = ({ status }: { status: StatusType }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ContainerGlobal classNames="max-w-2xl mx-auto">
        <div className={cn('w-full bg-white')}>
          <div className="flex flex-col items-center space-y-1.5 p-6 pt-0 text-center">
            <div className="mb-4 rounded-full bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] p-4">
              {status === '2' && <Clock className="h-12 w-12 text-white" />}
              {status === '0' && (
                <MdOutlineSecurity className="h-12 w-12 text-white" />
              )}
              {status === '-1' && (
                <IoMdClose className="h-12 w-12 text-white" />
              )}
            </div>
            <h2 className="text-3xl font-semibold leading-none tracking-tight">
              {status === '2' && 'Verificación en Proceso'}
              {status === '0' && 'Acción Requerida'}
              {status === '-1' && 'Verificación Rechazada'}
            </h2>
          </div>
          <div className="p-6 pt-0">
            <p className="text-center text-base text-gray-600">
              {status === '2' &&
                'Hemos recibido tus documentos. Nuestro equipo los está revisando, esto puede tardar un poco.'}
              {status === '0' &&
                'Para continuar, necesitas cargar tus documentos de identificación para que podamos verificar tu cuenta.'}
              {status === '-1' &&
                'Hubo un problema con los documentos que enviaste. Por favor, revisa los detalles e inténtalo de nuevo.'}
            </p>
            {status === '2' && (
              <p className="mt-4 text-sm text-gray-600">
                Tiempo estimado de revisión:{' '}
                <strong>24-48 horas hábiles</strong>.
              </p>
            )}

            {status === '0' && (
              <div className="mt-4 space-y-2 rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
                <p className="font-semibold text-gray-900">
                  Documentos requeridos:
                </p>
                <ul className="list-inside list-disc space-y-1">
                  <li>Foto del pasaporte (frente y reverso)</li>
                  <li>Foto Sosteniendo el Pasaporte</li>
                </ul>
              </div>
            )}

            {status === '-1' && (
              <div className="mt-4 space-y-2 rounded-lg border border-red-200 bg-red-100 p-4 text-sm text-red-900 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-200">
                <p className="flex items-center font-semibold">
                  <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0" />
                  Motivos comunes de rechazo:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>La imagen del documento es borrosa o ilegible.</li>
                  <li>El documento ha expirado.</li>
                  <li>La información no coincide con tu perfil.</li>
                </ul>
                <p className="pt-2">
                  Si necesitas ayuda, contacta a{' '}
                  <a href="#" className="font-medium underline">
                    soporte
                  </a>
                  .
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-4 p-6 pt-0">
            <Button
              className={cn(
                'w-full rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium transition-all duration-300 hover:bg-[#de2c7c]/80',
              )}
              onClick={() => {
                if (status === '2') {
                  window.location.reload();
                } else if (status === '0') {
                  setIsOpen(true);
                } else if (status === '-1') {
                  setIsOpen(true);
                }
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {status === '2' && 'Actualizar Página'}
                {status === '0' && 'Cargar Documentos'}
                {status === '-1' && 'Reintentar Verificación'}
              </span>
            </Button>
          </div>
        </div>
      </ContainerGlobal>
      <ModalUploadKyc
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </>
  );
};

export default VerifyDocuments;
