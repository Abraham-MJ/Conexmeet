'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { redirect, useParams } from 'next/navigation';
import ImageBrand from '@/public/images/conexmeet.png';
import { formVariants, itemVariants } from '@/app/utils/animations';
import StyledInputs from '@/app/components/UI/StyledInputs';
import { useForm } from '@/app/hooks/useForm';
import StyledButton from '@/app/components/UI/StyledButtom';
import StyledLink from '@/app/components/UI/StyledLink';
import { usePasswordRecovery } from '@/app/hooks/api/useRecovery';
import { useEffect } from 'react';
import { LoadingRegister } from '../../sign-up/sections/section-congrats';
import { ForgotPasswordSchema } from '@/app/utils/validations/auth';
import { AlertDanger, AlertSuccess } from '@/app/components/UI/StyledAlert';

export default function PasswordRecovery() {
  const params = useParams();

  const {
    validToken,
    isLoadingToken,
    data,
    resetPassword,
    success,
    forgotLoading,
    errorToken,
  } = usePasswordRecovery();
  const { credentials, errors, changeField, clearError, setFieldError } =
    useForm({
      password: '',
      confirm_password: '',
    });

  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  useEffect(() => {
    if (token) {
      validToken(token ?? '');
    }
  }, [token]);

  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    const result = ForgotPasswordSchema.safeParse(credentials);

    if (!result.success) {
      Object.entries(result.error.format()).forEach(([field, error]) => {
        const errorMessage = Array.isArray(error)
          ? error[0]
          : (error?._errors?.[0] ?? '');

        if (errorMessage) {
          setFieldError(field, errorMessage);
        }
      });

      return;
    }

    await resetPassword({
      token: data.token,
      email: data.email,
      password: credentials.password,
      password_confirmation: credentials.confirm_password,
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#41f3ff]/80 to-[#ff16ff]/80" />
      <div className="absolute inset-0 bg-black/40" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative mx-4 w-full max-w-md"
      >
        <div className="rounded-lg border border-white/20 bg-white/90 pb-10 pl-4 pr-4 pt-10 shadow-[0_0_40px_rgba(0,0,0,0.1)] backdrop-blur-sm">
          {isLoadingToken && !errorToken && (
            <div className="flex h-72 max-h-72 flex-col items-center justify-center">
              <LoadingRegister message="Validando datos..." />
            </div>
          )}

          {!isLoadingToken && (
            <>
              {errorToken ? (
                <AlertDanger
                  titleError="Ha ocurrido un error"
                  bodyError="El token ya se venció o fue usado anteriormente. Inténtelo nuevamente."
                  footerText="Volver al inicio"
                  onPress={() => {
                    redirect('/main/auth/password-recovery');
                  }}
                />
              ) : success ? (
                <AlertSuccess
                  title="Cambio de contraseña"
                  body="Su contraseña ha sido cambiada exitosamente"
                  footerText="Iniciar sesión"
                  onPress={() => {
                    redirect('/main/auth/sign-in');
                  }}
                />
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.5,
                      ease: 'easeOut',
                      delay: 0.2,
                    }}
                    className="flex flex-col items-center pb-4"
                  >
                    <Image
                      src={ImageBrand}
                      priority
                      alt="ConexMeet Logo"
                      className="h-auto w-56 md:drop-shadow-lg"
                    />
                  </motion.div>

                  <motion.form
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    onSubmit={handleResetPassword}
                    className="mt-8 space-y-8"
                  >
                    <StyledInputs
                      name="password"
                      type="password"
                      value={credentials.password}
                      handleChange={changeField}
                      error={errors.password}
                      label="Nueva contraseña:"
                      placeholder="Nueva contraseña"
                      onFocus={() => clearError('password')}
                    />

                    <StyledInputs
                      name="confirm_password"
                      type="password"
                      value={credentials.confirm_password}
                      handleChange={changeField}
                      error={errors.confirm_password}
                      label="Confirmar contraseña:"
                      placeholder="Confirmar contraseña"
                      onFocus={() => clearError('confirm_password')}
                    />

                    <StyledButton
                      text={'Recuperar contraseña'}
                      isLoading={forgotLoading}
                      onPress={handleResetPassword}
                      type="submit"
                      variant="primary"
                      size="lg"
                    />

                    <motion.div
                      variants={itemVariants}
                      className="flex flex-col items-center justify-center gap-3 text-sm font-medium"
                    >
                      <StyledLink
                        text="Iniciar sesión"
                        href="/main/auth/sign-in"
                      />
                    </motion.div>
                  </motion.form>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
