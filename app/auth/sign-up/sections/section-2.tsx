import React from 'react';

import { StyledDate } from '@/app/components/UI/StyledDate';
import StyledInputs from '@/app/components/UI/StyledInputs';
import StyledSelect from '@/app/components/UI/StyledSelect';
import { Credentials } from '@/app/types/sign-up';
import { itemVariants } from '@/app/utils/animations';
import { motion } from 'framer-motion';
import Link from 'next/link';
import StyledInputPhone from '@/app/components/UI/StyledInputPhone';
import { useCountries } from '@/app/hooks/api/useCountris';
import { useTranslation } from '@/app/hooks/useTranslation';

interface Props {
  changeField: (event: React.ChangeEvent<HTMLInputElement>) => void;
  credentials: any;
  clearError: (field: keyof Credentials) => void;
  errors: Partial<Record<keyof Credentials, string>>;
}

const SectionTwoStep: React.FC<Props> = ({
  changeField,
  credentials,
  clearError,
  errors,
}) => {
  const { countries } = useCountries();
  const { t } = useTranslation();


  return (
    <>
      <StyledDate
        name="date_of_birth"
        value={credentials.date_of_birth}
        handleChange={changeField}
        error={errors.date_of_birth}
        label={t('auth.signUp.step2.birthDate')}
        placeholder={t('auth.signUp.step2.birthDatePlaceholder')}
        onFocus={() => clearError('date_of_birth')}
      />

      <StyledInputs
        name="password"
        type="password"
        value={credentials.password}
        handleChange={changeField}
        error={errors.password}
        label={t('auth.signUp.step2.password')}
        placeholder={t('auth.signUp.step2.passwordPlaceholder')}
        onFocus={() => clearError('password')}
      />
      <StyledInputs
        name="confirm_password"
        type="password"
        value={credentials.confirm_password}
        handleChange={changeField}
        error={errors.confirm_password}
        label={t('auth.signUp.step2.confirmPassword')}
        placeholder={t('auth.signUp.step2.confirmPasswordPlaceholder')}
        onFocus={() => clearError('confirm_password')}
      />
      <StyledSelect
        name="country_id"
        value={credentials.country_id}
        handleChange={changeField}
        error={errors.country_id}
        label={t('auth.signUp.step2.country')}
        placeholder={t('auth.signUp.step2.countryPlaceholder')}
        onFocus={() => clearError('country_id')}
        itemList={countries?.map((item) => {
          return {
            id: item.id.toString(),
            label: item.name,
          };
        })}
      />
      <StyledInputPhone
        name="number_phone"
        handleChange={changeField}
        placeholder={t('auth.signUp.step2.phonePlaceholder')}
        error={errors.number_phone}
        code_value={`+${countries?.filter(
          (item) => item?.id.toString() === credentials?.country_id,
        )?.[0]?.phonecode ?? '57'
          }`}
        label={t('auth.signUp.step2.phone')}
        value={credentials.number_phone}
        onFocus={() => clearError('number_phone')}
        type="text"
      />

      <div className="mt-4 h-10">
        <motion.div
          className="flex items-center space-x-2"
          variants={itemVariants}
        >
          <input
            id="privacity"
            name="privacity"
            type="checkbox"
            checked={credentials.privacity}
            onChange={changeField}
            className={`h-4 w-4 rounded transition duration-150 ease-in-out ${errors.privacity ? 'border-red-500' : 'border-gray-500'}`}
            onFocus={() => clearError('privacity')}
          />
          <label htmlFor="privacity" className="text-sm text-gray-700">
            {t('auth.signUp.step2.privacy')}{' '}
            <Link
              href="#"
              className="text-[#3de0ff] transition duration-300 ease-in-out hover:text-[#ff00fe]"
            >
              {t('auth.signUp.step2.privacyLink')}
            </Link>
          </label>
        </motion.div>
        {errors.privacity && (
          <p className="font-latosans text-sm text-red-500">
            {errors.privacity}
          </p>
        )}
      </div>
    </>
  );
};

export default SectionTwoStep;
