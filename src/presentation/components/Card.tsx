import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glassmorphism?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  glassmorphism = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-all duration-300 dark:border-zinc-800/50 dark:bg-zinc-900/40 ${
        hoverable ? 'hover:-translate-y-1 hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700/60' : ''
      } ${
        glassmorphism ? 'backdrop-blur-md bg-white/70 border-white/20 dark:bg-zinc-900/50 dark:border-white/5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
