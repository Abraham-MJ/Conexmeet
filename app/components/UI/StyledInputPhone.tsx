import { itemVariants } from '@/app/utils/animations';
import { motion } from 'framer-motion';
import React from 'react';

interface StyledInputProps {
  type: string;
  label?: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  name: string;
  error?: string;
  placeholder: string;
  onFocus: () => void;
  code_value: string;
}

const StyledInputPhone: React.FC<StyledInputProps> = ({
  type,
  label,
  handleChange,
  value,
  name,
  error,
  placeholder,
  onFocus,
  code_value,
}) => {
  return (
    <motion.div
      className="relative flex h-[68px] flex-col"
      variants={itemVariants}
    >
      {label && (
        <label
          htmlFor={name}
          className="mb-1 font-latosans text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="flex w-full flex-row">
        <input
          style={{ maxWidth: '20%' }}
          disabled
          value={code_value}
          placeholder={'+57'}
          className={`h-12 w-full rounded-s-lg border px-4 py-3 font-latosans text-gray-700 outline-none backdrop-blur-sm transition-all duration-200 ${
            error
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white/50 font-latosans'
          }`}
        />
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={onFocus}
          className={`h-12 w-full rounded-e-lg border px-4 py-3 font-latosans text-gray-700 outline-none backdrop-blur-sm transition-all duration-200 ${
            error
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white/50 font-latosans'
          }`}
        />
      </div>
      {error && <p className="font-latosans text-sm text-red-500">{error}</p>}
    </motion.div>
  );
};

export default StyledInputPhone;
