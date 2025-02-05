import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const StyledBottomGoogle = () => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
      className="mt-4 border-b border-gray-300 pb-8"
    >
      <button
        onClick={() => {}}
        className="flex h-12 w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50"
      >
        <Image
          src="/images/google-icon.webp"
          alt="ConexMeet Logo"
          width={40}
          height={40}
        />
        <span className="font-latosans text-md">Iniciar sesión con Google</span>
      </button>
    </motion.div>
  );
};

export default StyledBottomGoogle;
