import { itemVariants } from '@/app/utils/animations';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const StyledButton = ({
  text,
  isLoading,
  onPress,
  variant = 'default',
  type = 'button',
  size = 'default',
}: {
  text: string;
  isLoading: boolean;
  onPress: (...arg: any) => void;
  variant?:
    | 'default'
    | 'primary'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  type?: 'button' | 'submit' | 'reset';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}) => {
  const { t } = useTranslation();
  return (
    <motion.div variants={itemVariants}>
      <Button
        variant={variant}
        type={type}
        size={size}
        onClick={onPress}
        disabled={isLoading}
      >
        <span>{isLoading ? t('common.loading') : text}</span>
      </Button>
    </motion.div>
  );
};

export default StyledButton;
