'use client';

import { useState, useEffect, useCallback } from 'react';
import useApi from '../useAPi';
import { ContactData } from '@/app/types/my-contacts';
import { HistoryData } from '@/app/types/histories';
import { UserInformation as FemaleWithStatus } from '@/app/types/streams';
import { useAgoraContext } from '@/app/context/useAgoraContext';

type TabName =
  | 'stories'
  | 'online'
  | 'contacts'
  | 'Ranking'
  | 'Referrals'
  | 'Gifts';

export interface UseFeaturesDataReturn {
  activeTab: TabName;
  activeVideoUrl: string | null;
  onSetPlayingVideoUrl: (url: string | null) => void;
  handleTabChange: (tab: TabName) => void;
  stories: {
    data: HistoryData[] | null;
    loading: boolean;
    error: Error | null;
    fetch: () => void;
  };
  online: {
    data: FemaleWithStatus[] | null;
    loading: boolean;
    error: string | null;
    fetch: () => void;
  };
  contacts: {
    data: ContactData[] | null;
    loading: boolean;
    error: Error | null;
    fetch: () => void;
  };
}

const useFeatures = ({
  activeTabs,
}: {
  activeTabs: 'online' | 'stories' | 'contacts';
}): UseFeaturesDataReturn => {
  const [activeTab, setActiveTab] = useState<TabName>(activeTabs ?? 'online');
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const { state: agoraState } = useAgoraContext();

  const {
    data: storiesData,
    loading: storiesLoading,
    error: storiesError,
    execute: fetchStories,
  } = useApi<HistoryData[]>('/api/histories', {}, false);

  const {
    data: contactsData,
    loading: contactsLoading,
    error: contactsError,
    execute: fetchContacts,
  } = useApi<ContactData[]>('/api/auth/my-contacts', {}, false);

  const handleTabChange = useCallback((tab: TabName) => {
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    if (activeTab === 'stories') {
      if (!storiesData && !storiesLoading) fetchStories();
    } else if (activeTab === 'contacts') {
      if (!contactsData && !contactsLoading) fetchContacts();
    }
  }, [
    activeTab,
    storiesData,
    storiesLoading,
    fetchStories,
    contactsData,
    contactsLoading,
    fetchContacts,
  ]);

  const onSetPlayingVideoUrl = useCallback((url: string | null) => {
    setActiveVideoUrl(url);
  }, []);

  return {
    activeTab,
    handleTabChange,
    activeVideoUrl,
    onSetPlayingVideoUrl,
    stories: {
      data: storiesData,
      loading: storiesLoading,
      error: storiesError,
      fetch: fetchStories,
    },
    online: {
      data: agoraState.onlineFemalesList as FemaleWithStatus[] | null,
      loading: agoraState.isLoadingOnlineFemales,
      error: agoraState.onlineFemalesError,
      fetch: () => {},
    },
    contacts: {
      data: contactsData,
      loading: contactsLoading,
      error: contactsError,
      fetch: fetchContacts,
    },
  };
};

export default useFeatures;
