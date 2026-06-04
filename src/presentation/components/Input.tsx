import React, { useId } from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col w-full gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <div className="relative w-full flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
            {leftIcon}
          </div>
        )}
        <ShadcnInput
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 h-10 rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm transition-colors duration-200 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20 dark:border-red-500 dark:focus-visible:border-red-500',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
      ) : helperText ? (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{helperText}</span>
      ) : null}
    </div>
  );
};
