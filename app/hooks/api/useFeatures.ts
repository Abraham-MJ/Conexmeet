'use client';

import { useState, useEffect, useCallback } from 'react';
import useApi from '../useAPi';
import { UserData } from '@/app/types/list-user';
import { ContactData } from '@/app/types/my-contacts';
import { HistoryData } from '@/app/types/histories';

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
  setActiveVideoUrl: (url: string | null) => void;
  onSetPlayingVideoUrl: (url: string | null) => void;
  handleTabChange: (tab: TabName) => void;
  stories: {
    data: HistoryData[] | null;
    loading: boolean;
    error: Error | null;
    fetch: () => void;
  };
  online: {
    data: UserData[] | null;
    loading: boolean;
    error: Error | null;
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

  const {
    data: storiesData,
    loading: storiesLoading,
    error: storiesError,
    execute: fetchStories,
  } = useApi<HistoryData[]>('/api/histories', {}, false);

  const {
    data: onlineUsersData,
    loading: onlineUsersLoading,
    error: onlineUsersError,
    execute: fetchOnlineUsers,
  } = useApi<UserData[]>('/api/auth/get-list-female', {}, false);

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
    if (activeTab === 'stories' && !storiesData && !storiesLoading) {
      fetchStories();
    } else if (
      activeTab === 'online' &&
      !onlineUsersData &&
      !onlineUsersLoading
    ) {
      fetchOnlineUsers();
    } else if (activeTab === 'contacts' && !contactsData && !contactsLoading) {
      fetchContacts();
    }
  }, [activeTab, storiesData, onlineUsersData, contactsData]);

  useEffect(() => {
    if (activeTab === 'stories') {
      fetchStories();
    } else if (activeTab === 'online') {
      fetchOnlineUsers();
    } else if (activeTab === 'contacts') {
      fetchContacts();
    }
  }, []);

  const onSetPlayingVideoUrl = useCallback((url: string | null) => {
    setActiveVideoUrl(url);
  }, []);

  return {
    activeTab,
    handleTabChange,
    activeVideoUrl,
    setActiveVideoUrl,
    onSetPlayingVideoUrl,
    stories: {
      data: storiesData,
      loading: storiesLoading,
      error: storiesError,
      fetch: fetchStories,
    },
    online: {
      data: onlineUsersData,
      loading: onlineUsersLoading,
      error: onlineUsersError,
      fetch: fetchOnlineUsers,
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
