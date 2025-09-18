export interface AgoraApiConfig {
  cacheTime: number;
  staleTime: number;
  retryAttempts: number;
  retryDelay: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  enableDeduplication?: boolean;
}

export interface AgoraApiConfigs {
  tokens: AgoraApiConfig;
  channelVerification: AgoraApiConfig;
  channelManagement: AgoraApiConfig;
  emergencyCleanup: AgoraApiConfig;
  femalesList: AgoraApiConfig;
  translation: AgoraApiConfig;
  gifts: AgoraApiConfig;
}

export type AgoraApiConfigType = keyof AgoraApiConfigs;
