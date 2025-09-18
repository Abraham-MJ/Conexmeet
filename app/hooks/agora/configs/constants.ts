export const AGORA_LOG_PREFIXES = {
  TOKENS: '[AGORA_TOKENS]',
  CHANNELS: '[AGORA_CHANNELS]',
  VERIFICATION: '[AGORA_VERIFICATION]',
  MANAGEMENT: '[AGORA_MANAGEMENT]',
  CLEANUP: '[AGORA_CLEANUP]',
  FEMALES_LIST: '[AGORA_FEMALES]',
  TRANSLATION: '[AGORA_TRANSLATION]',
  GIFTS: '[AGORA_GIFTS]',
  CACHE: '[AGORA_CACHE]',
  RETRY: '[AGORA_RETRY]',
} as const;

export const AGORA_API_ENDPOINTS = {
  GET_TOKEN_RTC: '/api/agora/get-token-rtc',
  GET_TOKEN_RTM: '/api/agora/get-token-rtm',

  VERIFY_AVAILABILITY: '/api/agora/channels/verify-availability',
  CREATE_CHANNEL: '/api/agora/channels/create-channel',
  ENTER_CHANNEL_MALE: '/api/agora/channels/enter-channel-male-v2',
  CLOSE_CHANNEL: '/api/agora/channels/close-channel',
  CLOSE_CHANNEL_MALE: '/api/agora/channels/close-channel-male',
  CLEANUP_AFTER_DISCONNECT: '/api/agora/channels/cleanup-after-male-disconnect',
  EMERGENCY_CLEANUP: '/api/agora/channels/emergency-cleanup',

  HOST_LIST: '/api/agora/host',
  TRANSLATE: '/api/translate',
  SEND_GIFTS: '/api/gift/send-gifts',
} as const;

export const AGORA_ERROR_MESSAGES = {
  TOKEN_NOT_RECEIVED: 'Token no recibido en la respuesta',
  CHANNEL_NOT_AVAILABLE: 'Canal no disponible',
  CONNECTION_ERROR: 'Error de conexión',
  RATE_LIMIT_EXCEEDED: 'Límite de requests excedido',
  UNKNOWN_ERROR: 'Error desconocido',
} as const;
