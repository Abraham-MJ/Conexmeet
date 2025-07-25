'use client';

import React from 'react';
import StyledModal from '../../UI/StyledModal';
import { cn } from '@/lib/utils';
import { Camera, Mic } from 'lucide-react';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { useTranslation } from '../../../hooks/useTranslation';

const ModalPermission = () => {
  const { t } = useTranslation();
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
            {t('modal.permission.title')}
          </h2>

          <p className="mb-6 text-gray-600">
            {t('modal.permission.description')}
          </p>

          <div className="mb-6 w-full">
            <div className="mb-3 flex items-center gap-4 rounded-lg bg-gray-100 p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#000]/15">
                <Camera size={24} className="text-[#000]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">
                  {t('modal.permission.cameraAccess')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('modal.permission.cameraDescription')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-gray-100 p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#000]/15">
                <Mic size={24} className="text-[#000]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">
                  {t('modal.permission.micAccess')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('modal.permission.micDescription')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 w-full rounded-lg bg-gray-50 p-4">
            <p className="text-sm italic text-gray-600">
              {t('modal.permission.note')}
            </p>
          </div>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalPermission;
