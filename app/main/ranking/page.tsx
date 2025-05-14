'use client';

import { TabNavigation } from '@/app/components/UI/StyledTabs';
import React, { useCallback, useState } from 'react';

const RankingScreen = () => {
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

  return (
    <div>
      <TabNavigation
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        items={itemsTabs}
      />
    </div>
  );
};

export default RankingScreen;
