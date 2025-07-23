import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm } from '@/app/hooks/useForm';

interface UseUpdateProfileProps {
  initialUser: {
    email: string;
    name: string;
    profile_photo_path?: string;
    birthdate?: string;
  };
}

interface UpdateOperationResult {
  success: boolean;
  message: string;
  data?: any;
  errorDetails?: any;
  status?: number;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  details?: {
    profileUpdate?: UpdateOperationResult;
    photoUpdate?: UpdateOperationResult;
    passwordUpdate?: UpdateOperationResult;
  };
  errorDetails?: any;
  data?: any;
}

interface HookError {
  message: string;
  details?: any;
}

interface UseUpdateProfileEnhancedReturn {
  credentials: {
    name: string;
    email: string;
    password_old: string;
    password: string;
    password_confirmation: string;
  };
  formErrors: ReturnType<typeof useForm>['errors'];
  changeFormField: ReturnType<typeof useForm>['changeField'];
  clearFormFieldError: ReturnType<typeof useForm>['clearError'];
  setFormFieldError: ReturnType<typeof useForm>['setFieldError'];
  photoPreview?: string;
  selectedPhotoFile?: File | null;
  handleImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  triggerImageUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  hasChanges: boolean;
  submitProfileUpdate: () => Promise<ApiResponse | undefined>;
  isLoading: boolean;
  apiError: HookError | null;
  clearApiError: () => void;
  resetFormToInitial: () => void;
}

