'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMobile } from '@/app/hooks/useMobile';
import { cn } from '@/lib/utils';
import { useTranslation } from '../../hooks/useTranslation';

type ModalPosition = 'left' | 'center' | 'right';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  position?: ModalPosition;
  width?: string;
  height?: string;
  isMobile?: boolean;
  noClose?: boolean;
  noPadding?: boolean;
}

export default function StyledModal({
  isOpen,
  onClose,
  title,
  children,
  position = 'center',
  width = '400px',
  height = 'auto',
  isMobile: forceMobile,
  noClose = false,
  noPadding = false,
}: ModalProps) {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const autoDetectedMobile = useMobile();

  const isMobile = forceMobile !== undefined ? forceMobile : autoDetectedMobile;

  useEffect(() => {
    setIsMounted(true);

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isMounted) return null;

  const getAnimations = () => {
    if (isMobile) {
      return {
        initial: { y: '100%', opacity: 1 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '100%', opacity: 1 },
      };
    }

    switch (position) {
      case 'left':
        return {
          initial: { x: '-100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '-100%', opacity: 0 },
        };
      case 'right':
        return {
          initial: { x: '100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '100%', opacity: 0 },
        };
      case 'center':
      default:
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
        };
    }
  };

  const animations = getAnimations();

  const getModalStyles = () => {
    if (isMobile) {
      return {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxHeight: '90vh',
        borderTopLeftRadius: '1rem',
        borderTopRightRadius: '1rem',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      };
    }

    switch (position) {
      case 'left':
        return {
          width,
          height,
          maxHeight: '96vh',
        };
      case 'right':
        return {
          width,
          height,
          maxHeight: '96vh',
        };
      case 'center':
      default:
        return {
          width,
          height,
          maxHeight: '90vh',
          maxWidth: '90vw',
        };
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="fixed inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`z-50 flex flex-col overflow-hidden rounded-3xl ${
              isMobile
                ? 'fixed bottom-0 left-0 right-0 rounded-b-none rounded-t-2xl'
                : position === 'left'
                  ? 'fixed left-4 top-4 h-full'
                  : position === 'right'
                    ? 'fixed right-4 top-4 h-full'
                    : 'relative'
            }`}
            style={getModalStyles() as React.CSSProperties}
            initial={animations.initial}
            animate={animations.animate}
            exit={animations.exit}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              duration: isMobile ? 0.3 : undefined,
            }}
          >
            <div
              className={cn(
                'flex items-center justify-between',
                noPadding ? '' : 'p-4 pb-3',
              )}
            >
              {title !== '' && <h2 className="text-2xl font-bold">{title}</h2>}
              {!noClose && (
                <button
                  onClick={onClose}
                  className="rounded-full p-1 transition-colors hover:bg-gray-100"
                  aria-label={t('aria.close')}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div
              className={cn(
                'flex-1 overflow-auto',
                noPadding ? '' : 'px-4 pb-4',
              )}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}
