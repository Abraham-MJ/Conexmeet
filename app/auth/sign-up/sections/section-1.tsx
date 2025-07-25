import React from 'react';

import StyledInputs from '@/app/components/UI/StyledInputs';
import StyledSelect from '@/app/components/UI/StyledSelect';
import { Credentials } from '@/app/types/sign-up';
import { useTranslation } from '@/app/hooks/useTranslation';

export const getGender = [
  { id: 'male', label: 'Masculino' },
  { id: 'female', label: 'Femenino' },
];

interface Props {
  changeField: (event: React.ChangeEvent<HTMLInputElement>) => void;
  credentials: any;
  clearError: (field: keyof Credentials) => void;
  errors: Partial<Record<keyof Credentials, string>>;
}

const SectionFirstStep: React.FC<Props> = ({
  changeField,
  credentials,
  clearError,
  errors,
}) => {
  const { t } = useTranslation();
  
  const getGenderTranslated = [
    { id: 'male', label: t('auth.signUp.step1.male') },
    { id: 'female', label: t('auth.signUp.step1.female') },
  ];

  return (
    <>
      <StyledSelect
        name="gender"
        value={credentials.gender}
        handleChange={changeField}
        error={errors.gender}
        label={t('auth.signUp.step1.gender')}
        placeholder={t('auth.signUp.step1.genderPlaceholder')}
        onFocus={() => clearError('gender')}
        itemList={getGenderTranslated}
      />
      <StyledInputs
        name="name"
        type="text"
        value={credentials.name}
        handleChange={changeField}
        error={errors.name}
        label={t('auth.signUp.step1.name')}
        placeholder={t('auth.signUp.step1.namePlaceholder')}
        onFocus={() => clearError('name')}
      />
      <StyledInputs
        name="last_name"
        type="text"
        value={credentials.last_name}
        handleChange={changeField}
        error={errors.last_name}
        label={t('auth.signUp.step1.lastName')}
        placeholder={t('auth.signUp.step1.lastNamePlaceholder')}
        onFocus={() => clearError('last_name')}
      />
      <StyledInputs
        name="email"
        type="text"
        value={credentials.email}
        handleChange={changeField}
        error={errors.email}
        label={t('auth.signUp.step1.email')}
        placeholder={t('auth.signUp.step1.emailPlaceholder')}
        onFocus={() => clearError('email')}
      />
      <StyledInputs
        name="user_name"
        type="text"
        value={credentials.user_name}
        handleChange={changeField}
        error={errors.user_name}
        label={t('auth.signUp.step1.username')}
        placeholder={t('auth.signUp.step1.usernamePlaceholder')}
        onFocus={() => clearError('user_name')}
      />
    </>
  );
};

export default SectionFirstStep;
