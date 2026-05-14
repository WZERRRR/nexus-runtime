import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  Download,
  Eye,
  FolderOpen,
  GitBranch,
  Globe,
  HardDrive,
  Key,
  LifeBuoy,
  Network,
  Plus,
  RefreshCw,
  Rocket,
  Server,
  ShieldCheck,
  SquareTerminal,
  Terminal,
  X,
} from 'lucide-react';
import { runtimeAPI } from '../services/runtimeApi';
import { cn } from '../lib/utils';

type InfrastructureData = {
  generatedAt: string;
  durationMs: number;
  nodes: RuntimeNode[];
  summary: Record<string, any>;
  system: Record<string, any>;
  pm2: { available: boolean; error?: string | null; processes: any[] };
  services: { ports: any[]; containers: any[]; domains: any[] };
  runtimePaths: RuntimeCandidate[];
  discoveryWorkspace?: RuntimeCandidate[];
  relationships: any[];
};

type RuntimeNode = {
  id: string;
  name: string;
  ip: string;
  os: string;
  region?: string;
  status: string;
  cpu: number | null;
  ram: number | null;
  disk: number | null;
  uptimeSeconds?: number | null;
  runtimeCount: number;
  pm2Count: number;
  portCount: number;
  domainCount: number;
  containerCount: number;
  health: string;
  networkStatus: string;
};

type RuntimeCandidate = {
  name: string;
  path: string;
  type: string;
  environment?: string;
  source?: string;
  domain?: string | null;
  pm2Process?: string | null;
  pm2Status?: string | null;
  cpu?: number | null;
  ram?: number | null;
  uptime?: number | null;
  restarts?: number | null;
  health?: string;
  deployState?: string;
  lastDeploy?: string;
  sizeBytes?: number;
  markers?: Record<string, boolean>;
};

const emptyServerForm = {
  name: '',
  ip: '',
  port: 22,
  username: 'root',
  authType: 'ssh-key',
  credentials: '',
  env: 'LIVE',
  autoDiscovery: true,
};

const healthLabels: Record<string, string> = {
  Healthy: 'سليم',
  Warning: 'تحذير',
  Critical: 'حرج',
  Offline: 'متوقف',
  healthy: 'سليم',
  degraded: 'يحتاج متابعة',
  online: 'متصل',
};

const environmentLabels: Record<string, string> = {
  Production: 'إنتاج',
  Development: 'تطوير',
  Staging: 'اختبار',
  Backup: 'نسخة احتياطية',
  Snapshot: 'لقطة',
  Archived: 'مؤرشف',
  LIVE: 'إنتاج',
  STAGING: 'اختبار',
  DEV: 'تطوير',
};

const sourceLabels: Record<string, string> = {
  GitHub: 'مستودع Git',
  'Imported Runtime': 'Runtime مستورد',
  'Local Runtime': 'Runtime محلي',
  'Archived Runtime': 'Runtime مؤرشف',
};

