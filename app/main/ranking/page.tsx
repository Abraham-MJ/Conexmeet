'use client';

import { TabNavigation } from '@/app/components/UI/StyledTabs';
import { useRanking } from '@/app/hooks/api/useRanking';
import React, { useCallback, useEffect, useState } from 'react';
import RankingPage from './sections/ranking-page';
import ReferralPage from './sections/referral-page';
import GiftPage from './sections/gift-page';
import { useMyGiftsData } from '@/app/hooks/api/useMyGifts';
import { useReferral } from '@/app/hooks/api/useReferral';
import ContainerGlobal from '@/app/components/shared/global/ContainerGlobal';

const RankingScreen = () => {
  const {
    data: rankingData,
    loading: isLoadingRanking,
    fetchRanking,
  } = useRanking();

  const {
    gifts: giftData,
    isLoading: isLoadingGift,
    fetchMyGifts,
  } = useMyGiftsData();

  const {
    referrals: referralsData,
    isLoading: isLoadingReferral,
    fetchMyReferrals,
  } = useReferral();

  const [activeTab, setActiveTab] = useState<
    'stories' | 'online' | 'contacts' | 'Ranking' | 'Referrals' | 'Gifts'
  >('Ranking');
  const itemsTabs: ('Ranking' | 'Referrals' | 'Gifts')[] = [
    'Ranking',
    'Referrals',
    'Gifts',
  ];

  const handleTabChange = useCallback(
    (
      tab:
        | 'stories'
        | 'online'
        | 'contacts'
        | 'Ranking'
        | 'Referrals'
        | 'Gifts',
    ) => {
      setActiveTab(tab);
    },
    [],
  );

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  useEffect(() => {
    fetchMyGifts();
  }, [fetchMyGifts]);

  useEffect(() => {
    fetchMyReferrals();
  }, [fetchMyReferrals]);

  return (
    <ContainerGlobal classNames="max-w-[1536px] px-4 mx-auto">
      <TabNavigation
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        items={itemsTabs}
      />
      <div className="mt-6  pb-12 md:px-0">
        {activeTab === 'Ranking' && (
          <RankingPage
            data={
              rankingData
                ? rankingData.sort((a, b) => b.minutes - a.minutes).slice(0, 10)
                : null
            }
            isLoading={isLoadingRanking}
          />
        )}

        {activeTab === 'Referrals' && (
          <ReferralPage data={referralsData} isLoading={isLoadingReferral} />
        )}

        {activeTab === 'Gifts' && (
          <GiftPage data={giftData} isLoading={isLoadingGift} />
        )}
      </div>
    </ContainerGlobal>
  );
};

export default RankingScreen;
