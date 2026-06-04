import React from 'react';
import { Card as ShadcnCard } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <ShadcnCard
      className={cn(
        'transition-all duration-300 border-zinc-150 dark:border-zinc-800/50 p-6',
        hoverable && 'hover:-translate-y-1 hover:shadow-md hover:border-zinc-200 dark:hover:border-zinc-700/60',
        glassmorphism && 'backdrop-blur-md bg-white/70 border-white/20 dark:bg-zinc-900/50 dark:border-white/5',
        className
      )}
      {...props}
    >
      {children}
    </ShadcnCard>
  );
};
