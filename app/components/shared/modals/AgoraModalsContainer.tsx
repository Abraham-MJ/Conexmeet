'use client';

import React from 'react';
import { useAgoraContext } from '@/app/context/useAgoraContext';
import ModalFemaleDisconnected from './ModalFemaleDisconnected';

const AgoraModalsContainer: React.FC = () => {
  const {
    showFemaleDisconnectedModal,
    femaleDisconnectedInfo,
    closeFemaleDisconnectedModal,
    handleVideoChatMale,
  } = useAgoraContext();

  const handleRetryConnection = async () => {
    closeFemaleDisconnectedModal();
    // Intentar conectar a otro canal aleatorio
    try {
      await handleVideoChatMale();
    } catch (error) {
      console.error('[Retry Connection] Error al intentar nueva conexión:', error);
    }
  };

  return (
    <>
      {/* Modal de Female Desconectada */}
      <ModalFemaleDisconnected
        isOpen={showFemaleDisconnectedModal}
        onClose={closeFemaleDisconnectedModal}
        onRetry={handleRetryConnection}
        femaleName={femaleDisconnectedInfo?.femaleName}
        disconnectionReason={femaleDisconnectedInfo?.disconnectionReason}
      />
    </>
  );
};

export default AgoraModalsContainer;