export function useUpdateProfile({
  initialUser,
}: UseUpdateProfileProps): UseUpdateProfileEnhancedReturn {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<HookError | null>(null);

  const {
    credentials,
    errors: formErrors,
    changeField: changeFormField,
    clearError: clearFormFieldError,
    setFieldError: setFormFieldError,
    setCredentials,
  } = useForm({
    name: initialUser.name,
    email: initialUser.email,
    password_old: '',
    password: '',
    password_confirmation: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | undefined>(
    initialUser.profile_photo_path || undefined,
  );
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(
    null,
  ) as React.RefObject<HTMLInputElement>;

  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const clearApiError = useCallback(() => {
    setApiError(null);
  }, []);

  const resetFormToInitial = useCallback(() => {
    setCredentials({
      name: initialUser.name,
      email: initialUser.email,
      password_old: '',
      password: '',
      password_confirmation: '',
    });
    setPhotoPreview(initialUser.profile_photo_path || undefined);
    setSelectedPhotoFile(null);
    setHasChanges(false);
    clearApiError();
  }, [initialUser, setCredentials, clearApiError]);

  useEffect(() => {
    resetFormToInitial();
  }, [initialUser, resetFormToInitial]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const nameChanged = credentials.name !== initialUser.name;
    const emailChanged = credentials.email !== initialUser.email;
    const photoChanged = selectedPhotoFile !== null;
    const passwordChanged =
      credentials.password_old ||
      credentials.password ||
      credentials.password_confirmation;
    setHasChanges(
      nameChanged || emailChanged || photoChanged || !!passwordChanged,
    );
  }, [credentials, selectedPhotoFile, initialUser.name, initialUser.email]);

  const submitProfileUpdate = useCallback(async (): Promise<
    ApiResponse | undefined
  > => {
    const photoFileToUpdate = selectedPhotoFile;
    const currentCredentials = { ...credentials };
    const currentInitialUser = { ...initialUser };

    const photoHasChanged = photoFileToUpdate !== null;
    const nameHasChanged = currentCredentials.name !== currentInitialUser.name;
    const emailHasChanged =
      currentCredentials.email !== currentInitialUser.email;
    const passwordHasChanged = !!(
      currentCredentials.password_old ||
      currentCredentials.password ||
      currentCredentials.password_confirmation
    );
    const dataFieldsHaveChanged = nameHasChanged || emailHasChanged;

    if (!photoHasChanged && !dataFieldsHaveChanged && !passwordHasChanged) {
      setHasChanges(false);
      return {
        success: true,
        message: 'No hay cambios para actualizar.',
      };
    }

    setIsLoading(true);
    clearApiError();

    if (formErrors.name) clearFormFieldError('name');
    if (formErrors.email) clearFormFieldError('email');
    if (formErrors.password_old) clearFormFieldError('password_old');
    if (formErrors.password) clearFormFieldError('password');
    if (formErrors.password_confirmation)
      clearFormFieldError('password_confirmation');

    let photoUpdateOutcome: UpdateOperationResult | undefined = undefined;
    let dataUpdateOutcome: UpdateOperationResult | undefined = undefined;
    let passwordUpdateOutcome: UpdateOperationResult | undefined = undefined;
    const aggregatedMessages: string[] = [];
    let overallRequestSuccess = true;

    if (photoHasChanged && photoFileToUpdate) {
      const photoFormData = new FormData();
      photoFormData.append(
        'profile_photo',
        photoFileToUpdate,
        photoFileToUpdate.name,
      );

      try {
        const response = await fetch('/api/update-profile/update-photo', {
          method: 'POST',
          body: photoFormData,
        });
        photoUpdateOutcome = (await response.json()) as UpdateOperationResult;

        if (!response.ok || !photoUpdateOutcome.success) {
          overallRequestSuccess = false;
          aggregatedMessages.push(
            photoUpdateOutcome.message ||
              `Error al actualizar foto (status ${response.status})`,
          );
        } else {
          aggregatedMessages.push(
            photoUpdateOutcome.message ||
              'Foto de perfil actualizada correctamente.',
          );
        }
      } catch (e: any) {
        overallRequestSuccess = false;
        const photoErrorMessage =
          e.message || 'Error de red al actualizar la foto.';
        aggregatedMessages.push(photoErrorMessage);
        photoUpdateOutcome = {
          success: false,
          message: photoErrorMessage,
          status: 500,
          errorDetails: e,
        };
      }
    }

    if (dataFieldsHaveChanged) {
      if (overallRequestSuccess || !photoHasChanged) {
        const dataFormData = new FormData();
        dataFormData.append('name', currentCredentials.name);
        dataFormData.append('email', currentCredentials.email);

        if (currentInitialUser.birthdate) {
          dataFormData.append('birthdate', currentInitialUser.birthdate);
        }

        try {
          const response = await fetch('/api/update-profile/update-user', {
            method: 'POST',
            body: dataFormData,
          });
          dataUpdateOutcome = (await response.json()) as UpdateOperationResult;

          if (!response.ok || !dataUpdateOutcome.success) {
            overallRequestSuccess = false;
            aggregatedMessages.push(
              dataUpdateOutcome.message ||
                `Error al actualizar datos del perfil (status ${response.status})`,
            );
            if (
              dataUpdateOutcome.errorDetails &&
              typeof dataUpdateOutcome.errorDetails === 'object'
            ) {
              const errorDetailsContent = dataUpdateOutcome.errorDetails as any;
              for (const key in errorDetailsContent) {
                if (
                  (key === 'name' || key === 'email') &&
                  Array.isArray(errorDetailsContent[key])
                ) {
                  setFormFieldError(
                    key as 'name' | 'email',
                    errorDetailsContent[key][0],
                  );
                }
              }
            }
          } else {
            aggregatedMessages.push(
              dataUpdateOutcome.message ||
                'Datos del perfil actualizados correctamente.',
            );
          }
        } catch (e: any) {
          overallRequestSuccess = false;
          const dataErrorMessage =
            e.message || 'Error de red al actualizar los datos del perfil.';
          aggregatedMessages.push(dataErrorMessage);
          dataUpdateOutcome = {
            success: false,
            message: dataErrorMessage,
            status: 500,
            errorDetails: e,
          };
        }
      } else {
        const skippedMessage =
          'Actualización de datos del perfil omitida debido a un error previo con la foto.';
        aggregatedMessages.push(skippedMessage);
        dataUpdateOutcome = {
          success: false,
          message: skippedMessage,
          status: 400,
        };
      }
    }

    if (passwordHasChanged) {
      if (
        overallRequestSuccess ||
        (!photoHasChanged && !dataFieldsHaveChanged)
      ) {
        const passwordFormData = new FormData();
        passwordFormData.append(
          'password_old',
          currentCredentials.password_old,
        );
        passwordFormData.append('password', currentCredentials.password);
        passwordFormData.append(
          'password_confirmation',
          currentCredentials.password_confirmation,
        );

        try {
          const response = await fetch('/api/update-profile/update-password', {
            method: 'POST',
            body: passwordFormData,
          });
          passwordUpdateOutcome =
            (await response.json()) as UpdateOperationResult;

          if (!response.ok || !passwordUpdateOutcome.success) {
            overallRequestSuccess = false;
            aggregatedMessages.push(
              passwordUpdateOutcome.message ||
                `Error al actualizar contraseña (status ${response.status})`,
            );
            if (
              passwordUpdateOutcome.errorDetails &&
              typeof passwordUpdateOutcome.errorDetails === 'object'
            ) {
              const errorDetailsContent =
                passwordUpdateOutcome.errorDetails as any;
              for (const key in errorDetailsContent) {
                if (
                  (key === 'password_old' ||
                    key === 'password' ||
                    key === 'password_confirmation') &&
                  Array.isArray(errorDetailsContent[key])
                ) {
                  setFormFieldError(
                    key as
                      | 'password_old'
                      | 'password'
                      | 'password_confirmation',
                    errorDetailsContent[key][0],
                  );
                }
              }
            }
          } else {
            aggregatedMessages.push(
              passwordUpdateOutcome.message ||
                'Contraseña actualizada correctamente.',
            );
          }
        } catch (e: any) {
          overallRequestSuccess = false;
          const passwordErrorMessage =
            e.message || 'Error de red al actualizar la contraseña.';
          aggregatedMessages.push(passwordErrorMessage);
          passwordUpdateOutcome = {
            success: false,
            message: passwordErrorMessage,
            status: 500,
            errorDetails: e,
          };
        }
      } else {
        const skippedMessage =
          'Actualización de contraseña omitida debido a errores previos.';
        aggregatedMessages.push(skippedMessage);
        passwordUpdateOutcome = {
          success: false,
          message: skippedMessage,
          status: 400,
        };
      }
    }

    setIsLoading(false);
    const finalCombinedMessage = aggregatedMessages.join(' ').trim();

    if (!overallRequestSuccess) {
      setApiError({
        message:
          finalCombinedMessage ||
          'Ocurrieron uno o más errores durante la actualización.',
        details: {
          photoUpdate: photoUpdateOutcome,
          profileUpdate: dataUpdateOutcome,
        },
      });
    } else {
      if (photoHasChanged) {
        setSelectedPhotoFile(null);
      }
      if (dataFieldsHaveChanged) {
        setCredentials({
          name: currentCredentials.name,
          email: currentCredentials.email,
          password_old: '',
          password: '',
          password_confirmation: '',
        });
      } else if (passwordHasChanged) {
        setCredentials({
          name: currentCredentials.name,
          email: currentCredentials.email,
          password_old: '',
          password: '',
          password_confirmation: '',
        });
      }
      setHasChanges(false);
    }

    const finalResponse: ApiResponse = {
      success: overallRequestSuccess,
      message:
        finalCombinedMessage ||
        (overallRequestSuccess
          ? 'Actualización completada exitosamente.'
          : 'Ocurrieron errores.'),
      details: {
        photoUpdate: photoUpdateOutcome,
        profileUpdate: dataUpdateOutcome,
        passwordUpdate: passwordUpdateOutcome,
      },
    };
    return finalResponse;
  }, [
    selectedPhotoFile,
    credentials,
    initialUser,
    clearApiError,
    setCredentials,
    formErrors,
    clearFormFieldError,
    setFormFieldError,
  ]);

  return {
    credentials,
    formErrors,
    changeFormField,
    clearFormFieldError,
    setFormFieldError,
    photoPreview,
    selectedPhotoFile,
    handleImageChange,
    triggerImageUpload,
    fileInputRef,
    hasChanges,
    submitProfileUpdate,
    isLoading,
    apiError,
    clearApiError,
    resetFormToInitial,
  };
}
