import React from 'react';

import StyledInputs from '@/app/components/UI/StyledInputs';
import StyledSelect from '@/app/components/UI/StyledSelect';
import { Credentials } from '@/app/types/sign-up';

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
  return (
    <>
      <StyledSelect
        name="gender"
        value={credentials.gender}
        handleChange={changeField}
        error={errors.gender}
        label="Sexo:"
        placeholder="Escoge tu sexo"
        onFocus={() => clearError('gender')}
        itemList={getGender}
      />
      <StyledInputs
        name="name"
        type="text"
        value={credentials.name}
        handleChange={changeField}
        error={errors.name}
        label="Nombre:"
        placeholder="Nombre"
        onFocus={() => clearError('name')}
      />
      <StyledInputs
        name="last_name"
        type="text"
        value={credentials.last_name}
        handleChange={changeField}
        error={errors.last_name}
        label="Apellido:"
        placeholder="Apellido"
        onFocus={() => clearError('last_name')}
      />
      <StyledInputs
        name="email"
        type="text"
        value={credentials.email}
        handleChange={changeField}
        error={errors.email}
        label="Correo electrónico:"
        placeholder="Correo@ejemplo.com"
        onFocus={() => clearError('email')}
      />
      <StyledInputs
        name="user_name"
        type="text"
        value={credentials.user_name}
        handleChange={changeField}
        error={errors.user_name}
        label="Nombre de usuario:"
        placeholder="@Usuario"
        onFocus={() => clearError('user_name')}
      />
    </>
  );
};

export default SectionFirstStep;
