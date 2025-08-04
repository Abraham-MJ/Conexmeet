'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ModalFemaleDisconnectedProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  femaleName?: string;
  disconnectionReason?: 'refresh' | 'connection_lost' | 'unknown';
}

const ModalFemaleDisconnected: React.FC<ModalFemaleDisconnectedProps> = ({
  isOpen,
  onClose,
  onRetry,
  femaleName = 'La modelo',
  disconnectionReason = 'unknown',
}) => {
  const { t } = useTranslation();

  const getDisconnectionMessage = () => {
    switch (disconnectionReason) {
      case 'refresh':
        return {
          title: 'Modelo actualizó su página',
          message: `${femaleName} refrescó su navegador. La conexión se perdió temporalmente.`,
          icon: <RefreshCw className="h-12 w-12 text-orange-500" />,
          color: 'orange',
        };
      case 'connection_lost':
        return {
          title: 'Conexión perdida',
          message: `Se perdió la conexión con ${femaleName}. Esto puede deberse a problemas de internet.`,
          icon: <WifiOff className="h-12 w-12 text-red-500" />,
          color: 'red',
        };
      default:
        return {
          title: 'Modelo desconectada',
          message: `${femaleName} se desconectó inesperadamente de la videollamada.`,
          icon: <Wifi className="h-12 w-12 text-gray-500" />,
          color: 'gray',
        };
    }
  };

  const disconnectionInfo = getDisconnectionMessage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icono de estado */}
            <div className="mb-4 flex justify-center">
              <div className={`rounded-full bg-${disconnectionInfo.color}-100 p-4`}>
                {disconnectionInfo.icon}
              </div>
            </div>

            {/* Título */}
            <h2 className="mb-3 text-center text-xl font-bold text-gray-900">
              {disconnectionInfo.title}
            </h2>

            {/* Mensaje */}
            <p className="mb-6 text-center text-gray-600 leading-relaxed">
              {disconnectionInfo.message}
            </p>

            {/* Información adicional */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Estado:</span>
                <span className="font-medium text-red-600">Desconectada</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                <span>Razón:</span>
                <span className="font-medium">
                  {disconnectionReason === 'refresh' && 'Página refrescada'}
                  {disconnectionReason === 'connection_lost' && 'Conexión perdida'}
                  {disconnectionReason === 'unknown' && 'Desconocida'}
                </span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button
                onClick={onRetry}
                className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Buscar otra modelo
              </Button>
              
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </Button>
            </div>

            {/* Consejo */}
            <div className="mt-4 rounded-lg bg-blue-50 p-3">
              <p className="text-xs text-blue-700 text-center">
                💡 <strong>Consejo:</strong> Si esto ocurre frecuentemente, verifica tu conexión a internet
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalFemaleDisconnected;