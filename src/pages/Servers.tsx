import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  FolderTree,
  Globe,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { motion } from 'motion/react';
import { runtimeAPI } from '../services/runtimeApi';
import { cn } from '../lib/utils';

type DiscoveryState = {
  generatedAt: string;
  durationMs: number;
  nodes: any[];
  summary: any;
  system: any;
  pm2: { available: boolean; error?: string | null; processes: any[] };
  services: { ports: any[]; domains: any[]; containers: any[] };
  runtimePaths: any[];
  projects: any[];
  relationships: any[];
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

export function Servers() {
  const [data, setData] = useState<DiscoveryState | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInfrastructure = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const discovery = await runtimeAPI.getInfrastructureDiscovery(12000);
      setData(discovery);
      setSelectedNodeId((current) => current || discovery.nodes?.[0]?.id || null);
    } catch (err: any) {
      const message = err?.name === 'AbortError'
        ? 'انتهت مهلة اكتشاف البنية التحتية. حاول مرة أخرى.'
        : err?.message || 'تعذر قراءة حالة البنية التحتية.';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInfrastructure();
    const interval = window.setInterval(() => loadInfrastructure(true), 45000);
    return () => window.clearInterval(interval);
  }, [loadInfrastructure]);

  const selectedNode = useMemo(
    () => data?.nodes?.find((node) => node.id === selectedNodeId) || data?.nodes?.[0] || null,
    [data, selectedNodeId],
  );

  const memoryPercent = data?.system?.memoryTotal
    ? Math.round((data.system.memoryUsed / data.system.memoryTotal) * 100)
    : null;

  return (
    <div className="h-[calc(100vh-6rem)] overflow-hidden text-right" dir="rtl">
      <div className="flex h-full flex-col gap-4">
        <header className="shrink-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-500" />
                <h1 className="text-lg font-black text-[var(--text-primary)]">مركز إدارة السيرفرات والبنية التحتية</h1>
              </div>
              <p className="mt-1 text-xs font-bold text-[var(--text-tertiary)]">
                طبقة اكتشاف تشغيلية تقرأ حالة النظام، العمليات، المنافذ، النطاقات، والمسارات الفعلية.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {data?.generatedAt && (
                <span className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-[10px] font-black text-[var(--text-tertiary)]">
                  آخر تحديث: {new Date(data.generatedAt).toLocaleTimeString('ar-SA')}
                </span>
              )}
              <button
                onClick={() => loadInfrastructure(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                تحديث الحالة
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-500">
            {error}
          </div>
        )}

        {isLoading && !data ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
            <div className="text-center">
              <RefreshCw className="mx-auto h-7 w-7 animate-spin text-blue-500" />
              <p className="mt-3 text-xs font-black text-[var(--text-tertiary)]">جار اكتشاف حالة البنية التحتية...</p>
            </div>
          </div>
        ) : !data?.nodes?.length ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
            <div className="text-center">
              <Server className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
              <h2 className="mt-3 text-base font-black text-[var(--text-primary)]">لا توجد عقد تشغيل مرتبطة حاليًا</h2>
              <p className="mt-2 text-xs font-bold text-[var(--text-tertiary)]">يمكنك إعادة المحاولة بعد ربط سيرفر أو تشغيل عملية Runtime.</p>
            </div>
          </div>
        ) : (
          <>
            <section className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-6">
              <Metric icon={<Server />} label="العقد" value={data.summary.nodes} />
              <Metric icon={<FolderTree />} label="مسارات التشغيل" value={data.summary.runtimePaths} />
              <Metric icon={<Terminal />} label="عمليات PM2" value={data.summary.pm2Processes} />
              <Metric icon={<Network />} label="المنافذ المستمعة" value={data.summary.activePorts} />
              <Metric icon={<Globe />} label="النطاقات" value={data.summary.domains} />
              <Metric icon={<Database />} label="الحاويات" value={data.summary.containers} />
            </section>

            <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
              <section className="min-h-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] lg:col-span-4">
                <div className="border-b border-[var(--border-subtle)] p-3">
                  <h2 className="text-xs font-black text-[var(--text-primary)]">عقد التشغيل المكتشفة</h2>
                </div>
                <div className="max-h-full space-y-2 overflow-y-auto p-3">
                  {data.nodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={cn(
                        'w-full rounded-xl border p-3 text-right transition',
                        selectedNode?.id === node.id
                          ? 'border-blue-500/40 bg-blue-500/10'
                          : 'border-[var(--border-subtle)] hover:bg-slate-100 dark:hover:bg-white/5',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[var(--text-primary)]">{node.name}</p>
                          <p className="mt-1 text-[11px] font-bold text-[var(--text-tertiary)]">{node.ip} · {node.os}</p>
                        </div>
                        <Status value={node.health} />
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                        <Mini label="معالج" value={percent(node.cpu)} />
                        <Mini label="ذاكرة" value={percent(node.ram)} />
                        <Mini label="تشغيل" value={node.runtimeCount} />
                        <Mini label="منافذ" value={node.portCount} />
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="min-h-0 space-y-4 overflow-y-auto lg:col-span-8">
                {selectedNode && (
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-base font-black text-[var(--text-primary)]">{selectedNode.name}</h2>
                        <p className="mt-1 text-xs font-bold text-[var(--text-tertiary)]">
                          {selectedNode.region} · {selectedNode.os} · مدة التشغيل {formatDuration(selectedNode.uptimeSeconds)}
                        </p>
                      </div>
                      <Status value={selectedNode.health} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <RuntimeBox icon={<Cpu />} label="المعالج" value={percent(selectedNode.cpu)} />
                      <RuntimeBox icon={<Activity />} label="الذاكرة" value={percent(selectedNode.ram)} sub={`${formatBytes(data.system.memoryUsed)} / ${formatBytes(data.system.memoryTotal)}`} />
                      <RuntimeBox icon={<HardDrive />} label="التخزين" value={percent(selectedNode.disk)} />
                      <RuntimeBox icon={<Network />} label="الشبكة" value={selectedNode.networkStatus === 'listening' ? 'تستمع' : 'هادئة'} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <Panel title="عمليات PM2 الفعلية" empty={data.pm2.available ? 'لا توجد عمليات PM2 قيد التشغيل' : 'PM2 غير متوفر على هذا المضيف'}>
                    {data.pm2.processes.map((proc) => (
                      <Row key={`${proc.id}-${proc.name}`} title={proc.name} meta={`الحالة: ${proc.status || 'غير معروفة'} · المعرف: ${proc.pid || 'غير متوفر'}`} value={`${percent(proc.cpu)} / ${formatBytes(proc.memory)}`} />
                    ))}
                  </Panel>

                  <Panel title="المنافذ والخدمات النشطة" empty="لا توجد منافذ مستمعة">
                    {data.services.ports.slice(0, 12).map((port) => (
                      <Row key={`${port.pid}-${port.port}-${port.localAddress}`} title={`منفذ ${port.port}`} meta={`${port.protocol} · ${port.localAddress}`} value={`عملية ${port.pid}`} />
                    ))}
                  </Panel>

                  <Panel title="النطاقات وملفات Nginx" empty="لا توجد نطاقات Nginx مكتشفة">
                    {data.services.domains.map((domain) => (
                      <Row key={domain.configPath || domain.name} title={domain.name} meta={domain.rootPath || domain.configPath || 'بدون مسار'} value={domain.proxyPort ? `منفذ ${domain.proxyPort}` : 'ملف ثابت'} />
                    ))}
                  </Panel>

                  <Panel title="علاقات التشغيل والمسارات" empty="لا توجد مسارات تشغيل مكتشفة">
                    {data.relationships.map((rel) => (
                      <Row key={rel.path} title={rel.runtime} meta={`${rel.type} · ${rel.path}`} value={rel.domain || rel.owner || 'غير مسجل'} />
                    ))}
                  </Panel>
                </div>
              </section>
            </main>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-blue-500">{React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}</div>
        <p className="text-xl font-black text-[var(--text-primary)]">{value}</p>
      </div>
      <p className="mt-1 text-[10px] font-black text-[var(--text-tertiary)]">{label}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-black/20">
      <p className="text-[9px] font-bold text-[var(--text-tertiary)]">{label}</p>
      <p className="text-[11px] font-black text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function RuntimeBox({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 p-3 dark:bg-black/20">
      <div className="mb-2 flex items-center gap-2 text-blue-500">
        {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
        <span className="text-[10px] font-black text-[var(--text-tertiary)]">{label}</span>
      </div>
      <p className="text-lg font-black text-[var(--text-primary)]">{value}</p>
      {sub && <p className="mt-1 text-[10px] font-bold text-[var(--text-tertiary)]">{sub}</p>}
    </div>
  );
}

function Status({ value }: { value: string }) {
  const healthy = value === 'healthy' || value === 'online';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-black',
      healthy ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-orange-500/20 bg-orange-500/10 text-orange-500',
    )}>
      {healthy ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {healthy ? 'سليم' : 'يحتاج متابعة'}
    </span>
  );
}

function Panel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] | React.ReactNode }) {
  const list = React.Children.toArray(children);
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] p-3">
        <ShieldCheck className="h-4 w-4 text-blue-500" />
        <h3 className="text-xs font-black text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="max-h-64 overflow-y-auto p-2">
        {list.length > 0 ? list : (
          <div className="p-6 text-center text-xs font-bold text-[var(--text-tertiary)]">{empty}</div>
        )}
      </div>
    </section>
  );
}

function Row({ title, meta, value }: { key?: React.Key; title: string; meta: string; value: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between gap-3 rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/5">
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-[var(--text-primary)]">{title}</p>
        <p className="mt-1 truncate text-[10px] font-bold text-[var(--text-tertiary)]">{meta}</p>
      </div>
      <span className="shrink-0 rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-black text-blue-500">{value}</span>
    </motion.div>
  );
}
