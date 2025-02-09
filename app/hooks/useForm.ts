import { useState } from 'react';

interface Errors {
  [key: string]: any;
}

interface Credentials {
  [key: string]: any;
}

export const useForm = (initialValues: Credentials) => {
  const [credentials, setCredentials] = useState<Credentials>(initialValues);
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
