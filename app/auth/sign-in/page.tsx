'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslation } from '@/app/hooks/useTranslation';

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
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SignInScreen() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useTranslation();

  const { login, isLoading, setIsLoading } = useLogin();
  const { credentials, errors, changeField, clearError, setFieldError } =
    useForm({
      email: '',
      password: '',
    });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && !isLoading) {
      setIsLoading(true);

      const performConexMeetLogin = async () => {
        try {
          const response = await fetch('/api/auth/google-login', {
            method: 'POST',
          });

          const data = await response.json();

          if (response.ok && data.success) {
            router.push('/main/video-roulette');
          } else {
          }
          setIsLoading(false);
        } catch (error) {
          console.error('Error llamando a /api/auth/google-login:', error);
        }
      };

      performConexMeetLogin();
    }
  }, [status, session, isLoading, router]);

  const handleRetryLogin = async () => {
    try {
      const retry_result = await login(credentials.email, credentials.password, true);
      if (retry_result.success) {
        router.push('/main/video-roulette');
      } else if (retry_result.message !== SESSION_ACTIVE) {
        setFieldError('password', retry_result.message);
      } else {
        setFieldError('password', 'Error al iniciar sesión. Intenta nuevamente.');
      }
    } catch (error) {
      setFieldError('password', 'Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

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
          setTimeout(handleRetryLogin, 1500);
          break;
        default:
          setFieldError('password', login_result.message || 'Error al iniciar sesión');
          break;
      }
    } else if (login_result.success) {
      router.push('/main/video-roulette');
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
              label={t('auth.signIn.email')}
              placeholder={t('auth.signIn.emailPlaceholder')}
              onFocus={() => clearError('email')}
            />
            <StyledInputs
              name="password"
              type="password"
              label={t('auth.signIn.password')}
              value={credentials.password}
              handleChange={changeField}
              error={errors.password}
              placeholder={t('auth.signIn.passwordPlaceholder')}
              onFocus={() => clearError('password')}
            />

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                aria-label={t('auth.signIn.submit')}
                className="h-12 w-full rounded-lg bg-[#41f3f0]/90 px-4 py-3 font-latosans font-medium text-white shadow-lg transition-all duration-200 hover:bg-[#41f3ff]/90 hover:shadow-xl hover:shadow-[#41f3ff]/20"
              >
                {isLoading ? (
                  <div className="text-md flex items-center justify-center font-latosans">
                    {t('auth.signIn.loading')}
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
                  t('auth.signIn.submit')
                )}
              </button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center gap-3 text-sm font-medium"
            >
              <StyledLink
                text={t('auth.signIn.forgotPassword')}
                href="/auth/password-recovery"
              />
              <StyledLink
                text={t('auth.signIn.noAccount')}
                href="/auth/sign-up"
              />
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