function formatBytes(value?: number | null) {
  if (!value || value <= 0) return 'غير متوفر';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return 'غير متوفر';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} يوم ${hours} ساعة`;
  if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
  return `${minutes} دقيقة`;
}

function percent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'غير متوفر';
  return `${Math.round(value)}%`;
}

function formatRate(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'غير متوفر';
  return `${formatBytes(value)}/ث`;
}

function formatLatency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'غير متوفر';
  return `${Math.round(value)}ms`;
}

function runtimeHealth(candidate: RuntimeCandidate) {
  if (candidate.health) return candidate.health;
  if (candidate.pm2Status === 'online') return 'Healthy';
  if (candidate.pm2Process) return 'Warning';
  return 'Offline';
}

function environmentColor(environment?: string) {
  const value = environment || 'Development';
  if (value === 'Production') return 'border-red-500/20 bg-red-500/10 text-red-500';
  if (value === 'Staging') return 'border-orange-500/20 bg-orange-500/10 text-orange-500';
  if (value === 'Backup') return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600';
  if (value === 'Snapshot') return 'border-purple-500/20 bg-purple-500/10 text-purple-500';
  if (value === 'Archived') return 'border-slate-500/20 bg-slate-500/10 text-slate-500';
  return 'border-blue-500/20 bg-blue-500/10 text-blue-500';
}

export function Servers() {
  const navigate = useNavigate();
  const [data, setData] = useState<InfrastructureData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<RuntimeCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<RuntimeCandidate | null>(null);
  const [ignoredPaths, setIgnoredPaths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverForm, setServerForm] = useState(emptyServerForm);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadInfrastructure = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const nextData = await runtimeAPI.getInfrastructureDiscovery(12000);
      setData(nextData);
      setWorkspace(nextData.discoveryWorkspace || nextData.runtimePaths || []);
      setSelectedNodeId((current) => current || nextData.nodes?.[0]?.id || null);
    } catch (err: any) {
      setError(err?.name === 'AbortError' ? 'انتهت مهلة اكتشاف البنية التحتية. يمكنك إعادة المحاولة.' : err?.message || 'تعذر قراءة حالة البنية التحتية.');
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

  const visibleWorkspace = useMemo(
    () => workspace.filter((candidate) => !ignoredPaths.has(candidate.path)),
    [workspace, ignoredPaths],
  );

  const handleDiscoverProjects = async () => {
    setIsDiscovering(true);
    setError(null);
    try {
      const nextData = await runtimeAPI.getInfrastructureDiscovery(15000);
      setData(nextData);
      setWorkspace(nextData.discoveryWorkspace || nextData.runtimePaths || []);
      showToast('تم تحديث مساحة اكتشاف المشاريع. الاستيراد لا يتم إلا بموافقتك.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'تعذر سحب المشاريع المكتشفة.', 'error');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSyncInfrastructure = async () => {
    await loadInfrastructure(true);
    showToast('تمت مزامنة البنية التحتية من الحالة التشغيلية الحالية.', 'success');
  };

  const handleAnalyzeRuntime = () => {
    if (!data) {
      showToast('لا توجد بيانات تشغيلية كافية للتحليل.', 'warning');
      return;
    }
    const warnings = [
      data.pm2.available ? null : 'PM2 غير متوفر على هذا المضيف',
      data.summary.activePorts > 0 ? null : 'لا توجد منافذ تشغيلية ظاهرة',
      data.system.diskUsage && data.system.diskUsage > 85 ? 'استخدام التخزين مرتفع' : null,
      data.system.memoryTotal && (data.system.memoryUsed / data.system.memoryTotal) > 0.85 ? 'استخدام الذاكرة مرتفع' : null,
    ].filter(Boolean);
    showToast(warnings.length ? `تحليل Runtime: ${warnings.join(' · ')}` : 'تحليل Runtime: الحالة مستقرة ولا توجد إشارات حرجة.', warnings.length ? 'warning' : 'success');
  };

  const handleGovernance = () => {
    navigate('/governance');
  };

  const handleRuntimeAction = (candidate: RuntimeCandidate, action: string) => {
    const governedActions: Record<string, string> = {
      restart: 'إعادة التشغيل تتطلب موافقة حوكمة قبل التنفيذ.',
      stop: 'إيقاف Runtime يتطلب موافقة حوكمة قبل التنفيذ.',
      deploy: 'النشر يتطلب مسار Deploy محكوم وقابل للاسترجاع.',
      governance: 'فتح مركز الحوكمة لهذا Runtime.',
      health: 'تم تحديث قراءة الصحة من الاكتشاف الحالي.',
      recovery: 'التعافي يتطلب نقطة استرجاع صالحة قبل أي تغيير.',
      logs: 'السجلات مرتبطة بالـ Runtime عند توفر PM2 أو سجل تشغيل.',
      terminal: 'الطرفية التشغيلية يجب أن تعمل ضمن نطاق Runtime محكوم.',
    };

    if (action === 'files') {
      navigate('/files', { state: { project: { name: candidate.name, runtime_path: candidate.path, id: candidate.path } } });
      return;
    }

    if (action === 'governance') {
      navigate('/governance', { state: { runtime: candidate } });
      return;
    }

    if (action === 'terminal') {
      navigate('/terminal', { state: { runtime: candidate } });
      return;
    }

    showToast(governedActions[action] || 'تم تسجيل العملية كإجراء محكوم.', action === 'health' ? 'success' : 'warning');
  };

  const handleProvisionServer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serverForm.name.trim() || !serverForm.ip.trim() || !serverForm.username.trim()) {
      showToast('أدخل اسم السيرفر والعنوان واسم المستخدم قبل الربط.', 'warning');
      return;
    }

    setIsProvisioning(true);
    try {
      await runtimeAPI.registerServer({
        name: serverForm.name,
        ip: serverForm.ip,
        port: serverForm.port,
        username: serverForm.username,
        authType: serverForm.authType === 'password' ? 'Password' : 'SSH Key',
        credentials: serverForm.credentials,
        env: serverForm.env,
        role: 'Runtime Infrastructure Node',
        region: 'تشغيلي',
      });
      setIsServerModalOpen(false);
      setServerForm(emptyServerForm);
      showToast('تم ربط السيرفر وبدء قراءة حالة البنية التحتية.', 'success');
      await loadInfrastructure(true);
      if (serverForm.autoDiscovery) await handleDiscoverProjects();
    } catch (err: any) {
      showToast(err?.message || 'تعذر ربط السيرفر.', 'error');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleImportRuntime = async (candidate: RuntimeCandidate) => {
    try {
      const result = await runtimeAPI.importProject(candidate);
      if (!result.success) throw new Error(result.message || 'رفضت طبقة الحوكمة الاستيراد.');
      setWorkspace((current) => current.filter((item) => item.path !== candidate.path));
      showToast(`تم استيراد ${candidate.name} كـ Runtime مدار.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'تعذر استيراد Runtime.', 'error');
    }
  };

  const classifyCandidate = (candidate: RuntimeCandidate, environment: string) => {
    setWorkspace((current) => current.map((item) => (
      item.path === candidate.path ? { ...item, environment } : item
    )));
  };

  return (
    <div className="h-[calc(100vh-6rem)] overflow-hidden text-right" dir="rtl">
      {toast && (
        <div className={cn(
          'fixed left-1/2 top-4 z-[90] -translate-x-1/2 rounded-xl border px-4 py-3 text-sm font-black shadow-lg',
          toast.type === 'success' && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
          toast.type === 'warning' && 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600',
          toast.type === 'error' && 'border-red-500/20 bg-red-500/10 text-red-500',
        )}>
          {toast.message}
        </div>
      )}

      <div className="flex h-full flex-col gap-4">
        <header className="shrink-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-500" />
                <h1 className="text-lg font-black text-[var(--text-primary)]">مركز إدارة السيرفرات والبنية التحتية</h1>
              </div>
              <p className="mt-1 max-w-4xl text-xs font-bold text-[var(--text-tertiary)]">
                طبقة اكتشاف تشغيلية تقرأ السيرفرات، العمليات، المنافذ، النطاقات، والمسارات الفعلية قبل أي إدارة أو استيراد.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {data?.generatedAt && (
                <span className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-[10px] font-black text-[var(--text-tertiary)]">
                  آخر تحديث: {new Date(data.generatedAt).toLocaleTimeString('ar-SA')}
                </span>
              )}
              <button
                onClick={() => loadInfrastructure(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-black text-[var(--text-primary)] transition hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/5"
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                تحديث الحالة
              </button>
              <button
                onClick={handleSyncInfrastructure}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-black text-[var(--text-primary)] transition hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-white/5"
              >
                <Activity className="h-4 w-4" />
                مزامنة البنية
              </button>
              <button
                onClick={() => setIsServerModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" />
                إضافة سيرفر
              </button>
              <button
                onClick={handleDiscoverProjects}
                disabled={isDiscovering}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-500 disabled:opacity-60"
              >
                <Download className={cn('h-4 w-4', isDiscovering && 'animate-pulse')} />
                سحب المشاريع
              </button>
              <button
                onClick={handleAnalyzeRuntime}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white transition hover:bg-purple-500"
              >
                <Brain className="h-4 w-4" />
                تحليل Runtime
              </button>
              <button
                onClick={handleGovernance}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15"
              >
                <ShieldCheck className="h-4 w-4" />
                الحوكمة
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-500">
            {error}
          </div>
        )}

        {isLoading && !data ? (
          <EmptyState icon={<RefreshCw className="h-8 w-8 animate-spin" />} title="جاري اكتشاف البنية التحتية" text="يتم قراءة الحالة الفعلية للسيرفر والمنافذ والمسارات." />
        ) : !data?.nodes?.length ? (
          <EmptyState icon={<Server className="h-10 w-10" />} title="لا توجد عقد تشغيل مرتبطة حاليًا" text="اربط سيرفرًا أو أعد محاولة الاكتشاف بعد تشغيل Runtime فعلي." />
        ) : (
          <>
            <section className="grid shrink-0 grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-10">
              <Metric icon={<Server />} label="العقد" value={data.summary.nodes} />
              <Metric icon={<FolderOpen />} label="المشاريع المكتشفة" value={visibleWorkspace.length} />
              <Metric icon={<Terminal />} label="عمليات PM2" value={data.summary.pm2Processes} />
              <Metric icon={<Network />} label="المنافذ" value={data.summary.activePorts} />
              <Metric icon={<Activity />} label="الخدمات" value={data.summary.activeServices || 0} />
              <Metric icon={<Cpu />} label="CPU" value={percent(selectedNode?.cpu)} />
              <Metric icon={<Database />} label="RAM" value={percent(selectedNode?.ram)} />
              <Metric icon={<HardDrive />} label="المساحة الحرة" value={formatBytes(data.system.diskFree)} />
              <Metric icon={<Gauge />} label="الشبكة" value={formatRate(data.system.networkUsage)} />
              <Metric icon={<Globe />} label="زمن القراءة" value={formatLatency(data.system.runtimeLatencyMs || data.durationMs)} />
            </section>

            <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
              <section className="min-h-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] xl:col-span-3">
                <PanelHeader icon={<Server />} title="عقد التشغيل" />
                <div className="max-h-full space-y-2 overflow-y-auto p-3">
                  {data.nodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={cn(
                        'w-full rounded-xl border p-3 text-right transition',
                        selectedNode?.id === node.id ? 'border-blue-500/40 bg-blue-500/10' : 'border-[var(--border-subtle)] hover:bg-slate-100 dark:hover:bg-white/5',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[var(--text-primary)]">{node.name}</p>
                          <p className="mt-1 text-[11px] font-bold text-[var(--text-tertiary)]">{node.ip} · {node.os}</p>
                        </div>
                        <HealthBadge value={node.health} />
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        <Mini label="معالج" value={percent(node.cpu)} />
                        <Mini label="ذاكرة" value={percent(node.ram)} />
                        <Mini label="تشغيل" value={node.runtimeCount} />
                        <Mini label="منافذ" value={node.portCount} />
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="min-h-0 space-y-4 overflow-y-auto xl:col-span-5">
                {selectedNode && (
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-black text-[var(--text-primary)]">{selectedNode.name}</h2>
                        <p className="mt-1 text-xs font-bold text-[var(--text-tertiary)]">
                          {selectedNode.region || 'تشغيلي'} · مدة التشغيل {formatDuration(selectedNode.uptimeSeconds)}
                        </p>
                      </div>
                      <HealthBadge value={selectedNode.health} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
                      <RuntimeBox icon={<Cpu />} label="المعالج" value={percent(selectedNode.cpu)} />
                      <RuntimeBox icon={<Activity />} label="الذاكرة" value={percent(selectedNode.ram)} sub={`${formatBytes(data.system.memoryUsed)} / ${formatBytes(data.system.memoryTotal)}`} />
                      <RuntimeBox icon={<HardDrive />} label="التخزين" value={percent(data.system.diskUsage ?? selectedNode.disk)} sub={`${formatBytes(data.system.diskFree)} متاح`} />
                      <RuntimeBox icon={<Network />} label="الشبكة" value={formatRate(data.system.networkUsage)} sub={selectedNode.networkStatus === 'listening' ? 'منافذ نشطة' : 'هادئة'} />
                      <RuntimeBox icon={<Gauge />} label="الحمل" value={(data.system.loadavg || []).slice(0, 3).map((item: number) => item.toFixed ? item.toFixed(2) : item).join(' / ') || 'غير متوفر'} />
                      <RuntimeBox icon={<Activity />} label="IO" value={data.system.ioUsage ?? 0} sub="عمليات محجوبة" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <RuntimePanel title="عمليات PM2 الفعلية" empty={data.pm2.available ? 'لا توجد عمليات PM2 قيد التشغيل' : 'PM2 غير متوفر على هذا المضيف'}>
                    {data.pm2.processes.map((proc) => (
                      <React.Fragment key={`${proc.id}-${proc.name}`}>
                        <OperationalRow
                          title={proc.name}
                          meta={`الحالة: ${proc.status || 'غير معروفة'} · المعرف: ${proc.pid || 'غير متوفر'}`}
                          value={`${percent(proc.cpu)} / ${formatBytes(proc.memory)}`}
                        />
                      </React.Fragment>
                    ))}
                  </RuntimePanel>

                  <RuntimePanel title="المنافذ والخدمات النشطة" empty="لا توجد منافذ مستمعة">
                    {data.services.ports.slice(0, 12).map((port) => (
                      <React.Fragment key={`${port.pid}-${port.port}-${port.localAddress}`}>
                        <OperationalRow
                          title={`منفذ ${port.port}`}
                          meta={`${port.protocol} · ${port.localAddress} · ${port.runtime || 'Runtime غير مرتبط'}`}
                          value={port.service ? `${port.service}` : `عملية ${port.pid || 'غير معروفة'}`}
                        />
                      </React.Fragment>
                    ))}
                  </RuntimePanel>

                  <RuntimePanel title="ارتباطات Runtime التشغيلية" empty="لا توجد علاقات Runtime مكتشفة">
                    {data.relationships.slice(0, 12).map((rel) => (
                      <React.Fragment key={`${rel.path}-${rel.runtime}`}>
                        <OperationalRow
                          title={rel.runtime}
                          meta={`${rel.type} · ${rel.path}`}
                          value={rel.pm2Process || rel.domain || rel.port ? `${rel.pm2Process || rel.domain || `منفذ ${rel.port}`}` : 'غير مرتبط'}
                        />
                      </React.Fragment>
                    ))}
                  </RuntimePanel>

                  <RuntimePanel title="النطاقات و Nginx" empty="لا توجد نطاقات Nginx مكتشفة">
                    {data.services.domains.slice(0, 10).map((domain) => (
                      <React.Fragment key={domain.configPath || domain.name}>
                        <OperationalRow
                          title={domain.name}
                          meta={domain.rootPath || domain.configPath || 'بدون مسار جذر'}
                          value={domain.proxyPort ? `منفذ ${domain.proxyPort}` : 'ملف ثابت'}
                        />
                      </React.Fragment>
                    ))}
                  </RuntimePanel>
                </div>
              </section>

              <section className="min-h-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] xl:col-span-4">
                <PanelHeader icon={<GitBranch />} title="مساحة اكتشاف المشاريع" />
                <div className="border-b border-[var(--border-subtle)] px-3 py-2 text-[11px] font-bold text-[var(--text-tertiary)]">
                  الاكتشاف لا يعني الاستيراد. لا يتم إنشاء Runtime إلا بعد موافقة يدوية.
                </div>
                <div className="max-h-full space-y-2 overflow-y-auto p-2.5">
                  {visibleWorkspace.length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-[var(--text-tertiary)]">
                      لا توجد مشاريع مكتشفة قابلة للعرض حاليًا.
                    </div>
                  ) : visibleWorkspace.map((candidate) => (
                    <React.Fragment key={candidate.path}>
                      <RuntimeCandidateCard
                        candidate={candidate}
                        onImport={() => handleImportRuntime(candidate)}
                        onPreview={() => setSelectedCandidate(candidate)}
                        onIgnore={() => setIgnoredPaths((current) => new Set(current).add(candidate.path))}
                        onClassify={(environment) => classifyCandidate(candidate, environment)}
                        onOpenFiles={() => navigate('/files', { state: { project: { name: candidate.name, runtime_path: candidate.path, id: candidate.path } } })}
                        onRuntimeAction={(action) => handleRuntimeAction(candidate, action)}
                      />
                    </React.Fragment>
                  ))}
                </div>
              </section>
            </main>
          </>
        )}
      </div>

      {isServerModalOpen && (
        <ServerProvisioningModal
          form={serverForm}
          isSubmitting={isProvisioning}
          onClose={() => setIsServerModalOpen(false)}
          onSubmit={handleProvisionServer}
          onChange={(patch) => setServerForm((current) => ({ ...current, ...patch }))}
        />
      )}

      {selectedCandidate && (
        <CandidatePreview candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-blue-500">{React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}</div>
        <p className="truncate text-lg font-black text-[var(--text-primary)]">{value}</p>
      </div>
      <p className="mt-1 text-[10px] font-black text-[var(--text-tertiary)]">{label}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-100 px-2 py-1 text-center dark:bg-black/20">
      <p className="text-[9px] font-bold text-[var(--text-tertiary)]">{label}</p>
      <p className="truncate text-[11px] font-black text-[var(--text-primary)]">{value}</p>
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
      <p className="truncate text-lg font-black text-[var(--text-primary)]">{value}</p>
      {sub && <p className="mt-1 truncate text-[10px] font-bold text-[var(--text-tertiary)]">{sub}</p>}
    </div>
  );
}

function PanelHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] p-3">
      <div className="text-blue-500">{React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}</div>
      <h2 className="text-xs font-black text-[var(--text-primary)]">{title}</h2>
    </div>
  );
}

function RuntimePanel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const list = React.Children.toArray(children);
  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
      <PanelHeader icon={<ShieldCheck />} title={title} />
      <div className="max-h-64 overflow-y-auto p-2">
        {list.length > 0 ? list : <div className="p-5 text-center text-xs font-bold text-[var(--text-tertiary)]">{empty}</div>}
      </div>
    </section>
  );
}

function OperationalRow({ title, meta, value }: { title: string; meta: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl p-2.5 hover:bg-slate-100 dark:hover:bg-white/5">
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-[var(--text-primary)]">{title}</p>
        <p className="mt-1 truncate text-[10px] font-bold text-[var(--text-tertiary)]">{meta}</p>
      </div>
      <span className="shrink-0 rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-black text-blue-500">{value}</span>
    </div>
  );
}

function HealthBadge({ value }: { value?: string }) {
  const normalized = value || 'Offline';
  const healthy = normalized === 'Healthy' || normalized === 'healthy' || normalized === 'online';
  const warning = normalized === 'Warning' || normalized === 'degraded';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-black',
      healthy && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
      warning && 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600',
      !healthy && !warning && 'border-red-500/20 bg-red-500/10 text-red-500',
    )}>
      {healthy ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {healthLabels[normalized] || 'متوقف'}
    </span>
  );
}

