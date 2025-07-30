export const logConnectionError = (
  context: string,
  error: any,
  channelId?: string,
  userId?: string
) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    channelId,
    userId,
    message: error.message || error,
    errorType: error.errorType,
    stack: error.stack,
  };

  console.group(`🔴 [Connection Error] ${context}`);
  console.log('📍 Timestamp:', timestamp);
  console.log('🏷️ Context:', context);
  if (channelId) console.log('📺 Channel ID:', channelId);
  if (userId) console.log('👤 User ID:', userId);
  console.log('💬 Message:', error.message || error);
  if (error.errorType) console.log('🏷️ Error Type:', error.errorType);
  console.log('📊 Full Error:', error);
  console.groupEnd();

  if (typeof window !== 'undefined' && (window as any).logConnectionErrors) {
    (window as any).logConnectionErrors.push(errorInfo);
  }
};

export const shouldShowChannelBusyModal = (error: any): boolean => {
  if (!error) return false;
  
  const message = (error.message || '').toLowerCase();
  const errorType = error.errorType;
  
  const busyIndicators = [
    'canal_ocupado',
    'ocupado',
    'ya está ocupado',
    'otro usuario',
    'simultánea detectada',
    'intentando conectarse',
    'channel_busy'
  ];
  
  return (
    errorType === 'CHANNEL_BUSY' ||
    busyIndicators.some(indicator => message.includes(indicator))
  );
};

export const shouldShowChannelNotAvailableModal = (error: any): boolean => {
  if (!error) return false;
  
  const message = (error.message || '').toLowerCase();
  const errorType = error.errorType;
  
  const notAvailableIndicators = [
    'canal_no_disponible',
    'no está disponible',
    'no existe',
    'channel_not_available'
  ];
  
  return (
    errorType === 'CHANNEL_NOT_AVAILABLE' ||
    notAvailableIndicators.some(indicator => message.includes(indicator))
  );
};