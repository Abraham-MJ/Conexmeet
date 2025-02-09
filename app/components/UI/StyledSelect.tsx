import { itemVariants } from '@/app/utils/animations';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import React from 'react';

const StyledSelect = ({
  name,
  value,
  handleChange,
  error,
  label,
  placeholder,
  onFocus,
  itemList,
}: {
  name: string;
  value: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  label?: string;
  placeholder: string;
  onFocus: () => void;
  itemList: { id: string; label: string }[];
}) => {
  const handleSelectChange = (
    name: string,
    changeField: (e: React.ChangeEvent<HTMLInputElement>) => void,
  ) => {
    return (value: string) => {
      const event = {
        target: { name, value },
      } as React.ChangeEvent<HTMLInputElement>;
      changeField(event);
    };
  };

  return (
    <motion.div
      className="relative flex h-[68px] flex-col"
      variants={itemVariants}
    >
      {label && (
        <label
          htmlFor={'label'}
          className="mb-1 font-latosans text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <Select
        name={name}
        defaultValue={value}
        onValueChange={(value: string) =>
          handleSelectChange(name, handleChange)(value)
        }
      >
        <SelectTrigger
          onFocus={onFocus}
          className={`h-12 w-full rounded-lg border px-4 py-4 font-latosans font-medium text-gray-700 shadow-none outline-none backdrop-blur-sm transition-all duration-200 ${
            error
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white/50 font-latosans'
          }`}
        >
          <SelectValue
            placeholder={placeholder}
            className="font-latosans font-medium"
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {itemList?.map(({ id, label }) => {
              return (
                <SelectItem
                  key={id}
                  value={id}
                  className="font-latosans font-medium"
                >
                  {label}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <p className="font-latosans text-sm text-red-500">{error}</p>}
    </motion.div>
  );
};

export default StyledSelect;
