import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  ArchiveRestore,
  Box,
  Cpu,
  CreditCard,
  Database,
  FileText,
  Fingerprint,
  FolderOpen,
  FolderTree,
  Folders,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  Server,
  Settings,
  Shield,
  Smartphone,
  Terminal,
  UploadCloud,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { runtimeAPI, SystemStatus } from '../../services/runtimeApi';

const MENU_ITEMS = [
  {
    title: 'Operations',
    items: [
      { name: 'لوحة القيادة', icon: LayoutDashboard, path: '/' },
      { name: 'المراقبة اللحظية', icon: Activity, path: '/monitoring' },
      { name: 'السجلات', icon: FileText, path: '/logs' },
      { name: 'مركز النشر', icon: UploadCloud, path: '/deploy' },
      { name: 'النسخ الاحتياطي', icon: ArchiveRestore, path: '/backup' },
    ],
  },
  {
    title: 'Runtime',
    items: [
      { name: 'المشاريع', icon: Folders, path: '/projects' },
      { name: 'مدير الملفات', icon: FolderOpen, path: '/files' },
      { name: 'إدارة PM2', icon: Box, path: '/pm2' },
      { name: 'واجهات Frontend', icon: LayoutDashboard, path: '/frontend' },
      { name: 'تطبيقات الموبايل', icon: Smartphone, path: '/mobile' },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      { name: 'السيرفرات', icon: Server, path: '/servers' },
      { name: 'تنظيم السيرفر', icon: FolderTree, path: '/infrastructure' },
      { name: 'قواعد البيانات', icon: Database, path: '/database' },
      { name: 'النطاقات و SSL', icon: Lock, path: '/domains' },
    ],
  },
  {
    title: 'Security',
    items: [
      { name: 'النظام والأمان', icon: Shield, path: '/security' },
      { name: 'رسائل OTP والإشعارات', icon: KeyRound, path: '/otp' },
    ],
  },
  {
    title: 'Governance',
    items: [
      { name: 'Nexus Governance', icon: Shield, path: '/governance' },
      { name: 'فريق العمل', icon: Users, path: '/team' },
    ],
  },
  {
    title: 'AI',
    items: [{ name: 'مراقب الذكاء الاصطناعي', icon: Cpu, path: '/ai-monitor' }],
  },
  {
    title: 'System',
    items: [
      { name: 'بيئات DEV/LIVE', icon: Fingerprint, path: '/environments' },
      { name: 'المدفوعات', icon: CreditCard, path: '/payments' },
      { name: 'دليل الاستخدام', icon: FileText, path: '/docs' },
      { name: 'الإعدادات الشاملة', icon: Settings, path: '/settings' },
    ],
  },
  {
    title: 'Development',
    items: [
      { name: 'إدارة APIs', icon: Globe, path: '/apis' },
      { name: 'Terminal', icon: Terminal, path: '/terminal' },
    ],
  },
];

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  const location = useLocation();
  const projectContext = location.state?.project;
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
  const [stability, setStability] = useState(100);

  useEffect(() => {
    const fetchStatus = async () => {
      const [status, index] = await Promise.all([
        runtimeAPI.getSystemStatus().catch(() => null),
        runtimeAPI.getStabilityIndex().catch(() => null),
      ]);

      if (status) setSysStatus(status);
      if (index && Array.isArray(index) && index[0]) setStability(index[0].score);
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[var(--bg-main)]/90 backdrop-blur-md lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-[70] flex w-64 flex-col border-l border-[var(--border-subtle)] glass-panel transition-transform duration-500 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full',
        )}
        dir="rtl"
      >
        <div className="h-14 shrink-0 border-b border-[var(--border-subtle)] px-5 flex items-center">
          <div>
            <h1 className="text-base font-black text-[var(--text-primary)] tracking-tight">DEVCORE AI</h1>
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-500/60">Predictive Enterprise OS</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar py-5 px-4 space-y-7">
          {projectContext && (
            <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-3">
              <p className="text-[8px] font-black uppercase tracking-widest text-blue-500/60">Runtime Active</p>
              <p className="mt-1 truncate text-[11px] font-black text-[var(--text-primary)]">{projectContext.name}</p>
            </div>
          )}

          {MENU_ITEMS.map((group) => (
            <section key={group.title} className="space-y-1.5">
              <h2 className="px-3 text-[9px] font-black uppercase tracking-widest text-slate-500/60">{group.title}</h2>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  state={location.state}
                  onClick={() => {
                    if (window.innerWidth < 1024) setMobileOpen(false);
                  }}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all',
                      isActive
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute right-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-l-full bg-blue-500"
                        />
                      )}
                      <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-blue-500' : 'opacity-80')} />
                      <span className="truncate">{item.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </section>
          ))}

          <div className="px-3 space-y-3">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
              <span>Kernel Health</span>
              <span className={stability > 90 ? 'text-emerald-500' : 'text-orange-500'}>{stability}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, stability))}%` }}
                className={cn('h-full', stability > 90 ? 'bg-emerald-500' : 'bg-orange-500')}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[var(--border-subtle)] bg-slate-100 p-2 dark:bg-slate-900/50">
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Load</p>
                <p className="text-[10px] font-black text-[var(--text-primary)]">{sysStatus ? sysStatus.loadavg[0].toFixed(2) : '...'}</p>
              </div>
              <div className="rounded-lg border border-[var(--border-subtle)] bg-slate-100 p-2 dark:bg-slate-900/50">
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">I/O</p>
                <p className="text-[10px] font-black text-emerald-500">Low</p>
              </div>
            </div>
          </div>
        </nav>

        <div className="border-t border-[var(--border-subtle)] p-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-slate-100 px-3 py-2 dark:bg-white/[0.02]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              SA
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-black uppercase tracking-tight text-[var(--text-primary)]">Super Admin</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Online</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
