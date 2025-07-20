import { useState } from 'react';

interface Errors {
  [key: string]: any;
}

export const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [credentials, setCredentials] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors>({});

  const changeField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setCredentials((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const setFieldError = (field: string, errorMessage: string) => {
    setErrors((prev) => ({ ...prev, [field]: errorMessage }));
  };

  return {
    credentials,
    setCredentials,
    errors,
    setErrors,
    changeField,
    clearError,
    setFieldError,
  };
};
