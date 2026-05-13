import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';
import { PageLoader } from '../common/Loader';

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[var(--bg-main)] text-[var(--text-secondary)] overflow-hidden relative">
      {/* Background ambient light - Reduced */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/[0.03] dark:bg-blue-600/[0.03] blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-600/[0.03] dark:bg-purple-600/[0.03] blur-[150px] rounded-full pointer-events-none"></div>

      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 z-10 relative h-full">
        <Header setMobileOpen={setMobileOpen} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <React.Suspense fallback={<PageLoader />}>
              <Outlet />
            </React.Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
