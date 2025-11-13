import { AgoraApiConfig, AgoraApiConfigs } from './types';

export const AGORA_API_CONFIGS: AgoraApiConfigs = {
  tokens: {
    cacheTime: 30 * 1000,
    staleTime: 15 * 1000,
    retryAttempts: 3,
    retryDelay: 1000,
    method: 'GET',
    enableDeduplication: true,
  },

  channelVerification: {
    cacheTime: 10 * 1000,
    staleTime: 5 * 1000,
    retryAttempts: 2,
    retryDelay: 800,
    method: 'GET',
    enableDeduplication: true,
  },

  channelManagement: {
    cacheTime: 5 * 1000,
    staleTime: 2 * 1000,
    retryAttempts: 2,
    retryDelay: 1000,
    method: 'POST',
    enableDeduplication: true,
  },

  emergencyCleanup: {
    cacheTime: 0,
    staleTime: 0,
    retryAttempts: 1,
    retryDelay: 500,
    method: 'POST',
    enableDeduplication: false,
  },

  femalesList: {
    cacheTime: 30 * 1000,
    staleTime: 15 * 1000,
    retryAttempts: 2,
    retryDelay: 1000,
    method: 'GET',
    enableDeduplication: true,
  },

  translation: {
    cacheTime: 0,
    staleTime: 0,
    retryAttempts: 2,
    retryDelay: 800,
    method: 'POST',
    enableDeduplication: false,
  },

  gifts: {
    cacheTime: 0,
    staleTime: 0,
    retryAttempts: 3,
    retryDelay: 1000,
    method: 'POST',
    enableDeduplication: false,
  },
};

export const getAgoraApiConfig = (
  type: keyof AgoraApiConfigs,
): AgoraApiConfig => {
  return AGORA_API_CONFIGS[type];
};

export type AgoraApiType = keyof AgoraApiConfigs;

export const AGORA_LOGGING_CONFIG = {
  enableCacheLogging: true,
  enableRetryLogging: true,
  enableDeduplicationLogging: true,
  enablePerformanceLogging: true,
} as const;
