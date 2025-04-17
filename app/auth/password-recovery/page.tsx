'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

import { useForm } from '@/app/hooks/useForm';
import ImageBrand from '@/public/images/conexmeet.png';
import StyledLink from '@/app/components/UI/StyledLink';
import StyledInputs from '@/app/components/UI/StyledInputs';
import StyledButton from '@/app/components/UI/StyledButtom';
import { usePasswordRecovery } from '@/app/hooks/api/useRecovery';
import { recoveryEmailSchema } from '@/app/utils/validations/auth';
import { formVariants, itemVariants } from '@/app/utils/animations';

export default function RecoveryPasswordScreen() {
  const { sendEmailRecovery, sendIsLoading, successEmail } =
    usePasswordRecovery();
  const { credentials, errors, changeField, clearError, setFieldError } =
    useForm({
      email: '',
    });

  const sendEmailVerification = async (e: any) => {
    e.preventDefault();
    const result = recoveryEmailSchema.safeParse(credentials);

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

    const forgot_data = await sendEmailRecovery(credentials.email);

    if (forgot_data === undefined) {
      setFieldError('email', 'El email no existe');
    }
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
          {!successEmail && (
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
          )}

          {successEmail && (
            <CheckCircle className="mx-auto h-auto w-20 animate-bounce text-green-500" />
          )}

          <motion.p className="select-none p-2 text-center font-latosans text-gray-400">
            {!successEmail
              ? 'Ingresa tu correo electrónico para recuperar tu contraseña'
              : 'Hemos enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y spam.'}
          </motion.p>

          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="visible"
            onSubmit={sendEmailVerification}
            className="mt-8 space-y-8"
          >
            <StyledInputs
              name="email"
              type="email"
              value={credentials.email}
              handleChange={changeField}
              error={errors.email}
              label="Correo electrónico:"
              placeholder="Correo electrónico"
              onFocus={() => clearError('email')}
            />

            <StyledButton
              text={'Enviar'}
              isLoading={sendIsLoading}
              onPress={sendEmailVerification}
              type="submit"
              variant="primary"
              size="lg"
            />

            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center gap-3 text-sm font-medium"
            >
              <StyledLink text="Iniciar sesión" href="/auth/sign-in" />
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
