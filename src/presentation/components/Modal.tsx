import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  hideScrollbar?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  hideScrollbar = false,
}) => {
  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && closeOnOverlayClick) {
        onClose();
      }
    }}>
      <DialogContent
        className={cn(
          'p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl flex flex-col gap-0 max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
          sizeClasses[size]
        )}
      >
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/60">
          <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title || '\u00A0'}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className={`px-6 py-5 overflow-y-auto max-h-[70vh] text-zinc-700 dark:text-zinc-300 ${
          hideScrollbar ? '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' : ''
        }`}>
          {children}
        </div>

        {footer && (
          <DialogFooter className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900/30">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
