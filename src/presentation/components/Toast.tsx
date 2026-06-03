'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface ToastProps extends ToastMessage {
  onClose: (id: string) => void;
}

const toastStyle = `
@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}
@keyframes toast-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
@keyframes toast-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-5px) scale(1.08); }
}
.animate-toast-progress {
  animation: toast-progress 5s linear forwards;
}
.animate-toast-shake {
  animation: toast-shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
}
.animate-toast-bounce {
  animation: toast-bounce 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}
.neon-glow-success {
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.22);
}
.neon-glow-error {
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.22);
}
.neon-glow-warning {
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.22);
}
.neon-glow-info {
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.22);
}
`;

export const Toast: React.FC<ToastProps> = ({ id, type, title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle2 className="h-6 w-6 text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-toast-bounce" />,
    error: <AlertCircle className="h-6 w-6 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)] animate-toast-shake" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] animate-toast-shake" />,
    info: <Info className="h-6 w-6 text-blue-500 drop-shadow-[0_0_6px_rgba(59,130,246,0.5)] animate-toast-bounce" />,
  };

  const bgStyles = {
    success: 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 dark:border-emerald-500/20 neon-glow-success text-emerald-950 dark:text-emerald-50',
    error: 'bg-red-500/5 dark:bg-red-950/20 border-red-500/30 dark:border-red-500/20 neon-glow-error text-red-950 dark:text-red-50',
    warning: 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30 dark:border-amber-500/20 neon-glow-warning text-amber-950 dark:text-amber-50',
    info: 'bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/30 dark:border-blue-500/20 neon-glow-info text-blue-950 dark:text-blue-50',
  };

  const progressBarColors = {
    success: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    error: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
    warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    info: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: toastStyle }} />
      <div
        className={`flex items-center gap-3.5 p-4 pr-10 rounded-2xl border backdrop-blur-md animate-slide-in pointer-events-auto max-w-sm w-full relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${bgStyles[type]}`}
        role="alert"
      >
        <div className="flex-shrink-0 flex items-center justify-center">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          {title && <h4 className="text-sm font-bold">{title}</h4>}
          <p className="text-xs text-zinc-600 dark:text-zinc-350 font-medium mt-0.5 leading-relaxed">{message}</p>
        </div>
        <button
          onClick={() => onClose(id)}
          className="absolute right-3 top-3 flex-shrink-0 p-0.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {/* Neon Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-200/10 rounded-b-2xl overflow-hidden pointer-events-none">
          <div className={`h-full w-full animate-toast-progress ${progressBarColors[type]}`} />
        </div>
      </div>
    </>
  );
};

// Global Toast Container helper hook
import { create } from 'zustand';

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  );
};
