'use client';

import ContainerGlobal from '@/app/components/shared/global/ContainerGlobal';
import ModalUpdateProfile from '@/app/components/shared/modals/ModalUpdateProfile';
import { useUser } from '@/app/context/useClientContext';
import { useMobile } from '@/app/hooks/useMobile';
import { cn } from '@/lib/utils';
import { AtSign, Check, Copy, Edit3, Link, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

const ProfileScreen = () => {
  const { t } = useTranslation();
  const isMobile = useMobile(920);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  const { state: user } = useUser();

  const copyToClipboard = async (link_referral: string) => {
    try {
      await navigator.clipboard.writeText(link_referral);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <ContainerGlobal classNames={cn('w-full h-full')}>
      <div
        className={cn(
          'overflow-hidden bg-white md:rounded-3xl md:shadow-xl',
          isMobile ? '' : 'mx-auto mt-8 w-[700px]',
        )}
      >
        <div className="relative h-32 bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] md:h-32">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="relative px-4 pb-8">
          <div className="-mt-16 mb-6 flex justify-center">
            <div className="relative">
              <img
                src={user.user.profile_photo_path}
                alt={t('profile.photo')}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
              />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="mb-1 text-2xl font-bold text-gray-900">
              {user.user.legal_denomintation}
            </h1>
            <div className="mb-4 flex items-center justify-center space-x-2">
              <p className="font-medium text-[#fc3d6b]">@{user.user.name}</p>
              <button
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(true);
                }}
              >
                <Edit3 className="h-6 w-6 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="mb-8 space-y-4">
            <div className="flex items-center space-x-3 rounded-xl bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                <Mail className="h-5 w-5 text-[#fc3d6b]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">{t('form.email')}</p>
                <p className="font-medium text-gray-900">{user.user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-xl bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                <AtSign className="h-5 w-5 text-[#fc3d6b]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">{t('form.username')}</p>
                <p className="font-medium text-gray-900">@{user.user.name}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="mb-3 flex items-center space-x-2">
              <Link className="h-5 w-5 text-[#fc3d6b]" />
              <h3 className="text-lg font-semibold text-gray-900">
                {t('profile.referralLink')}
              </h3>
            </div>

            <div className="rounded-xl border border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50 p-4">
              <p className="mb-3 text-sm text-gray-600">
                {t('profile.shareLink')}
              </p>

              <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
                <p
                  className={cn(
                    'break-all text-xs text-gray-700',
                    isMobile ? 'text-xs' : 'text-sm',
                  )}
                >
                  https://conexmeet.com/auth/sign-up/{user.user.referral_code}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    copyToClipboard(
                      `https://conexmeet.com/auth/sign-up/${user.user.referral_code}`,
                    );
                  }}
                  className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-[linear-gradient(308.52deg,#f711ba_4.3%,#ff465d_95.27%)] px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-[#e8356a]"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{t('profile.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>{t('profile.copy')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ModalUpdateProfile
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        user={user.user}
      />
    </ContainerGlobal>
  );
};

export default ProfileScreen;
