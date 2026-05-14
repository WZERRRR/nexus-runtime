import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, Database, FileCode2, GitBranch, Globe, LayoutGrid, LifeBuoy, ListTree, MonitorCog, Rocket, ScrollText, ShieldCheck, TerminalSquare } from 'lucide-react';
import { runtimeAPI } from '../services/runtimeApi';

type WorkspaceTabId =
  | 'overview'
  | 'filesystem'
  | 'terminal'
  | 'pm2'
  | 'deploy'
  | 'monitoring'
  | 'logs'
  | 'git'
  | 'environments'
  | 'database'
  | 'apis'
  | 'governance'
  | 'recovery';

const WORKSPACE_TABS: Array<{ id: WorkspaceTabId; label: string; icon: React.ReactNode; route: string }> = [
  { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" />, route: '' },
  { id: 'filesystem', label: 'Filesystem', icon: <FileCode2 className="w-4 h-4" />, route: '/files' },
  { id: 'terminal', label: 'Terminal', icon: <TerminalSquare className="w-4 h-4" />, route: '/terminal' },
  { id: 'pm2', label: 'PM2', icon: <ListTree className="w-4 h-4" />, route: '/pm2' },
  { id: 'deploy', label: 'Deploy', icon: <Rocket className="w-4 h-4" />, route: '/deploy' },
  { id: 'monitoring', label: 'Monitoring', icon: <Activity className="w-4 h-4" />, route: '/monitoring' },
  { id: 'logs', label: 'Logs', icon: <ScrollText className="w-4 h-4" />, route: '/logs' },
  { id: 'git', label: 'Git', icon: <GitBranch className="w-4 h-4" />, route: '/projects' },
  { id: 'environments', label: 'Environments', icon: <Globe className="w-4 h-4" />, route: '/environments' },
  { id: 'database', label: 'Database', icon: <Database className="w-4 h-4" />, route: '/database' },
  { id: 'apis', label: 'APIs', icon: <MonitorCog className="w-4 h-4" />, route: '/apis' },
  { id: 'governance', label: 'Governance', icon: <ShieldCheck className="w-4 h-4" />, route: '/governance' },
  { id: 'recovery', label: 'Recovery', icon: <LifeBuoy className="w-4 h-4" />, route: '/backup' },
];

export function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [environmentBindings, setEnvironmentBindings] = useState<any[]>([]);
  const [pm2Processes, setPm2Processes] = useState<any[]>([]);
  const [runtimeMetrics, setRuntimeMetrics] = useState<any>(null);
  const [runtimeLogs, setRuntimeLogs] = useState<any[]>([]);
  const [runtimeEvents, setRuntimeEvents] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const loadOperationalData = async (resolvedProject: any) => {
    const runtimeId = String(resolvedProject?.runtime_id || resolvedProject?.id || '');
    const [envs, pm2, metrics, logs, events] = await Promise.all([
      runtimeAPI.getProjectEnvironmentBindings(resolvedProject.id).catch(() => []),
      runtimeAPI.getPM2Processes(undefined, runtimeId).catch(() => []),
      runtimeAPI.getMetrics(runtimeId).catch(() => null),
      runtimeAPI.getLogs(runtimeId).catch(() => []),
      runtimeAPI.getEvents(runtimeId, 40).catch(() => []),
    ]);

    setEnvironmentBindings(Array.isArray(envs) ? envs : []);
    setPm2Processes(Array.isArray(pm2) ? pm2 : []);
    setRuntimeMetrics(metrics || null);
    setRuntimeLogs(Array.isArray(logs) ? logs : []);
    setRuntimeEvents(Array.isArray(events) ? events : []);
    setLastSync(new Date().toISOString());
  };

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Project ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const projects = await runtimeAPI.getProjects();
        const resolved = (projects || []).find((p: any) => String(p.id) === String(id));
        if (!resolved) {
          setError('المشروع غير موجود');
          return;
        }
        setProject(resolved);
        await loadOperationalData(resolved);
      } catch {
        setError('تعذر تحميل بيانات المشروع');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!project) return;
    const timer = setInterval(async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await loadOperationalData(project);
      } finally {
        inFlightRef.current = false;
      }
    }, 15000);

    return () => clearInterval(timer);
  }, [project]);

  const runtimeStatus = useMemo(() => {
    if (!project) return 'UNKNOWN';
    return String(project.status || 'unknown').toUpperCase();
  }, [project]);

  const healthyBindings = useMemo(
    () => environmentBindings.filter((item) => item?.validated).length,
    [environmentBindings]
  );

  const activeBinding = useMemo(() => {
    return environmentBindings.find((item) => item?.validated) || environmentBindings[0] || null;
  }, [environmentBindings]);

  const onlinePm2Count = useMemo(() => {
    return pm2Processes.filter((p) => String(p?.status || '').toLowerCase() === 'online').length;
  }, [pm2Processes]);

  const healthLabel = useMemo(() => {
    if (!runtimeMetrics && pm2Processes.length === 0) return 'UNKNOWN';
    if (pm2Processes.length > 0 && onlinePm2Count === 0) return 'WARNING';
    if (activeBinding && !activeBinding.validated) return 'WARNING';
    return 'HEALTHY';
  }, [runtimeMetrics, pm2Processes, onlinePm2Count, activeBinding]);

  const runtimeFeed = useMemo(() => {
    const merged = [...runtimeEvents, ...runtimeLogs];
    return merged.slice(0, 40);
  }, [runtimeEvents, runtimeLogs]);

  const handleRefresh = async () => {
    if (!project || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await loadOperationalData(project);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return <div className="text-slate-400 text-sm">جاري تحميل Runtime Workspace...</div>;
  }

  if (error || !project) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-slate-200 dark:border-slate-800/50">
        <p className="text-red-400 font-bold">{error || 'تعذر تحميل المشروع'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-1">Runtime Project Workspace</p>
            <h1 className="text-xl md:text-2xl font-black text-white">{project.name}</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh Runtime'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 text-xs">
          <MetricCard label="Runtime Status" value={runtimeStatus} />
          <MetricCard label="Runtime Health" value={healthLabel} />
          <MetricCard label="Runtime Type" value={project.type || project.runtime_type || 'N/A'} />
          <MetricCard label="PM2 Status" value={`${onlinePm2Count} / ${pm2Processes.length} online`} />
          <MetricCard label="Active Port" value={activeBinding?.runtimePort || 'N/A'} />
          <MetricCard label="Domain / SSL" value={`${activeBinding?.realDomain || 'N/A'} / ${activeBinding?.sslState || 'N/A'}`} />
          <MetricCard label="Git Branch" value={project.git_branch || 'N/A'} />
          <MetricCard label="Runtime Path" value={project.runtime_path || 'N/A'} mono />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-2 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800/50 p-3 h-fit">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-2">Operational Modules</p>
          <div className="space-y-1">
            {WORKSPACE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'overview' && tab.route) {
                    navigate(tab.route, { state: { project } });
                  }
                }}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-3">Active Workspace</p>
            {activeTab === 'overview' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 p-3">
                  <p className="text-xs text-slate-500 mb-1">Environment Bindings</p>
                  {environmentBindings.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">لا توجد بيانات تشغيلية حالياً</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-auto pr-1">
                      {environmentBindings.map((env, idx) => (
                        <div key={`${env?.name || 'env'}-${idx}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{env?.realDomain || 'N/A'}</p>
                          <p className="text-[11px] text-slate-500 truncate">{env?.pm2Process || 'N/A'} / Port {env?.runtimePort || 'N/A'}</p>
                          <p className="text-[11px] text-slate-500 truncate">{env?.runtimePath || 'N/A'}</p>
                          <p className="text-[11px] text-slate-500">Validation: {env?.validated ? 'Validated' : 'Unbound'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 p-3">
                  <p className="text-xs text-slate-500 mb-1">PM2 Runtime Processes</p>
                  {pm2Processes.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">لا توجد بيانات تشغيلية حالياً</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-auto pr-1">
                      {pm2Processes.map((proc: any) => (
                        <div key={`${proc.id}-${proc.name}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{proc.name}</p>
                          <p className="text-[11px] text-slate-500">Status: {proc.status || 'unknown'} | CPU: {proc.cpu || 'N/A'} | RAM: {proc.ram || 'N/A'}</p>
                          <p className="text-[11px] text-slate-500 truncate">Port: {proc.port || 'N/A'} | Path: {proc.path || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 p-4">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">هذا الموديول يعمل ضمن Runtime Context الحالي للمشروع.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Project: {project.name} | Runtime ID: {project.runtime_id || project.id} | Path: {project.runtime_path || 'N/A'} | Environment: {project.env || 'N/A'}
                </p>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-2">Runtime Events / Logs</p>
            <div className="space-y-2 max-h-56 overflow-auto pr-1">
              {runtimeFeed.map((item: any, idx: number) => (
                <div key={`${item?.id || idx}-${item?.timestamp || idx}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 bg-white dark:bg-slate-900/40">
                  <p className="text-[11px] text-slate-500">{item?.timestamp || 'N/A'}</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item?.type || item?.level || 'event'}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{item?.message || item?.title || 'N/A'}</p>
                </div>
              ))}
              {runtimeFeed.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">لا توجد بيانات تشغيلية حالياً</p>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4 h-fit">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-2">Runtime Intelligence</p>
          <div className="space-y-2">
            <MetricPanel label="Runtime Health" value={healthLabel} />
            <MetricPanel label="PM2 Stability" value={`${onlinePm2Count} / ${pm2Processes.length} online`} />
            <MetricPanel label="Infrastructure State" value={activeBinding?.nginxBinding ? 'Bound' : 'Unbound'} />
            <MetricPanel label="Runtime Alerts" value={healthLabel === 'WARNING' ? 'Operational warning detected' : 'No critical alerts'} />
            <MetricPanel
              label="Telemetry"
              value={`CPU: ${runtimeMetrics?.cpu?.usagePercent ?? 'N/A'} | RAM: ${runtimeMetrics?.ram?.usagePercent ?? 'N/A'}`}
            />
            <MetricPanel label="Last Sync" value={lastSync ? new Date(lastSync).toLocaleString() : 'N/A'} />
            <MetricPanel label="Validated Environments" value={`${healthyBindings} / ${environmentBindings.length}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
      <p className="text-slate-500">{label}</p>
      <p className={`text-slate-700 dark:text-slate-200 font-bold truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function MetricPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-white/10 p-2 bg-white dark:bg-slate-900/40">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}
