import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Database, Search } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface RuntimeTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  rowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export function RuntimeTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No data available in this runtime",
  emptyIcon = <Database className="w-6 h-6 text-slate-800" />,
  error,
  onRetry,
  className = "",
  rowKey,
  onRowClick,
}: RuntimeTableProps<T>) {

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 border border-red-500/10 bg-red-500/[0.02] rounded-xl">
        <AlertCircle className="w-8 h-8 text-red-500/40 mb-3" />
        <h3 className="text-[10px] font-black text-red-400/60 uppercase tracking-widest mb-1">Runtime Sync Error</h3>
        <p className="text-[10px] text-red-400/40 mb-4">{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-4 py-1.5 bg-red-500/5 hover:bg-red-500/10 text-red-400/60 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors border border-red-500/10"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden border border-white/[0.03] rounded-xl bg-white dark:bg-slate-900/[0.02] ${className}`}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-right text-xs">
          <thead className="bg-black/[0.05] border-b border-white/[0.03] uppercase tracking-widest text-[9px] font-black text-slate-600">
            <tr>
              {columns.map((col, idx) => (
                <th key={String(col.key)} className={`px-4 py-2.5 whitespace-nowrap text-${col.align || 'right'}`} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02] text-slate-600 dark:text-slate-400">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <motion.tr key={`skeleton-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-transparent">
                    {columns.map((col, idx) => (
                      <td key={idx} className="px-4 py-3">
                        <div className="h-3 bg-white/[0.02] rounded w-3/4 animate-pulse"></div>
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : data.length === 0 ? (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      {emptyIcon}
                      <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{emptyMessage}</p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                data.map((item, idx) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={rowKey(item)} 
                    onClick={() => onRowClick?.(item)}
                    className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-blue-500/[0.02]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.01]'}`}
                  >
                    {columns.map((col, colIdx) => (
                      <td key={String(col.key)} className={`px-4 py-3 text-${col.align || 'right'} ${colIdx === 0 ? 'font-bold text-slate-700 dark:text-slate-300' : ''}`}>
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
