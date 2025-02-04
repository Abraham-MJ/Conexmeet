'use client';

import React, { useState } from 'react';
import Image from 'next/image';

import { motion } from 'framer-motion';

import ImageBrand from '@/public/images/conexmeet.png';
import ImageGoogle from '@/public/images/google-icon.webp';
import Link from 'next/link';
import { LuEye, LuEyeOff } from 'react-icons/lu';

export const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export default function SignInScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const changeField = (e: any) => {
    const { target } = e;
    const { name, value } = target;

    setCredentials({ ...credentials, [name]: value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            className="mb-12 flex flex-col items-center"
          >
            <Image
              src={ImageBrand}
              alt="ConexMeet Logo"
              className="h-auto w-56 md:drop-shadow-lg"
            />
          </motion.div>

          {/* <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              ease: 'easeOut',
              delay: 0.2,
            }}
          >
            <button
              onClick={() => {}}
              className="flex h-12 w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50"
            >
              <Image
                src={ImageGoogle}
                alt="ConexMeet Logo"
                className="h-10 w-10"
              />
              <span className="font-latosans text-md">
                Iniciar sesión con Google
              </span>
            </button>
          </motion.div> */}

          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="visible"
            onSubmit={() => {}}
            className="mt-8 space-y-6"
          >
            {/* <motion.div variants={itemVariants}>
              <input
                type="email"
                placeholder="Correo electrónico"
                defaultValue={credentials.email}
                onChange={changeField}
                required
                className="border-1 h-12 w-full rounded-lg border-white/90 bg-white/50 px-4 py-3 text-gray-700 outline-none backdrop-blur-sm transition-all duration-200"
              />
            </motion.div>
            <motion.div variants={itemVariants} className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                defaultValue={credentials.password}
                onChange={changeField}
                required
                className="border-1 h-12 w-full rounded-lg px-4 py-3 text-gray-700 outline-none backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <LuEye className="h-5 w-5" />
                ) : (
                  <LuEyeOff className="h-5 w-5" />
                )}
              </button>
            </motion.div> */}

            {/* <motion.div variants={itemVariants}>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#41f3ff]/80 px-4 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-[#41f3ff]/90 hover:shadow-xl hover:shadow-[#41f3ff]/20"
              >
                Iniciar sesión
              </button>
            </motion.div> */}

            {/* <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center gap-3 text-sm font-medium"
            >
              <Link
                href="/forgot-password"
                className="text-gray-600 transition-colors duration-200 hover:text-gray-400"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <Link
                href="/main/auth/sign-up"
                className="text-gray-600 transition-colors duration-200 hover:text-gray-400"
              >
                ¿No tienes cuenta?, Registrate
              </Link>
            </motion.div> */}
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
