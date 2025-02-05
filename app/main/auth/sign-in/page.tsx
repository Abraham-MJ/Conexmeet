'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

import { useForm } from '@/app/hooks/useForm';
import ImageBrand from '@/public/images/conexmeet.png';
import StyledLink from '@/app/components/UI/StyledLink';
import StyledInputs from '@/app/components/UI/StyledInputs';
import { formVariants, itemVariants } from '@/app/utils/animations';
import StyledBottomGoogle from '@/app/components/UI/StyledBottomGoogle';

export default function SignInScreen() {
  const { credentials, errors, changeField, clearError, setFieldError } =
    useForm({
      email: '',
      password: '',
    });

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
              alt="ConexMeet Logo"
              className="h-auto w-56 md:drop-shadow-lg"
            />
          </motion.div>

          <StyledBottomGoogle />

          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="visible"
            onSubmit={() => {}}
            className="mt-8 space-y-6"
          >
            <StyledInputs
              name="email"
              type="email"
              value={credentials.email}
              handleChange={changeField}
              error={errors.email}
              placeholder="Correo electrónico"
              onFocus={() => clearError('email')}
            />
            <StyledInputs
              name="password"
              type="password"
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
                className="font-latosans w-full rounded-lg bg-[#41f3f0]/90 px-4 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-[#41f3ff]/90 hover:shadow-xl hover:shadow-[#41f3ff]/20"
              >
                Iniciar sesión
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
