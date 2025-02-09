import { itemVariants } from '@/app/utils/animations';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import React from 'react';

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
  onPress: () => void;
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
  return (
    <motion.div variants={itemVariants}>
      <Button
        variant={variant}
        type={type}
        size={size}
        onClick={onPress}
        disabled={isLoading}
      >
        <span>{isLoading ? 'Cargando...' : text}</span>
      </Button>
    </motion.div>
  );
};

export default StyledButton;
