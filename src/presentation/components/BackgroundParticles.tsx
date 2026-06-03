'use client';

import React, { useEffect, useState } from 'react';

export function BackgroundParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft blurred background blobs */}
      <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] animate-pulse [animation-duration:10s]" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 dark:bg-indigo-650/5 blur-[140px] animate-pulse [animation-duration:14s] [animation-delay:2s]" />

      {/* Floating particles */}
      <div className="absolute inset-0 opacity-20 dark:opacity-35">
        {[...Array(16)].map((_, i) => {
          const size = ((i * 3) % 7) + 3; // 3px to 10px
          const left = (i * 7.3) % 100;
          const delay = (i * 1.7) % 22;
          const duration = 18 + ((i * 5) % 14); // 18s to 32s
          
          return (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500/40 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 animate-float"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                bottom: `0%`,
                animationDuration: `${duration}s`,
                animationDelay: `-${delay}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