function RuntimeCandidateCard({
  candidate,
  onImport,
  onPreview,
  onIgnore,
  onClassify,
  onOpenFiles,
  onRuntimeAction,
}: {
  candidate: RuntimeCandidate;
  onImport: () => void;
  onPreview: () => void;
  onIgnore: () => void;
  onClassify: (environment: string) => void;
  onOpenFiles: () => void;
  onRuntimeAction: (action: string) => void;
}) {
  const health = runtimeHealth(candidate);
  return (
    <article className="rounded-xl border border-[var(--border-subtle)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-[var(--text-primary)]">{candidate.name}</h3>
          <p className="mt-1 truncate text-[10px] font-bold text-[var(--text-tertiary)]">{candidate.path}</p>
        </div>
        <HealthBadge value={health} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px] md:grid-cols-4">
        <Info label="النوع" value={candidate.type} />
        <Info label="النطاق" value={candidate.domain || 'غير مرتبط'} />
        <Info label="PM2" value={candidate.pm2Process || 'غير مرتبط'} />
        <Info label="حالة PM2" value={candidate.pm2Status || 'غير متوفر'} />
        <Info label="المصدر" value={sourceLabels[candidate.source || 'Local Runtime'] || 'محلي'} />
        <Info label="CPU" value={percent(candidate.cpu)} />
        <Info label="RAM" value={formatBytes(candidate.ram)} />
        <Info label="Uptime" value={candidate.uptime ? formatDuration((Date.now() - candidate.uptime) / 1000) : 'غير متوفر'} />
        <Info label="إعادة التشغيل" value={candidate.restarts ?? 'غير متوفر'} />
        <Info label="الاستقرار" value={healthLabels[health] || health} />
        <Info label="النشر" value={candidate.deployState === 'Build detected' ? 'بناء موجود' : 'مصدر فقط'} />
        <Info label="SSL" value={candidate.domain ? 'مرتبط بالنطاق' : 'غير مكتشف'} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={cn('rounded-lg border px-2 py-1 text-[10px] font-black', environmentColor(candidate.environment))}>
          {environmentLabels[candidate.environment || 'Development'] || candidate.environment || 'تطوير'}
        </span>
        <select
          value={candidate.environment || 'Development'}
          onChange={(event) => onClassify(event.target.value)}
          className="rounded-lg border border-[var(--border-subtle)] bg-transparent px-2 py-1 text-[10px] font-black text-[var(--text-primary)] outline-none"
        >
          <option value="Production">إنتاج</option>
          <option value="Development">تطوير</option>
          <option value="Staging">اختبار</option>
          <option value="Backup">نسخة احتياطية</option>
          <option value="Snapshot">لقطة</option>
          <option value="Archived">مؤرشف</option>
        </select>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <ActionButton icon={<Plus />} label="استيراد Runtime" onClick={onImport} primary />
        <ActionButton icon={<Eye />} label="معاينة" onClick={onPreview} />
        <ActionButton icon={<RefreshCw />} label="إعادة تشغيل" onClick={() => onRuntimeAction('restart')} />
        <ActionButton icon={<X />} label="إيقاف" onClick={() => onRuntimeAction('stop')} danger />
        <ActionButton icon={<Terminal />} label="السجلات" onClick={() => onRuntimeAction('logs')} />
        <ActionButton icon={<FolderOpen />} label="الملفات" onClick={onOpenFiles} />
        <ActionButton icon={<SquareTerminal />} label="الطرفية" onClick={() => onRuntimeAction('terminal')} />
        <ActionButton icon={<Rocket />} label="نشر" onClick={() => onRuntimeAction('deploy')} />
        <ActionButton icon={<ShieldCheck />} label="الحوكمة" onClick={() => onRuntimeAction('governance')} />
        <ActionButton icon={<Activity />} label="الصحة" onClick={() => onRuntimeAction('health')} />
        <ActionButton icon={<LifeBuoy />} label="التعافي" onClick={() => onRuntimeAction('recovery')} />
        <ActionButton icon={<X />} label="تجاهل" onClick={onIgnore} danger />
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-black/20">
      <p className="font-bold text-[var(--text-tertiary)]">{label}</p>
      <p className="truncate font-black text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick, primary, danger }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[10px] font-black transition',
        primary && 'border-blue-500/20 bg-blue-600 text-white hover:bg-blue-500',
        danger && 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20',
        !primary && !danger && 'border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-white/5',
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'h-3.5 w-3.5' })}
      {label}
    </button>
  );
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
      <div className="text-center text-[var(--text-tertiary)]">
        <div className="mx-auto flex justify-center text-blue-500">{icon}</div>
        <h2 className="mt-3 text-base font-black text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 text-xs font-bold">{text}</p>
      </div>
    </div>
  );
}

