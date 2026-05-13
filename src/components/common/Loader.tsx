import React from 'react';
import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
      <h2 className="text-lg font-medium text-[var(--text-primary)]">جاري تحميل البيانات...</h2>
      <p className="text-sm text-slate-500 mt-2">لحظات ويتم عرض المحتوى.</p>
    </div>
  );
}
