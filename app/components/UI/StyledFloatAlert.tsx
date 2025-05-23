'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'error' | 'warning' | 'success' | 'info' | 'loading';
export type AnimationDirection = 'top' | 'bottom';

export interface AlertProps {
  variant?: AlertVariant;
  message: string;
  isOpen?: boolean;
  onClose?: () => void;
  icon?: LucideIcon;
  duration?: number;
  animationDirection?: AnimationDirection;
  className?: string;
}

const variantStyles = {
  error: 'bg-red-50 text-red-800 border-red-300',
  warning: 'bg-amber-50 text-amber-800 border-amber-300',
  success: 'bg-green-50 text-green-800 border-green-300',
  info: 'bg-blue-50 text-blue-800 border-blue-300',
  loading: 'bg-slate-50 text-slate-800 border-slate-300 shadow-xl',
};

const variantIcons = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  loading: Loader2,
};

export function StyledFloatAlert({
  variant = 'info',
  message,
  isOpen = true,
  onClose,
  icon,
  duration = 5000,
  animationDirection = 'top',
  className,
}: AlertProps) {
  const [visible, setVisible] = useState(isOpen);

  const IconComponent = icon || variantIcons[variant];
  const isLoading = variant === 'loading';

  useEffect(() => {
    setVisible(isOpen);

    let timer: NodeJS.Timeout | undefined;

    if (isOpen && duration && !isLoading) {
      timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, duration, onClose, isLoading]);

  const animations = {
    top: {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 },
    },
    bottom: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 },
    },
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(
            'fixed z-[1000] flex max-w-sm items-center rounded-lg border p-2 shadow-md',
            variantStyles[variant],
            animationDirection === 'top'
              ? 'inset-x-0 top-4 mx-auto'
              : 'inset-x-0 bottom-4 mx-auto',

            className,
          )}
          initial={animations[animationDirection].initial}
          animate={animations[animationDirection].animate}
          exit={animations[animationDirection].exit}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-4">
            <IconComponent
              className={cn(
                'h-7 w-7 flex-shrink-0',
                isLoading && 'animate-spin',
              )}
            />
            <div className="text-sm font-medium">{message}</div>
          </div>
          {!isLoading && onClose && (
            <button
              type="button"
              className="-mr-1 -mt-1 ml-3 inline-flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:ring-2 focus:ring-gray-300"
              onClick={() => {
                setVisible(false);
                onClose();
              }}
            >
              <span className="sr-only">Cerrar</span>
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
