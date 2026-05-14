import React, { useEffect, useMemo, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [environmentBindings, setEnvironmentBindings] = useState<any[]>([]);
  const [pm2Processes, setPm2Processes] = useState<any[]>([]);

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

        const runtimeId = resolved?.runtime_id || resolved?.id;
        const [envs, pm2] = await Promise.all([
          runtimeAPI.getProjectEnvironmentBindings(resolved.id).catch(() => []),
          runtimeAPI.getPM2Processes(undefined, String(runtimeId)).catch(() => []),
        ]);
        setEnvironmentBindings(Array.isArray(envs) ? envs : []);
        setPm2Processes(Array.isArray(pm2) ? pm2 : []);
      } catch {
        setError('تعذر تحميل بيانات المشروع');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const runtimeStatus = useMemo(() => {
    if (!project) return 'UNKNOWN';
    return String(project.status || 'unknown').toUpperCase();
  }, [project]);

  const healthyBindings = useMemo(
    () => environmentBindings.filter((item) => item?.validated).length,
    [environmentBindings]
  );

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
    <div className="space-y-5 pb-8">
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800/50 p-5 md:p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 mb-2">Runtime Project Workspace</p>
        <h1 className="text-xl md:text-2xl font-black text-white">{project.name}</h1>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
            <p className="text-slate-500">Runtime Type</p>
            <p className="text-slate-700 dark:text-slate-200 font-bold">{project.type || project.runtime_type || 'N/A'}</p>
          </div>
          <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
            <p className="text-slate-500">Environment</p>
            <p className="text-slate-700 dark:text-slate-200 font-bold">{project.env || 'UNVERIFIED'}</p>
          </div>
          <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
            <p className="text-slate-500">Runtime Status</p>
            <p className="text-slate-700 dark:text-slate-200 font-bold">{runtimeStatus}</p>
          </div>
          <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
            <p className="text-slate-500">Runtime Path</p>
            <p className="text-slate-700 dark:text-slate-200 font-mono truncate">{project.runtime_path || 'N/A'}</p>
          </div>
          <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
            <p className="text-slate-500">PM2 Processes</p>
            <p className="text-slate-700 dark:text-slate-200 font-bold">{pm2Processes.length}</p>
          </div>
          <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
            <p className="text-slate-500">Validated Environments</p>
            <p className="text-slate-700 dark:text-slate-200 font-bold">
              {healthyBindings} / {environmentBindings.length}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-3">Runtime Environment Bindings</p>
        {environmentBindings.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">لا توجد بيانات تشغيلية حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {environmentBindings.map((env, idx) => (
              <div key={`${env?.name || 'env'}-${idx}`} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 p-3 space-y-1">
                <p className="text-xs text-slate-500">Domain</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{env?.realDomain || 'N/A'}</p>
                <p className="text-xs text-slate-500">PM2 / Port</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{env?.pm2Process || 'N/A'} / {env?.runtimePort || 'N/A'}</p>
                <p className="text-xs text-slate-500">Path</p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">{env?.runtimePath || 'N/A'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (!tab.route) return;
                navigate(tab.route, { state: { project } });
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
