'use client';

import React, { ChangeEvent, useState } from 'react';
import StyledModal from '../../UI/StyledModal';
import { cn } from '@/lib/utils';
import { IoMdClose } from 'react-icons/io';
import { FileCheck2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useKycUpload from '@/app/hooks/api/useUploadVerification';
import { motion } from 'framer-motion';
import { useTranslation } from '@/app/hooks/useTranslation';

interface ModalUploadKycProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 3;

const ModalUploadKyc: React.FC<ModalUploadKycProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [passportFront, setPassportFront] = useState<File | null>(null);
  const [passportBack, setPassportBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const { handleVerification, isLoading, error, reset } = useKycUpload();

  const progress = (step / TOTAL_STEPS) * 100;

  const handleNext = async () => {
    if (step === 3) {
      if (passportFront && passportBack && selfie) {
        const success = await handleVerification(
          passportFront,
          passportBack,
          selfie,
        );
        if (success) {
          onClose();
          setStep(0);
          reset();
          setPassportBack(null);
          setPassportFront(null);
          setSelfie(null);
        }
      } else {
        console.error(
          'Todos los archivos deben ser seleccionados antes de enviar la verificación KYC.',
        );
      }
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      reset();
    }
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    } else {
      setter(null);
    }
    reset();
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1:
        return !passportFront || isLoading;
      case 2:
        return !passportBack || isLoading;
      case 3:
        return !passportFront || !passportBack || !selfie || isLoading;
      default:
        return isLoading;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex w-full flex-col">
            <h3 className="mb-2 text-2xl font-bold">
              {t('modal.kyc.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('modal.kyc.description')}
            </p>
            <div className="mt-8 w-full space-y-4 rounded-lg bg-gray-50 p-4 text-left">
              <div className="flex items-start gap-4">
                <div>
                  <h4 className="font-medium text-gray-800">
                    1- {t('modal.kyc.front')}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t('modal.kyc.frontDescription')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div>
                  <h4 className="font-medium text-gray-800">
                    2- {t('modal.kyc.back')}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t('modal.kyc.backDescription')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div>
                  <h4 className="font-medium text-gray-800">
                    3- {t('modal.kyc.selfie')}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t('modal.kyc.selfieDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="w-full">
            <h3 className="mb-8 mt-2 text-xl font-medium text-gray-900">
              {t('modal.kyc.uploadFront')}
            </h3>
            <label
              htmlFor="file-upload-front"
              className="relative flex h-56 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:bg-gray-50"
            >
              {passportFront ? (
                <div className="flex flex-col items-center text-green-600">
                  <FileCheck2 className="mb-2 h-12 w-12" />
                  <span className="font-semibold">{passportFront.name}</span>
                  <span className="mt-1 text-sm text-gray-500">
                    Archivo seleccionado. Haz clic para cambiar.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <UploadCloud className="mb-2 h-12 w-12" />
                  <span className="font-semibold">
                    Haz clic para subir un archivo
                  </span>
                  <span className="text-sm">o arrástralo y suéltalo aquí</span>
                </div>
              )}
              <input
                id="file-upload-front"
                type="file"
                className="sr-only"
                onChange={(e) => handleFileChange(e, setPassportFront)}
                accept="image/png, image/jpeg, image/webp"
              />
            </label>
          </div>
        );
      case 2:
        return (
          <div className="w-full">
            <h3 className="mb-8 mt-2 text-xl font-medium text-gray-900">
              Sube el reverso de tu pasaporte
            </h3>
            <label
              htmlFor="file-upload-back"
              className="relative flex h-56 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:bg-gray-50"
            >
              {passportBack ? (
                <div className="flex flex-col items-center text-green-600">
                  <FileCheck2 className="mb-2 h-12 w-12" />
                  <span className="font-semibold">{passportBack.name}</span>
                  <span className="mt-1 text-sm text-gray-500">
                    Archivo seleccionado. Haz clic para cambiar.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <UploadCloud className="mb-2 h-12 w-12" />
                  <span className="font-semibold">
                    Haz clic para subir un archivo
                  </span>
                  <span className="text-sm">o arrástralo y suéltalo aquí</span>
                </div>
              )}
              <input
                id="file-upload-back"
                type="file"
                className="sr-only"
                onChange={(e) => handleFileChange(e, setPassportBack)}
                accept="image/png, image/jpeg, image/webp"
              />
            </label>
          </div>
        );
      case 3:
        return (
          <div className="w-full">
            <h3 className="mb-8 mt-2 text-xl font-medium text-gray-900">
              Sube tu foto sosteniendo el pasaporte
            </h3>
            <label
              htmlFor="file-upload-selfie"
              className="relative flex h-56 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:bg-gray-50"
            >
              {selfie ? (
                <div className="flex flex-col items-center text-green-600">
                  <FileCheck2 className="mb-2 h-12 w-12" />
                  <span className="font-semibold">{selfie.name}</span>
                  <span className="mt-1 text-sm text-gray-500">
                    Archivo seleccionado. Haz clic para cambiar.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <UploadCloud className="mb-2 h-12 w-12" />
                  <span className="font-semibold">
                    Haz clic para subir un archivo
                  </span>
                  <span className="text-sm">o arrástralo y suéltalo aquí</span>
                </div>
              )}
              <input
                id="file-upload-selfie"
                type="file"
                className="sr-only"
                onChange={(e) => handleFileChange(e, setSelfie)}
                accept="image/png, image/jpeg, image/webp"
              />
            </label>
            {error && (
              <p className="mt-4 text-sm text-red-600">
                Error al enviar: {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <StyledModal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      position="center"
      noClose
      noPadding
      width="700px"
    >
      <div
        className={cn(
          'relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-xl',
        )}
      >
        <div className="flex items-center justify-between p-4 pb-4">
          <span className="text-lg font-medium"></span>
          <div
            className="h-12 w-12 cursor-pointer rounded-full border p-3 transition-all duration-300 hover:scale-110"
            onClick={onClose}
          >
            <IoMdClose className="h-6 w-6 text-[#747474]" />
          </div>
        </div>
        <div>
          <div className="px-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {step > 0 ? `Paso ${step} de ${TOTAL_STEPS}` : ''}
            </h2>{' '}
            {step > 0 && (
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex min-h-[380px] flex-grow p-4">
            {renderStepContent()}
          </div>
          <div className="flex items-center justify-between gap-8 border-t p-4">
            {step > 0 ? (
              <Button
                type="button"
                className={cn(
                  'w-full rounded-xl border bg-white py-7 text-lg font-medium text-gray-500 transition-all duration-300 hover:bg-gray-50',
                )}
                onClick={handleBack}
                disabled={isLoading}
              >
                Anterior
              </Button>
            ) : null}

            {step < TOTAL_STEPS && (
              <Button
                disabled={isNextDisabled()}
                className={cn(
                  'w-full rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium transition-all duration-300 hover:bg-[#de2c7c]/80',
                )}
                onClick={handleNext}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {step === 0 ? 'Comenzar Verificación' : 'Siguiente'}
                </span>
              </Button>
            )}

            {step === 3 && (
              <Button
                onClick={handleNext}
                disabled={isNextDisabled()}
                className={cn(
                  'w-full rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] py-7 text-lg font-medium transition-all duration-300 hover:bg-[#de2c7c]/80',
                )}
              >
                {isLoading ? (
                  <div className="text-md flex items-center justify-center font-latosans">
                    Enviando
                    {[1, 2, 3].map((index) => {
                      return (
                        <motion.span
                          key={index}
                          animate={{ opacity: [0, 1, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          .
                        </motion.span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Enviar
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalUploadKyc;
