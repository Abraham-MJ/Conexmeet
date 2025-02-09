import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { itemVariants } from '@/app/utils/animations';

interface CustomLinkProps {
  href: string;
  text: string;
  className?: string;
}

const StyledLink: React.FC<CustomLinkProps> = ({
  href,
  text,
  className = '',
}) => {
  return (
    <Link
      href={href}
      className={`font-latosans text-gray-600 transition-colors duration-200 hover:text-gray-400 ${className}`}
    >
      <motion.div variants={itemVariants}>{text}</motion.div>
    </Link>
  );
};

export default StyledLink;
