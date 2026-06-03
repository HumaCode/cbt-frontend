import React from 'react';

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative flex items-center justify-center h-14 w-14">
        {/* Glowing outer aura */}
        <div className="absolute inset-0 rounded-full bg-blue-500/15 dark:bg-blue-500/10 animate-ping [animation-duration:1.5s]" />
        
        {/* Outer spinner ring */}
        <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-600 dark:border-t-blue-500 animate-spin" />
        
        {/* Inner reverse spinner ring */}
        <div className="absolute h-8 w-8 rounded-full border-3 border-transparent border-t-indigo-500 dark:border-t-indigo-400 animate-spin [animation-duration:0.8s] [animation-direction:reverse]" />
        
        {/* Center core pulse dot */}
        <div className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
      </div>
      
      {label && (
        <p className="text-sm font-semibold tracking-wide text-zinc-600 dark:text-zinc-400 animate-pulse [animation-duration:2s]">
          {label}
        </p>
      )}
    </div>
  );
}
