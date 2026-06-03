import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemTypeLabel?: string; // e.g. 'soal', 'kategori', 'peserta'
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  itemTypeLabel = 'data',
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const delta = 1;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];
  let l: number | undefined;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (l !== undefined) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/10 text-xs">
      <span className="text-zinc-500 dark:text-zinc-400 font-medium">
        Menampilkan <strong className="text-zinc-800 dark:text-zinc-200">{startIndex + 1}</strong> -{' '}
        <strong className="text-zinc-800 dark:text-zinc-200">{Math.min(endIndex, totalItems)}</strong> dari{' '}
        <strong className="text-zinc-800 dark:text-zinc-200">{totalItems}</strong> {itemTypeLabel}
      </span>
      
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {rangeWithDots.map((pageNum, idx) => {
          if (pageNum === '...') {
            return (
              <span 
                key={`dots-${idx}`}
                className="px-2.5 py-1 text-zinc-400 dark:text-zinc-500 font-black select-none"
              >
                ...
              </span>
            );
          }
          
          const isPageActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum as number)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isPageActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
