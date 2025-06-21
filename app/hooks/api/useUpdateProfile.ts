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
  };
  errorDetails?: any;
  data?: any;
}

interface HookError {
  message: string;
  details?: any;
}

interface UseUpdateProfileEnhancedReturn {
  credentials: { name: string; email: string };
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
    setCredentials({ name: initialUser.name, email: initialUser.email });
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
    setHasChanges(nameChanged || emailChanged || photoChanged);
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
    const dataFieldsHaveChanged = nameHasChanged || emailHasChanged;

    if (!photoHasChanged && !dataFieldsHaveChanged) {
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

    let photoUpdateOutcome: UpdateOperationResult | undefined = undefined;
    let dataUpdateOutcome: UpdateOperationResult | undefined = undefined;
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
    credentials: credentials as { name: string; email: string },
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
