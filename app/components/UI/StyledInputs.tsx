import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { itemVariants } from '@/app/utils/animations';

interface StyledInputProps {
  type: string;
  label?: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  name: string;
  error?: string;
  placeholder: string;
  onFocus: () => void;
  maxLength?: number;
  disabled?: boolean;
}

const StyledInputs: React.FC<StyledInputProps> = ({
  type,
  label,
  handleChange,
  value,
  name,
  error,
  placeholder,
  onFocus,
  maxLength,
  disabled,
}) => {
  const [showPassword, setShowPassword] = useState(false);

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

      <div className="relative">
        <input
          maxLength={maxLength}
          id={name}
          disabled={disabled}
          name={name}
          type={type === 'password' && showPassword ? 'text' : type}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          autoComplete="current-password"
          onFocus={onFocus}
          className={`h-12 w-full rounded-lg border px-4 py-3 font-latosans text-gray-700 outline-none backdrop-blur-sm transition-all duration-200 ${
            disabled && 'border-gray-300 bg-gray-200/80'
          } ${
            error && !disabled
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white/50 font-latosans'
          }`}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-all hover:text-gray-600"
          >
            {showPassword ? (
              <LuEye className="h-5 w-5" />
            ) : (
              <LuEyeOff className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {error && <p className="font-latosans text-sm text-red-500">{error}</p>}
    </motion.div>
  );
};

export default StyledInputs;