function ServerProvisioningModal({
  form,
  isSubmitting,
  onClose,
  onSubmit,
  onChange,
}: {
  form: typeof emptyServerForm;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (patch: Partial<typeof emptyServerForm>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
      <form onSubmit={onSubmit} className="w-full max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[var(--text-primary)]">إضافة سيرفر</h2>
            <p className="mt-1 text-xs font-bold text-[var(--text-tertiary)]">ربط سيرفر تشغيلي ثم تشغيل خط اكتشاف البنية التحتية.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-slate-100 dark:hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="اسم السيرفر" value={form.name} onChange={(value) => onChange({ name: value })} />
          <Field label="عنوان IP" value={form.ip} onChange={(value) => onChange({ ip: value })} dir="ltr" />
          <Field label="منفذ SSH" value={String(form.port)} onChange={(value) => onChange({ port: Number(value) || 22 })} type="number" />
          <Field label="اسم المستخدم" value={form.username} onChange={(value) => onChange({ username: value })} dir="ltr" />

          <label className="space-y-1">
            <span className="text-[11px] font-black text-[var(--text-tertiary)]">طريقة المصادقة</span>
            <select value={form.authType} onChange={(event) => onChange({ authType: event.target.value })} className="w-full rounded-xl border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-sm font-bold text-[var(--text-primary)] outline-none">
              <option value="ssh-key">مفتاح SSH</option>
              <option value="password">كلمة مرور</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-black text-[var(--text-tertiary)]">وضع التشغيل</span>
            <select value={form.env} onChange={(event) => onChange({ env: event.target.value })} className="w-full rounded-xl border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-sm font-bold text-[var(--text-primary)] outline-none">
              <option value="DEV">تطوير</option>
              <option value="STAGING">اختبار</option>
              <option value="LIVE">إنتاج</option>
            </select>
          </label>
        </div>

        <label className="mt-3 block space-y-1">
          <span className="flex items-center gap-2 text-[11px] font-black text-[var(--text-tertiary)]"><Key className="h-3.5 w-3.5" /> بيانات المصادقة</span>
          <textarea
            value={form.credentials}
            onChange={(event) => onChange({ credentials: event.target.value })}
            rows={4}
            dir="ltr"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-sm font-bold text-[var(--text-primary)] outline-none"
            placeholder="SSH key أو كلمة المرور حسب الطريقة المختارة"
          />
        </label>

        <label className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] p-3 text-xs font-black text-[var(--text-primary)]">
          <input type="checkbox" checked={form.autoDiscovery} onChange={(event) => onChange({ autoDiscovery: event.target.checked })} />
          تشغيل الاكتشاف التلقائي بعد الربط
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-black text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-white/5">
            إلغاء
          </button>
          <button disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-500 disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" />
            {isSubmitting ? 'جاري الربط' : 'ربط وتشغيل الاكتشاف'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', dir = 'rtl' }: { label: string; value: string; onChange: (value: string) => void; type?: string; dir?: 'rtl' | 'ltr' }) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-black text-[var(--text-tertiary)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        dir={dir}
        className="w-full rounded-xl border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-sm font-bold text-[var(--text-primary)] outline-none"
      />
    </label>
  );
}

function CandidatePreview({ candidate, onClose }: { candidate: RuntimeCandidate; onClose: () => void }) {
  const markers = candidate.markers || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[var(--text-primary)]">{candidate.name}</h2>
            <p className="mt-1 break-all text-xs font-bold text-[var(--text-tertiary)]">{candidate.path}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-slate-100 dark:hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Info label="النوع" value={candidate.type} />
          <Info label="الصحة" value={healthLabels[runtimeHealth(candidate)] || runtimeHealth(candidate)} />
          <Info label="PM2" value={candidate.pm2Process || 'غير مرتبط'} />
          <Info label="النطاق" value={candidate.domain || 'غير مرتبط'} />
          <Info label="آخر نشر" value={candidate.lastDeploy ? new Date(candidate.lastDeploy).toLocaleString('ar-SA') : 'غير متوفر'} />
          <Info label="الحجم" value={formatBytes(candidate.sizeBytes)} />
        </div>
        <div className="mt-4 rounded-xl border border-[var(--border-subtle)] p-3">
          <h3 className="text-xs font-black text-[var(--text-primary)]">إشارات الاكتشاف</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(markers).filter(([, value]) => value).map(([key]) => (
              <span key={key} className="rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-black text-blue-500">{key}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
