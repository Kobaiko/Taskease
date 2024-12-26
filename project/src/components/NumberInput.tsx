import React from 'react';
import { ChevronDown, ChevronUp } from "lucide-react";

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}

export function NumberInput({ value, onChange, min = 1, max = 60 }: NumberInputProps) {
  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    const currentValue = value ? parseInt(value) : 0;
    if (currentValue < max) {
      onChange((currentValue + 1).toString());
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    const currentValue = value ? parseInt(value) : 0;
    if (currentValue > min) {
      onChange((currentValue - 1).toString());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '') {
      onChange('');
      return;
    }

    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue.toString());
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className="w-full h-9 pl-3 pr-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
        placeholder="Min"
      />
      <div className="absolute right-0 inset-y-0 flex flex-col border-l border-gray-300 dark:border-gray-600">
        <button
          type="button" // Explicitly set button type to prevent form submission
          onClick={handleIncrement}
          className="flex h-1/2 w-8 items-center justify-center bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
          disabled={value === max?.toString()}
        >
          <ChevronUp size={12} strokeWidth={2} />
        </button>
        <button
          type="button" // Explicitly set button type to prevent form submission
          onClick={handleDecrement}
          className="flex h-1/2 w-8 items-center justify-center border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
          disabled={value === min?.toString()}
        >
          <ChevronDown size={12} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}