import React, { useEffect, useState } from 'react';

import { Credentials } from '@/app/types/sign-up';
import StyledInputs from '@/app/components/UI/StyledInputs';
import { useOTP } from '@/app/hooks/api/useSignUpOpt';

interface Props {
  changeField: (event: React.ChangeEvent<HTMLInputElement>) => void;
  credentials: any;
  clearError: (field: keyof Credentials) => void;
  errors: Partial<Record<keyof Credentials, string>>;
}

const SectionThreeStep: React.FC<Props> = ({
  changeField,
  credentials,
  clearError,
  errors,
}) => {
  const { requestOTP } = useOTP();

  const [resendTimer, setResendTimer] = useState(180);

  const sendEmailVerification = async () => {
    await requestOTP(credentials.email);
  };

  const handleResendCode = () => {
    sendEmailVerification();
    setResendTimer(180);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  return (
    <>
      <p className="text-center font-latosans text-gray-500">
        Se ha enviado un código de verificación a tu correo electrónico.
      </p>

      <StyledInputs
        name="code_otp"
        type="text"
        value={credentials.code_otp}
        handleChange={changeField}
        error={errors.code_otp}
        maxLength={4}
        label="Código de verificación:"
        placeholder="Ingresa el código"
        onFocus={() => clearError('code_otp')}
      />

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleResendCode}
          disabled={resendTimer > 0}
          className={`font-latosans text-sm font-medium ${
            resendTimer > 0
              ? 'cursor-not-allowed text-gray-400'
              : 'text-[#fb1efb] hover:text-indigo-500'
          } transition duration-150 ease-in-out`}
        >
          Reenviar código
        </button>
        {resendTimer > 0 && (
          <span className="font-latosans text-sm text-gray-500">
            Reenviar en: {Math.floor(resendTimer / 60)}:
            {(resendTimer % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>
    </>
  );
};

export default SectionThreeStep;
