import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, AlertTriangle, Bell, Cpu, Database, HardDrive, Network, RefreshCw, Server, ShieldCheck, Terminal } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { runtimeAPI } from '../services/runtimeApi';
import { cn } from '../lib/utils';

type HistoryPoint = {
  time: string;
  cpu: number;
  memory: number;
  ports: number;
  runtimes: number;
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes) return 'غير متوفر';
  const units = ['بايت', 'ك.ب', 'م.ب', 'ج.ب', 'ت.ب'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDuration = (seconds?: number | null) => {
  if (!seconds) return 'غير متوفر';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} يوم ${hours} ساعة`;
  if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
  return `${minutes} دقيقة`;
};

const percent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'غير متوفر';
  return `${Math.round(Number(value))}%`;
};

export function Monitoring() {
  const { state } = useLocation();
  const context = state?.project;
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadMonitoring = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [discovery, runtimeEvents] = await Promise.all([
        runtimeAPI.getInfrastructureDiscovery(12000),
        runtimeAPI.getEvents(context?.id?.toString() || 'rt-core', 20).catch(() => []),
      ]);

      setSnapshot(discovery);
      setEvents(runtimeEvents || []);
      setHistory((current) => {
        const node = discovery.nodes?.[0];
        const memoryPercent = discovery.system?.memoryTotal
          ? Math.round((discovery.system.memoryUsed / discovery.system.memoryTotal) * 100)
          : Number(node?.ram || 0);
        const point = {
          time: new Date(discovery.generatedAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          cpu: Math.round(Number(node?.cpu || 0)),
          memory: memoryPercent,
          ports: discovery.summary?.activePorts || 0,
          runtimes: discovery.summary?.runtimePaths || 0,
        };
        return [...current, point].slice(-24);
      });
    } catch (err: any) {
      const message = err?.name === 'AbortError'
        ? 'انتهت مهلة المراقبة التشغيلية. لم يتم استخدام بيانات وهمية.'
        : err?.message || 'تعذر قراءة حالة المراقبة التشغيلية.';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [context?.id]);

  useEffect(() => {
    loadMonitoring();
    const interval = window.setInterval(() => loadMonitoring(true), 15000);
    return () => window.clearInterval(interval);
  }, [loadMonitoring]);

  const node = snapshot?.nodes?.[0];
  const memoryPercent = snapshot?.system?.memoryTotal
    ? Math.round((snapshot.system.memoryUsed / snapshot.system.memoryTotal) * 100)
    : node?.ram;

  const healthLabel = useMemo(() => {
    if (!snapshot) return 'غير معروف';
    if (!snapshot.pm2?.available) return 'يحتاج متابعة';
    if ((snapshot.summary?.activePorts || 0) === 0) return 'شبكة هادئة';
    return 'سليم';
  }, [snapshot]);

  const infrastructureRows = [
    { label: 'المضيف', value: snapshot?.system?.hostname || 'غير متوفر', icon: <Server /> },
    { label: 'مدة التشغيل', value: formatDuration(snapshot?.system?.uptimeSeconds), icon: <Activity /> },
    { label: 'أنوية المعالج', value: snapshot?.system?.cpuCores ?? 'غير متوفر', icon: <Cpu /> },
    { label: 'الذاكرة المستخدمة', value: `${percent(memoryPercent)} · ${formatBytes(snapshot?.system?.memoryUsed)}`, icon: <HardDrive /> },
    { label: 'مسارات التشغيل', value: snapshot?.summary?.runtimePaths ?? 'غير متوفر', icon: <Database /> },
    { label: 'المنافذ النشطة', value: snapshot?.summary?.activePorts ?? 'غير متوفر', icon: <Network /> },
    { label: 'عمليات PM2', value: snapshot?.summary?.pm2Processes ?? 'غير متوفر', icon: <Terminal /> },
    { label: 'حالة التشغيل', value: healthLabel, icon: <ShieldCheck /> },
  ];

  return (
    <div className="space-y-4 pb-8 text-right" dir="rtl">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              'fixed left-1/2 top-4 z-[150] flex items-center gap-3 rounded-2xl border px-5 py-3 text-xs font-black shadow-2xl backdrop-blur-xl',
              toast.type === 'success' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' : 'border-red-500/20 bg-red-500/10 text-red-400',
            )}
          >
            <ShieldCheck className="h-5 w-5" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <ProjectHeader
        projectName={context?.name}
        projectDescription={context ? undefined : 'مراقبة تشغيلية فعلية لحالة Runtime والبنية التحتية بدون بيانات وهمية.'}
        environment={context?.environments?.[0]?.name}
        branch={context?.environments?.[0]?.branch}
        sectionName="المراقبة التشغيلية"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadMonitoring(true).then(() => showToast('تم تحديث حالة المراقبة'))}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-300 disabled:opacity-50 dark:border-white/5 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin text-blue-400')} />
              تحديث الحالة
            </button>
            <span className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              مراقبة فعلية
            </span>
          </div>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-500">
          {error}
        </div>
      )}

      {isLoading && !snapshot ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
          <div className="text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-3 text-xs font-black text-[var(--text-tertiary)]">جار قراءة حالة Runtime الفعلية...</p>
          </div>
        </div>
      ) : !snapshot ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-orange-500" />
            <h2 className="mt-3 text-base font-black text-[var(--text-primary)]">لا توجد بيانات مراقبة فعلية</h2>
            <p className="mt-2 text-xs font-bold text-[var(--text-tertiary)]">لم يتم عرض أي بيانات بديلة أو وهمية.</p>
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {infrastructureRows.map((item) => (
              <MetricCard key={item.label} {...item} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartPanel title="منحنى المعالج والذاكرة" subtitle="قراءات مأخوذة من Runtime Discovery فقط">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                <Area type="monotone" dataKey="memory" name="الذاكرة" stroke="#a855f7" fill="#a855f7" fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="cpu" name="المعالج" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.10} strokeWidth={2} />
              </AreaChart>
            </ChartPanel>

            <ChartPanel title="المنافذ ومسارات Runtime" subtitle="لا يتم توليد أي قياسات عشوائية">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.16)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                <Line type="monotone" dataKey="ports" name="المنافذ" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="runtimes" name="مسارات التشغيل" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartPanel>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Panel title="حالة PM2" empty={snapshot.pm2?.available ? 'لا توجد عمليات PM2 قيد التشغيل' : 'PM2 غير متوفر على هذا المضيف'}>
              {snapshot.pm2?.processes?.map((proc: any) => (
                <Row key={`${proc.id}-${proc.name}`} title={proc.name} meta={`الحالة: ${proc.status || 'غير معروفة'} · PID: ${proc.pid || 'غير متوفر'}`} value={`${percent(proc.cpu)} · ${formatBytes(proc.memory)}`} />
              ))}
            </Panel>

            <Panel title="المنافذ النشطة" empty="لا توجد منافذ مستمعة">
              {snapshot.services?.ports?.slice(0, 12).map((port: any) => (
                <Row key={`${port.pid}-${port.port}-${port.localAddress}`} title={`منفذ ${port.port}`} meta={`${port.protocol} · ${port.localAddress}`} value={`عملية ${port.pid}`} />
              ))}
            </Panel>

            <Panel title="أحداث Runtime" empty="لا توجد أحداث Runtime مسجلة لهذا السياق">
              {events.map((event: any) => (
                <Row
                  key={event.id || `${event.created_at}-${event.message}`}
                  title={event.event_type || event.type || 'حدث تشغيلي'}
                  meta={event.message || event.event || 'بدون وصف'}
                  value={event.severity || 'معلومة'}
                />
              ))}
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }: { key?: React.Key; icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
          {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
        </div>
        <p className="text-left text-lg font-black text-[var(--text-primary)]">{value}</p>
      </div>
      <p className="mt-3 text-[10px] font-black text-[var(--text-tertiary)]">{label}</p>
    </div>
  );
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactElement }) {
  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-5">
      <div className="mb-5">
        <h3 className="text-sm font-black text-[var(--text-primary)]">{title}</h3>
        <p className="mt-1 text-[10px] font-bold text-[var(--text-tertiary)]">{subtitle}</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Panel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const rows = React.Children.toArray(children);
  return (
    <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] p-4">
        <Bell className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-black text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {rows.length ? rows : <div className="p-8 text-center text-xs font-bold text-[var(--text-tertiary)]">{empty}</div>}
      </div>
    </section>
  );
}

function Row({ title, meta, value }: { key?: React.Key; title: string; meta: string; value: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between gap-3 rounded-2xl p-3 hover:bg-slate-100 dark:hover:bg-white/5">
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-[var(--text-primary)]">{title}</p>
        <p className="mt-1 line-clamp-2 text-[10px] font-bold text-[var(--text-tertiary)]">{meta}</p>
      </div>
      <span className="shrink-0 rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-black text-blue-500">{value}</span>
    </motion.div>
  );
}
