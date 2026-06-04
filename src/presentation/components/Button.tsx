import React from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  let shadcnVariant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link' = 'default';
  let customClass = '';

  if (variant === 'secondary') {
    shadcnVariant = 'secondary';
  } else if (variant === 'outline') {
    shadcnVariant = 'outline';
  } else if (variant === 'danger') {
    shadcnVariant = 'destructive';
  } else if (variant === 'success') {
    shadcnVariant = 'default';
    customClass = 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-650';
  } else if (variant === 'primary') {
    shadcnVariant = 'default';
    customClass = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-indigo-500/25 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-450 dark:hover:to-indigo-450 border-none';
  }

  let shadcnSize: 'sm' | 'default' | 'lg' = 'default';
  if (size === 'sm') {
    shadcnSize = 'sm';
  } else if (size === 'lg') {
    shadcnSize = 'lg';
  }

  return (
    <ShadcnButton
      variant={shadcnVariant}
      size={shadcnSize}
      disabled={disabled || isLoading}
      className={cn(
        'cursor-pointer transition-all duration-300 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2',
        customClass,
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 mr-2 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </ShadcnButton>
  );
};
