'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

import { useForm } from '@/app/hooks/useForm';
import useLogin from '@/app/hooks/api/useLogin';
import ImageBrand from '@/public/images/conexmeet.png';
import StyledLink from '@/app/components/UI/StyledLink';
import StyledInputs from '@/app/components/UI/StyledInputs';
import { formVariants, itemVariants } from '@/app/utils/animations';
import StyledBottomGoogle from '@/app/components/UI/StyledBottomGoogle';
import { loginSchema } from '@/app/utils/validations/auth';
import {
  EMAIL_ERROR,
  PASSWORD_ERROR,
  SESSION_ACTIVE,
} from '@/app/environment/errors-code';
import { redirect } from 'next/navigation';

export default function SignInScreen() {
  const { login, isLoading } = useLogin();
  const { credentials, errors, changeField, clearError, setFieldError } =
    useForm({
      email: '',
      password: '',
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse(credentials);

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

    const login_result = await login(credentials.email, credentials.password);

    if (!login_result.success) {
      switch (login_result.message) {
        case EMAIL_ERROR:
          setFieldError('email', EMAIL_ERROR);
          break;
        case PASSWORD_ERROR:
          setFieldError('password', PASSWORD_ERROR);
          break;
        case SESSION_ACTIVE:
          setFieldError(
            'password',
            'Ya hay una sesión activa. Intente nuevamente',
          );
          break;
        default:
          break;
      }
    } else if (login_result.success) {
      redirect('/main/dashboard');
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

          <StyledBottomGoogle />

          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
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
            <StyledInputs
              name="password"
              type="password"
              label="Contraseña:"
              value={credentials.password}
              handleChange={changeField}
              error={errors.password}
              placeholder="Contraseña"
              onFocus={() => clearError('password')}
            />

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                aria-label="Iniciar sesión"
                className="h-12 w-full rounded-lg bg-[#41f3f0]/90 px-4 py-3 font-latosans font-medium text-white shadow-lg transition-all duration-200 hover:bg-[#41f3ff]/90 hover:shadow-xl hover:shadow-[#41f3ff]/20"
              >
                {isLoading ? (
                  <div className="text-md flex items-center justify-center font-latosans">
                    Cargando
                    {[1, 2, 3].map((index) => {
                      return (
                        <motion.span
                          key={index}
                          animate={{ opacity: [0, 1, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          .
                        </motion.span>
                      );
                    })}
                  </div>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center gap-3 text-sm font-medium"
            >
              <StyledLink text="¿Olvidaste tu contraseña?" href="" />
              <StyledLink
                text="¿No tienes cuenta?, Registrate"
                href="/main/auth/sign-up"
              />
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
