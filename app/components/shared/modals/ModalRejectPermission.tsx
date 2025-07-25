import React from 'react';
import StyledModal from '../../UI/StyledModal';
import { cn } from '@/lib/utils';
import { IoMdClose } from 'react-icons/io';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import { useTranslation } from '@/app/hooks/useTranslation';

const DeniedIcon = () => (
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

const ModalRejectPermission = () => {
  const { t } = useTranslation();
  const { state, closeMediaPermissionsDeniedModal } = useAgoraContext();

  return (
    <StyledModal
      isOpen={state.showMediaPermissionsDeniedModal}
      onClose={() => {}}
      title=""
      position="center"
      noClose
      noPadding
      width="600px"
    >
      <div
        className={cn(
          'relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-xl',
        )}
      >
        <div
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full border p-3 transition-all duration-300 hover:scale-110"
          onClick={closeMediaPermissionsDeniedModal}
        >
          <IoMdClose className="h-6 w-6 text-[#747474]" />
        </div>

        <div className="flex flex-col items-center p-8 text-center">
          <div className="mb-6">
            <DeniedIcon />
          </div>

          <h2 className="mb-3 text-2xl font-bold text-gray-800">
            {t('modal.permissionDenied.title')}
          </h2>

          <p className="mb-6 max-w-md text-base text-gray-600">
            {t('modal.permissionDenied.description')}
          </p>

          <div className="mb-6 flex w-full flex-col gap-4 rounded-lg bg-gray-100 p-4 text-left">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              {t('modal.permissionDenied.solutionsTitle')}:
            </p>
            <ol className="list-inside list-disc space-y-3 text-sm text-gray-600">
              <li>
                {t('modal.permissionDenied.solution1')}
              </li>
              <li>
                {t('modal.permissionDenied.solution2')}
              </li>
              <li>
                {t('modal.permissionDenied.solution3')}
              </li>
            </ol>
          </div>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalRejectPermission;
