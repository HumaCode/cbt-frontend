import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
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
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm transition-colors duration-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-blue-500 dark:focus:ring-blue-500 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-500'
            : ''
        } ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
      ) : helperText ? (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{helperText}</span>
      ) : null}
    </div>
  );
};
