import { useRegisterUser } from '@/app/hooks/api/useRegister';
import useLogin from '@/app/hooks/api/useLogin';
import { CheckCircle, XCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';

export const LoadingRegister = ({ message }: { message: string }) => (
  <div className="relative">
    <div className="h-48 w-48 animate-spin rounded-full bg-gradient-to-r from-[#41f3ff] to-[#ff16ff]/80 p-[2px]">
      <div className="h-full w-full rounded-full bg-white"></div>
    </div>
    <div className="text-md absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform select-none text-center font-latosans font-semibold text-gray-400">
      {message}
    </div>
  </div>
);

export const AlertSuccess = ({
  credentials,
  handleLogin,
}: {
  credentials: any;
  handleLogin: any;
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center">
      <CheckCircle className="mx-auto h-20 w-20 animate-bounce text-green-500" />
      <h2 className="mt-4 font-latosans text-2xl font-bold text-green-600">
        {t('auth.signUp.congrats.success')}
      </h2>
      <p className="mt-2 font-latosans text-gray-600">
        {t('auth.signUp.congrats.successMessage')}
      </p>
      {credentials.email !== '' && credentials.password !== '' && (
        <button
          onClick={handleLogin}
          className="mt-6 inline-block rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white transition duration-150 ease-in-out hover:bg-green-700"
        >
          <span className="font-latosans">{t('auth.signUp.congrats.signIn')}</span>
        </button>
      )}
      {credentials.email === '' && credentials.password === '' && (
        <button
          onClick={() => {
            redirect('/auth/sign-in');
          }}
          className="mt-6 inline-block rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white transition duration-150 ease-in-out hover:bg-green-700"
        >
          <span className="font-latosans">{t('auth.signUp.congrats.signIn')}</span>
        </button>
      )}
    </div>
  );
};

export const AlertDanger = ({
  error,
  setCurrentStep,
}: {
  error: string;
  setCurrentStep: Dispatch<SetStateAction<number>>;
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center">
      <XCircle className="mx-auto h-16 w-16 animate-bounce text-red-500" />
      <h2 className="mt-4 font-latosans text-2xl font-bold text-red-500">
        {t('auth.signUp.congrats.error')}
      </h2>
      <p className="mt-2 font-latosans text-gray-600">
        {error === 'El email ya se encuentra registrado'
          ? t('auth.signUp.congrats.errorEmailExists')
          : t('auth.signUp.congrats.errorMessage')}
      </p>
      <button
        onClick={() => {
          setCurrentStep(0);
        }}
        className="mt-6 inline-block rounded-md border border-transparent bg-red-600 px-6 py-3 text-base font-medium text-white transition duration-150 ease-in-out hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        <span className="font-latosans">{t('auth.signUp.congrats.backToStart')}</span>
      </button>
    </div>
  );
};

const SectionCongrats = ({ credentials, setCurrentStep }: any) => {
  const { isLoading, registerUser, error, success } = useRegisterUser();
  const { login } = useLogin();
  const { t } = useTranslation();

  useEffect(() => {
    registerUser({
      email: credentials.email,
      password: credentials.password,
      password_confirmation: credentials.confirm_password,
      name: credentials.name,
      gender: credentials.gender,
      terms: credentials.privacity,
      phone: credentials.number_phone,
      referral_code: credentials.referral_code || '',
      country_id: credentials.country_id,
      otp: credentials.code_otp,
      birthdate: credentials.date_of_birth,
    });
  }, []);

  const handleLogin = async () => {
    const login_result = await login(credentials.email, credentials.password);
    if (login_result.success) {
      redirect('/video-roulette');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-72 max-h-72 flex-col items-center justify-center">
        <LoadingRegister message={t('auth.signUp.congrats.loading')} />
      </div>
    );
  }

  return (
    <div className="flex h-72 max-h-72 flex-col items-center justify-center">
      {error !== null && (
        <AlertDanger error={error ?? ''} setCurrentStep={setCurrentStep} />
      )}
      {success && (
        <AlertSuccess credentials={credentials} handleLogin={handleLogin} />
      )}
    </div>
  );
};

export default SectionCongrats;
