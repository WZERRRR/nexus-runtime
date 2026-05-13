import React from 'react';
import { Activity, Bell, Layout, Menu, Moon, Search, Settings, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export function Header({ setMobileOpen }: { setMobileOpen: (v: boolean) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const projectContext = location.state?.project;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-main)]/90 px-4 backdrop-blur-md lg:px-6" dir="rtl">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="touch-target rounded-lg text-[var(--text-secondary)] transition hover:bg-slate-100 hover:text-[var(--text-primary)] dark:hover:bg-white/5 lg:hidden"
          aria-label="فتح القائمة"
          title="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          onClick={() => navigate('/')}
          className="hidden rounded-lg p-2 text-[var(--text-tertiary)] transition hover:bg-slate-100 hover:text-[var(--text-primary)] dark:hover:bg-white/5 sm:flex"
          title="لوحة القيادة"
        >
          <Layout className="h-4 w-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="truncate text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)]">
              {projectContext ? projectContext.name : 'DevCore Runtime'}
            </p>
          </div>
          <p className="hidden text-[9px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] sm:block">
            {projectContext ? 'Project runtime context' : 'Predictive Enterprise OS ready'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[var(--text-tertiary)] sm:gap-2">
        <label className="hidden items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-slate-100 px-2.5 py-1.5 transition focus-within:border-blue-500/30 dark:bg-black/10 md:flex">
          <Search className="h-3.5 w-3.5 opacity-60" />
          <input
            type="text"
            placeholder="بحث سريع"
            className="w-28 border-none bg-transparent px-1 text-right text-[10px] font-bold text-[var(--text-secondary)] outline-none placeholder:text-slate-500 lg:w-36"
          />
        </label>

        <button
          onClick={() => navigate('/monitoring')}
          className="rounded-lg p-2.5 transition hover:bg-slate-100 hover:text-blue-500 dark:hover:bg-white/5"
          title="المراقبة"
        >
          <Activity className="h-4 w-4" />
        </button>

        <button
          onClick={() => navigate('/logs')}
          className="relative rounded-lg p-2.5 transition hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-white/5"
          title="التنبيهات والسجلات"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <button
          onClick={toggleTheme}
          className="rounded-lg p-2.5 transition hover:bg-slate-100 hover:text-[var(--text-primary)] dark:hover:bg-white/5"
          title={theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <div className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />

        <button
          onClick={() => navigate('/settings')}
          className="hidden rounded-lg p-2 transition hover:bg-slate-100 hover:text-[var(--text-primary)] dark:hover:bg-white/5 sm:block"
          title="الإعدادات"
        >
          <Settings className="h-4 w-4" />
        </button>

        <button
          onClick={() => navigate('/team')}
          className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-black/[0.02] p-1 transition hover:border-blue-500/30 dark:bg-white/[0.02]"
          title="حساب المدير"
        >
          <div className="hidden pl-2 text-right md:block">
            <p className="mb-0.5 text-[9px] font-black uppercase tracking-tight text-[var(--text-secondary)]">أحمد محمود</p>
            <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] opacity-70">Admin</p>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-slate-100 text-[9px] font-black text-[var(--text-secondary)] dark:bg-slate-800">
            AM
          </div>
        </button>
      </div>
    </header>
  );
}
