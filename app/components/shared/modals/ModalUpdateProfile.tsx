import React from 'react';
import StyledModal from '../../UI/StyledModal';
import { IoMdClose } from 'react-icons/io';
import { Camera } from 'lucide-react';
import StyledInputs from '../../UI/StyledInputs';
import { useUpdateProfile } from '@/app/hooks/api/useUpdateProfile';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/app/context/useClientContext';
import { useTranslation } from '../../../hooks/useTranslation';

interface UpdateProfileUser {
  user: {
    email: string;
    name: string;
    profile_photo_path?: string;
    birthdate?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const ModalUpdateProfile: React.FC<UpdateProfileUser> = ({
  isOpen,
  onClose,
  user,
}) => {
  const { t } = useTranslation();
  const { handleGetInformation } = useUser();
  const {
    credentials,
    formErrors,
    changeFormField,
    clearFormFieldError,
    photoPreview,
    handleImageChange,
    triggerImageUpload,
    fileInputRef,
    hasChanges,
    submitProfileUpdate,
    isLoading,
    apiError,
    resetFormToInitial,
  } = useUpdateProfile({ initialUser: user });

  const handleActualSubmit = async () => {
    const response = await submitProfileUpdate();

    if (response && response.success) {
      await handleGetInformation();
      onClose();
    } else if (response && !response.success) {
      console.error(
        'Error de API al actualizar (manejado por hook):',
        response.message,
      );
    } else if (!response && apiError) {
      console.error('Error del hook:', apiError.message);
    }
  };

  const handleModalClose = () => {
    resetFormToInitial();
    onClose();
  };

  return (
    <StyledModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title=""
      position="center"
      width="600px"
      noClose
      noPadding
    >
      <div
        className={
          'relative h-full w-full overflow-hidden rounded-2xl bg-white p-4'
        }
      >
        <div className="flex w-full flex-row items-center justify-between">
          <div></div>
          <div
            className="cursor-pointer rounded-full border p-3"
            onClick={handleModalClose}
          >
            <IoMdClose className="h-6 w-6 text-gray-500" />
          </div>
        </div>

        <div className="py-4">
          <div className="space-y-6">
            <div className="flex w-full flex-col items-center justify-center text-center">
              <div className="relative h-36 w-36">
                <img
                  src={photoPreview || '/path/to/default/avatar.png'}
                  alt={t('profile.photo')}
                  className="h-full w-full rounded-full border object-cover"
                />
                <button
                  onClick={triggerImageUpload}
                  type="button"
                  className="absolute -right-1 bottom-1 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] text-white transition-colors hover:bg-[#e8356a]"
                  aria-label={t('profile.changePhoto')}
                >
                  <Camera className="h-6 w-6" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="mt-8 space-y-8">
              <StyledInputs
                name="name"
                type="text"
                label={`@${t('form.username')}:`}
                value={credentials.name}
                handleChange={changeFormField}
                error={formErrors.name}
                placeholder="@username"
                onFocus={() => clearFormFieldError('name')}
              />
              <StyledInputs
                name="email"
                type="email"
                label={`${t('form.email')}:`}
                value={credentials.email}
                handleChange={changeFormField}
                error={formErrors.email}
                placeholder={t('form.email')}
                onFocus={() => clearFormFieldError('email')}
              />
              <StyledInputs
                name="password_old"
                type="password"
                label={`${t('form.currentPassword')}:`}
                value={credentials.password_old}
                handleChange={changeFormField}
                error={formErrors.password_old}
                placeholder={t('form.currentPassword')}
                onFocus={() => clearFormFieldError('password_old')}
              />
              <StyledInputs
                name="password"
                type="password"
                label={`${t('form.newPassword')}:`}
                value={credentials.password}
                handleChange={changeFormField}
                error={formErrors.password}
                placeholder={t('form.newPassword')}
                onFocus={() => clearFormFieldError('password')}
              />
              <StyledInputs
                name="password_confirmation"
                type="password"
                label={`${t('form.confirmPassword')}:`}
                value={credentials.password_confirmation}
                handleChange={changeFormField}
                error={formErrors.password_confirmation}
                placeholder={t('form.confirmPassword')}
                onFocus={() => clearFormFieldError('password_confirmation')}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                className={cn(
                  'w-full rounded-xl border bg-white py-7 text-lg font-medium text-gray-500 transition-all duration-300 hover:bg-gray-50',
                )}
                disabled={isLoading}
                onClick={handleModalClose}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                className={cn(
                  'w-full rounded-xl bg-[#fc3d6b] py-7 text-lg font-medium text-white transition-all duration-300 hover:bg-[#e8356a]',
                )}
                disabled={isLoading || !hasChanges}
                onClick={handleActualSubmit}
              >
                {isLoading ? (
                  <div className="text-md flex items-center justify-center font-latosans">
                    {t('common.loading')}
                    {[1, 2, 3].map((index) => (
                      <motion.span
                        key={index}
                        animate={{ opacity: [0, 1, 1, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          delay: index * 0.2,
                        }}
                      >
                        {' '}
                        .{' '}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  t('common.save')
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </StyledModal>
  );
};

export default ModalUpdateProfile;
