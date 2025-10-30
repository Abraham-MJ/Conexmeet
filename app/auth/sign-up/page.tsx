'use client';
import { useState } from 'react';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslation } from '@/app/hooks/useTranslation';

import { useForm } from '@/app/hooks/useForm';
import SectionTwoStep from './sections/section-2';
import SectionFirstStep from './sections/section-1';
import SectionThreeStep from './sections/section-3';
import { useOTP } from '@/app/hooks/api/useSignUpOpt';
import StyledLink from '@/app/components/UI/StyledLink';
import ImageBrand from '@/public/images/conexmeet.png';
import SectionCongrats from './sections/section-congrats';
import StyledButtom from '@/app/components/UI/StyledButtom';
import {
  StepOneSchema,
  StepTwoSchema,
  verificationSchema,
} from '@/app/utils/validations/auth';
import { formVariants, itemVariants } from '@/app/utils/animations';

export default function SignUpScreen() {
  const { verifyOTP, requestOTP } = useOTP();
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useTranslation();

  const { credentials, errors, changeField, clearError, setFieldError } =
    useForm({
      name: '',
      last_name: '',
      email: '',
      user_name: '',
      gender: '',
      country_id: '',
      password: '',
      confirm_password: '',
      number_phone: '',
      date_of_birth: '',
      privacity: false,
      code_otp: '',
    });

  const stepView = [
    <SectionFirstStep
      credentials={credentials}
      changeField={changeField}
      clearError={clearError}
      errors={errors}
    />,
    <SectionTwoStep
      credentials={credentials}
      changeField={changeField}
      clearError={clearError}
      errors={errors}
    />,
    <SectionThreeStep
      credentials={credentials}
      changeField={changeField}
      clearError={clearError}
      errors={errors}
    />,
    <SectionCongrats
      credentials={credentials}
      setCurrentStep={setCurrentStep}
    />,
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let schema;
    if (currentStep === 0) schema = StepOneSchema;
    if (currentStep === 1) schema = StepTwoSchema;
    if (currentStep === 2) schema = verificationSchema;

    if (schema) {
      const result = schema.safeParse(credentials);

      if (!result.success) {
        Object.entries(result.error.format()).forEach(([field, error]) => {
          const errorMessage = Array.isArray(error)
            ? error[0]
            : (error?._errors?.[0] ?? '');
          if (errorMessage) setFieldError(field, errorMessage);
        });
        return;
      }
    }

    if (currentStep === 1) {
      requestOTP(credentials.email);
    }

    if (currentStep !== 2 && currentStep < stepView.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const validCodeEmail = async () => {
    const response = await verifyOTP(credentials.email, credentials.code_otp);
    if (response.status !== 200) {
      setFieldError(
        'code_otp',
        t('auth.signUp.congrats.errorMessage'),
      );
      return;
    } else {
      setCurrentStep((prev) => prev + 1);
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
          {currentStep !== 3 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
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

          <motion.form
            variants={formVariants}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
            className="mt-8 space-y-8"
          >
            {stepView[currentStep]}

            <div className="flex justify-between">
              {currentStep !== 0 && currentStep !== 3 && (
                <StyledButtom
                  text={t('auth.signUp.navigation.back')}
                  isLoading={false}
                  onPress={() =>
                    setCurrentStep((prev) => Math.max(0, prev - 1))
                  }
                  type="button"
                  variant="outline"
                  size="sm"
                />
              )}
              {currentStep !== 3 && (
                <StyledButtom
                  text={currentStep === 2 ? t('auth.signUp.navigation.validateCode') : t('auth.signUp.navigation.next')}
                  isLoading={false}
                  onPress={() => {
                    if (currentStep === 2) validCodeEmail();
                  }}
                  type="submit"
                  variant="primary"
                  size="sm"
                />
              )}
            </div>
            {currentStep === 0 && (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center gap-3 text-sm font-medium"
              >
                <StyledLink
                  href="/auth/sign-in"
                  text={t('auth.signUp.hasAccount')}
                  className="flex items-center justify-center text-center text-sm"
                />
              </motion.div>
            )}
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
