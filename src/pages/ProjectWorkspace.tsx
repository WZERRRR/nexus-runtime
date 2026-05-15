import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
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

const WORKSPACE_TABS: Array<{ id: WorkspaceTabId; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'filesystem', label: 'Filesystem', icon: <FileCode2 className="w-4 h-4" /> },
  { id: 'terminal', label: 'Terminal', icon: <TerminalSquare className="w-4 h-4" /> },
  { id: 'pm2', label: 'PM2', icon: <ListTree className="w-4 h-4" /> },
  { id: 'deploy', label: 'Deploy', icon: <Rocket className="w-4 h-4" /> },
  { id: 'monitoring', label: 'Monitoring', icon: <Activity className="w-4 h-4" /> },
  { id: 'logs', label: 'Logs', icon: <ScrollText className="w-4 h-4" /> },
  { id: 'git', label: 'Git', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'environments', label: 'Environments', icon: <Globe className="w-4 h-4" /> },
  { id: 'database', label: 'Database', icon: <Database className="w-4 h-4" /> },
  { id: 'apis', label: 'APIs', icon: <MonitorCog className="w-4 h-4" /> },
  { id: 'governance', label: 'Governance', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'recovery', label: 'Recovery', icon: <LifeBuoy className="w-4 h-4" /> },
];

type TimelineFilter = 'all' | 'approval' | 'mutation' | 'deploy' | 'recovery';

export function ProjectWorkspace() {
  const { id } = useParams();

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
  const [deployments, setDeployments] = useState<any[]>([]);
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [governanceEvents, setGovernanceEvents] = useState<any[]>([]);
  const [runtimeApprovals, setRuntimeApprovals] = useState<any[]>([]);
  const [pendingMutations, setPendingMutations] = useState<any[]>([]);
  const [mutationTimeline, setMutationTimeline] = useState<any[]>([]);
  const [readinessReport, setReadinessReport] = useState<any | null>(null);
  const [readinessDrillRunning, setReadinessDrillRunning] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [operationNotice, setOperationNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [filesystemItems, setFilesystemItems] = useState<any[]>([]);
  const [filesystemLoading, setFilesystemLoading] = useState(false);
  const [filesystemQuery, setFilesystemQuery] = useState('');

  const inFlightRef = useRef(false);

  const loadOperationalData = async (resolvedProject: any) => {
    const runtimeId = String(resolvedProject?.runtime_id || resolvedProject?.id || '');
    const [envs, pm2, metrics, logs, events, deployRows, recoveryRows, governanceRows, approvalsRows, pendingRows, mutationTimelineRows, readiness] = await Promise.all([
      runtimeAPI.getProjectEnvironmentBindings(resolvedProject.id).catch(() => []),
      runtimeAPI.getPM2Processes(undefined, runtimeId).catch(() => []),
      runtimeAPI.getMetrics(runtimeId).catch(() => null),
      runtimeAPI.getLogs(runtimeId).catch(() => []),
      runtimeAPI.getEvents(runtimeId, 40).catch(() => []),
      runtimeAPI.getRuntimeDeployments(runtimeId).catch(() => []),
      runtimeAPI.getRuntimeRecoveries(runtimeId).catch(() => []),
      runtimeAPI.getGovernanceActions().catch(() => []),
      runtimeAPI.getRuntimeApprovals(runtimeId).catch(() => []),
      runtimeAPI.getRuntimePendingMutations(runtimeId).catch(() => []),
      runtimeAPI.getRuntimeMutationTimeline(runtimeId, 160).catch(() => []),
      runtimeAPI.getRuntimeReadinessReport(runtimeId).catch(() => null),
    ]);

    setEnvironmentBindings(Array.isArray(envs) ? envs : []);
    setPm2Processes(Array.isArray(pm2) ? pm2 : []);
    setRuntimeMetrics(metrics || null);
    setRuntimeLogs(Array.isArray(logs) ? logs : []);
    setRuntimeEvents(Array.isArray(events) ? events : []);
    setDeployments(Array.isArray(deployRows) ? deployRows : []);
    setRecoveries(Array.isArray(recoveryRows) ? recoveryRows : []);
    setGovernanceEvents(Array.isArray(governanceRows) ? governanceRows : []);
    setRuntimeApprovals(Array.isArray(approvalsRows) ? approvalsRows : []);
    setPendingMutations(Array.isArray(pendingRows) ? pendingRows : []);
    setMutationTimeline(Array.isArray(mutationTimelineRows) ? mutationTimelineRows : []);
    setReadinessReport(readiness || null);
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

  useEffect(() => {
    const loadFilesystem = async () => {
      if (!project || activeTab !== 'filesystem') return;
      setFilesystemLoading(true);
      try {
        const items = await runtimeAPI.listFiles('.', project.runtime_path, project.id);
        setFilesystemItems(Array.isArray(items) ? items : []);
      } catch {
        setFilesystemItems([]);
      } finally {
        setFilesystemLoading(false);
      }
    };
    loadFilesystem();
  }, [activeTab, project]);

  const runtimeStatus = useMemo(() => String(project?.status || 'unknown').toUpperCase(), [project]);

  const healthyBindings = useMemo(() => environmentBindings.filter((item) => item?.validated).length, [environmentBindings]);

  const activeBinding = useMemo(() => environmentBindings.find((item) => item?.validated) || environmentBindings[0] || null, [environmentBindings]);

  const onlinePm2Count = useMemo(() => pm2Processes.filter((p) => String(p?.status || '').toLowerCase() === 'online').length, [pm2Processes]);
  const activeTabLabel = useMemo(() => WORKSPACE_TABS.find((tab) => tab.id === activeTab)?.label || 'Workspace', [activeTab]);
  const filesystemStats = useMemo(() => {
    const files = filesystemItems.filter((item) => !item?.isDirectory).length;
    const dirs = filesystemItems.filter((item) => !!item?.isDirectory).length;
    return { files, dirs, total: filesystemItems.length };
  }, [filesystemItems]);
  const filteredFilesystemItems = useMemo(() => {
    const q = filesystemQuery.trim().toLowerCase();
    if (!q) return filesystemItems;
    return filesystemItems.filter((item) => String(item?.name || item?.path || '').toLowerCase().includes(q));
  }, [filesystemItems, filesystemQuery]);

  const healthLabel = useMemo(() => {
    if (!runtimeMetrics && pm2Processes.length === 0) return 'UNKNOWN';
    if (pm2Processes.length > 0 && onlinePm2Count === 0) return 'WARNING';
    if (activeBinding && !activeBinding.validated) return 'WARNING';
    return 'HEALTHY';
  }, [runtimeMetrics, pm2Processes, onlinePm2Count, activeBinding]);

  const unifiedTimeline = useMemo(() => {
    if (mutationTimeline.length > 0) {
      const rows = mutationTimeline.map((row: any, idx: number) => ({
        id: row?.correlationId || `mutation-${idx}`,
        type: row?.source || 'mutation',
        title: row?.title || row?.stage || 'Runtime Mutation',
        message: row?.message || '',
        status: row?.status || 'UNKNOWN',
        timestamp: row?.timestamp || null,
      }));
      if (timelineFilter === 'all') return rows.slice(0, 120);
      return rows.filter((row) => row.type === timelineFilter).slice(0, 120);
    }

    const runtimeRows = runtimeEvents.map((row: any, idx: number) => ({
      id: `runtime-${row?.id || idx}`,
      type: 'runtime' as const,
      title: row?.event_type || row?.type || 'Runtime Event',
      message: row?.message || row?.event || '',
      status: row?.severity || row?.level || 'info',
      timestamp: row?.created_at || row?.timestamp || null,
    }));

    const deployRows = deployments.map((row: any, idx: number) => ({
      id: `deploy-${row?.id || row?.deployment_id || idx}`,
      type: 'deploy' as const,
      title: row?.deploy_strategy || 'Deploy',
      message: row?.deploy_status || row?.status || 'unknown',
      status: row?.risk_level || row?.deploy_status || 'info',
      timestamp: row?.created_at || row?.updated_at || row?.timestamp || null,
    }));

    const recoveryRows = recoveries.map((row: any, idx: number) => ({
      id: `recovery-${row?.recovery_id || row?.id || idx}`,
      type: 'recovery' as const,
      title: row?.recovery_type || 'Recovery',
      message: row?.recovery_status || row?.status || 'unknown',
      status: row?.risk_level || row?.recovery_status || 'info',
      timestamp: row?.created_at || row?.updated_at || row?.timestamp || null,
    }));

    const governanceRows = governanceEvents.map((row: any, idx: number) => ({
      id: `gov-${row?.id || idx}`,
      type: 'governance' as const,
      title: row?.action_type || row?.event_type || 'Governance Action',
      message: row?.target || row?.details || row?.status || '',
      status: row?.status || 'info',
      timestamp: row?.created_at || row?.timestamp || null,
    }));

    const rows = [...runtimeRows, ...deployRows, ...recoveryRows, ...governanceRows]
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    if (timelineFilter === 'all') return rows.slice(0, 120);
    return rows.filter((row) => row.type === timelineFilter).slice(0, 120);
  }, [mutationTimeline, runtimeEvents, deployments, recoveries, governanceEvents, timelineFilter]);

  const terminalContext = useMemo(() => `${project?.name || 'runtime'}:${project?.runtime_path || '.'}`, [project]);

  const handleRefresh = async () => {
    if (!project || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await loadOperationalData(project);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTerminalCommand = async () => {
    const cmd = terminalInput.trim();
    if (!cmd || terminalRunning || !project) return;
    setTerminalRunning(true);
    setTerminalOutput((prev) => [...prev, `> ${cmd}`]);
    setTerminalInput('');
    try {
      const res = await runtimeAPI.executeTerminalCommand(cmd, project.runtime_path || undefined, project.id);
      if (res?.success && res.data) {
        if (res.data.stdout) setTerminalOutput((prev) => [...prev, res.data!.stdout]);
        if (res.data.stderr) setTerminalOutput((prev) => [...prev, res.data!.stderr]);
      } else {
        setTerminalOutput((prev) => [...prev, res?.message || 'لا توجد بيانات تشغيلية حالياً']);
      }
    } catch {
      setTerminalOutput((prev) => [...prev, 'خطأ أثناء تنفيذ الأمر']);
    } finally {
      setTerminalRunning(false);
    }
  };

  const handleApprovalDecision = async (approvalId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!project) return;
    const runtimeId = String(project?.runtime_id || project?.id || '');
    try {
      const result = await runtimeAPI.reviewRuntimeApproval(runtimeId, approvalId, status, 'Admin', `Decision from workspace: ${status}`);
      if (!result?.success) {
        setOperationNotice({ type: 'error', message: result?.message || 'فشل تحديث الموافقة التشغيلية' });
        return;
      }
      setOperationNotice({ type: 'success', message: status === 'APPROVED' ? 'تمت الموافقة وتنفيذ العملية' : 'تم رفض العملية التشغيلية' });
      await loadOperationalData(project);
    } catch {
      setOperationNotice({ type: 'error', message: 'تعذر تحديث حالة الموافقة' });
    }
  };

  const handleReplayMutation = async (approvalId: string, nonce?: string) => {
    if (!project) return;
    const runtimeId = String(project?.runtime_id || project?.id || '');
    if (!nonce) {
      setOperationNotice({ type: 'error', message: 'تعذر إعادة التنفيذ: nonce غير متوفر' });
      return;
    }
    try {
      const result = await runtimeAPI.replayApprovedMutation(runtimeId, approvalId, 'Runtime replay requested from workspace', nonce, 'Admin');
      if (!result?.success) {
        const code = String(result?.error_code || '');
        if (code === 'REPLAY_LIMIT_REACHED') setOperationNotice({ type: 'error', message: 'تم الوصول للحد الأقصى لإعادة التنفيذ لهذه العملية' });
        else if (code === 'REPLAY_POLICY_GATE') setOperationNotice({ type: 'error', message: 'إعادة التنفيذ محظورة بسبب صلاحيات الحوكمة' });
        else if (code === 'REPLAY_WINDOW_EXPIRED') setOperationNotice({ type: 'error', message: 'انتهت نافذة إعادة التنفيذ لهذه العملية' });
        else if (code === 'NONCE_MISMATCH') setOperationNotice({ type: 'error', message: 'فشل تحقق nonce: إعادة التنفيذ مرفوضة' });
        else if (code === 'NONCE_REQUIRED') setOperationNotice({ type: 'error', message: 'لا يمكن إعادة التنفيذ بدون nonce صالح' });
        else if (code === 'PAYLOAD_INTEGRITY_GATE') setOperationNotice({ type: 'error', message: 'فشل تحقق سلامة الحمولة التشغيلية' });
        else if (code === 'APPROVAL_GATE') setOperationNotice({ type: 'error', message: 'لا يمكن إعادة التنفيذ قبل اعتماد العملية' });
        else setOperationNotice({ type: 'error', message: result?.message || 'فشل إعادة تنفيذ العملية' });
        return;
      }
      setOperationNotice({ type: 'success', message: 'تمت إعادة تنفيذ العملية بنجاح' });
      await loadOperationalData(project);
    } catch {
      setOperationNotice({ type: 'error', message: 'تعذر تنفيذ طلب Replay' });
    }
  };

  const handleReadinessDrill = async () => {
    if (!project || readinessDrillRunning) return;
    const runtimeId = String(project?.runtime_id || project?.id || '');
    setReadinessDrillRunning(true);
    try {
      const result = await runtimeAPI.runRuntimeReadinessDrill(runtimeId);
      setReadinessReport((prev: any) => ({
        ...(prev || {}),
        readinessScore: result?.score ?? prev?.readinessScore ?? 0,
        status: result?.status ?? prev?.status ?? 'UNKNOWN',
        checks: result?.checks ?? prev?.checks ?? {},
        generatedAt: result?.generatedAt || new Date().toISOString(),
      }));
      setOperationNotice({ type: 'success', message: `Readiness Drill: ${result?.status || 'COMPLETED'} (${result?.score ?? 'N/A'}%)` });
      await loadOperationalData(project);
    } catch (e: any) {
      setOperationNotice({ type: 'error', message: e?.message || 'فشل تنفيذ Readiness Drill' });
    } finally {
      setReadinessDrillRunning(false);
    }
  };

  if (isLoading) {
    return <div className="text-slate-400 text-sm">جاري تحميل Runtime Workspace...</div>;
  }

  if (error || !project) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-slate-200 dark:border-slate-800/50">
        <p className="text-red-400 font-bold">{error || 'تعذر تحميل المشروع'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6 text-right" dir="rtl">
      <div className="glass-panel rounded-xl border border-slate-200 dark:border-slate-800/50 p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">Operational Runtime IDE Workspace</p>
            <h1 className="text-lg md:text-xl font-black text-white">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLeftCollapsed((v) => !v)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50">
              {leftCollapsed ? 'إظهار الوحدات' : 'طي الوحدات'}
            </button>
            <button onClick={() => setRightCollapsed((v) => !v)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50">
              {rightCollapsed ? 'إظهار المراقبة' : 'طي المراقبة'}
            </button>
            <button onClick={handleRefresh} disabled={isRefreshing} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/50 disabled:opacity-60">
              {isRefreshing ? 'تحديث...' : 'تحديث'}
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-1.5 text-[11px]">
          <MetricCard label="Runtime Status" value={runtimeStatus} />
          <MetricCard label="Runtime Health" value={healthLabel} />
          <MetricCard label="Runtime Type" value={project.type || project.runtime_type || 'N/A'} />
          <MetricCard label="PM2 Status" value={`${onlinePm2Count} / ${pm2Processes.length} online`} />
          <MetricCard label="Active Port" value={activeBinding?.runtimePort || 'N/A'} />
          <MetricCard label="Domain / SSL" value={`${activeBinding?.realDomain || 'N/A'} / ${activeBinding?.sslState || 'N/A'}`} />
          <MetricCard label="Git Branch" value={project.git_branch || 'N/A'} />
          <MetricCard label="Runtime Path" value={project.runtime_path || 'N/A'} mono />
        </div>
        {operationNotice && (
          <div className={`mt-3 rounded-lg border px-3 py-2 text-xs font-semibold ${
            operationNotice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}>
            {operationNotice.message}
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-3 ${leftCollapsed && rightCollapsed ? 'xl:grid-cols-1' : leftCollapsed || rightCollapsed ? 'xl:grid-cols-10' : 'xl:grid-cols-12'}`}>
        {!leftCollapsed && (
          <div className="xl:col-span-2 glass-panel rounded-xl border border-slate-200 dark:border-slate-800/50 p-2 h-fit">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-2">Operational Modules</p>
            <div className="space-y-1">
              {WORKSPACE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
        )}

        <div className={`${leftCollapsed && rightCollapsed ? 'xl:col-span-1' : leftCollapsed || rightCollapsed ? 'xl:col-span-7' : 'xl:col-span-7'} space-y-3`}>
          <div className="glass-panel rounded-xl border border-slate-200 dark:border-slate-800/50 p-3">
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
                <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400 mt-3">Module: {activeTabLabel}</p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                    <p className="text-[10px] text-slate-500">PM2</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{onlinePm2Count} / {pm2Processes.length} online</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                    <p className="text-[10px] text-slate-500">Bindings</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{healthyBindings} / {environmentBindings.length} validated</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                    <p className="text-[10px] text-slate-500">Telemetry</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{runtimeMetrics ? 'Connected' : 'No live data'}</p>
                  </div>
                </div>
                <div className="mt-3">
                  {activeTab === 'pm2' && (
                    <div className="space-y-2 max-h-52 overflow-auto pr-1">
                      {pm2Processes.length === 0 ? (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا توجد بيانات تشغيلية حالياً</p>
                      ) : pm2Processes.map((proc: any) => (
                        <div key={`${proc.id}-${proc.name}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{proc.name}</p>
                          <p className="text-[11px] text-slate-500">Status: {proc.status || 'unknown'} | CPU: {proc.cpu || 'N/A'} | RAM: {proc.ram || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'logs' && (
                    <div className="space-y-2 max-h-52 overflow-auto pr-1">
                      {runtimeLogs.length === 0 ? (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا توجد بيانات تشغيلية حالياً</p>
                      ) : runtimeLogs.slice(0, 30).map((log: any, idx: number) => (
                        <div key={`${log.id || idx}-${log.timestamp || ''}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2">
                          <p className="text-[11px] text-slate-500">{log.timestamp || 'N/A'} | {log.type || 'info'}</p>
                          <p className="text-xs text-slate-700 dark:text-slate-200 break-words">{log.message || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'deploy' && (
                    <div className="space-y-2 max-h-52 overflow-auto pr-1">
                      {deployments.length === 0 ? (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا توجد بيانات تشغيلية حالياً</p>
                      ) : deployments.slice(0, 30).map((row: any, idx: number) => (
                        <div key={`${row.id || row.deployment_id || idx}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.deploy_strategy || 'Deploy'}</p>
                          <p className="text-[11px] text-slate-500">Status: {row.deploy_status || row.status || 'unknown'} | Risk: {row.risk_level || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'recovery' && (
                    <div className="space-y-2 max-h-52 overflow-auto pr-1">
                      {recoveries.length === 0 ? (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا توجد بيانات تشغيلية حالياً</p>
                      ) : recoveries.slice(0, 30).map((row: any, idx: number) => (
                        <div key={`${row.recovery_id || row.id || idx}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.recovery_type || 'Recovery'}</p>
                          <p className="text-[11px] text-slate-500">Status: {row.recovery_status || row.status || 'unknown'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'environments' && (
                    <div className="space-y-2 max-h-52 overflow-auto pr-1">
                      {environmentBindings.length === 0 ? (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا توجد بيانات تشغيلية حالياً</p>
                      ) : environmentBindings.map((env, idx) => (
                        <div key={`${env?.name || 'env'}-${idx}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{env?.name || env?.environment || 'ENV'}</p>
                          <p className="text-[11px] text-slate-500">Domain: {env?.realDomain || 'N/A'} | Port: {env?.runtimePort || 'N/A'} | SSL: {env?.sslState || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'governance' && (
                    <div className="space-y-2 max-h-52 overflow-auto pr-1">
                      {governanceEvents.length === 0 ? (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا توجد بيانات تشغيلية حالياً</p>
                      ) : governanceEvents.slice(0, 30).map((row: any, idx: number) => (
                        <div key={`${row.id || idx}-${row.created_at || ''}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.action_type || row.event_type || 'Governance Action'}</p>
                          <p className="text-[11px] text-slate-500">Status: {row.status || 'N/A'} | Target: {row.target || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'filesystem' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                          <p className="text-[10px] text-slate-500">Total</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{filesystemStats.total}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                          <p className="text-[10px] text-slate-500">Directories</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{filesystemStats.dirs}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                          <p className="text-[10px] text-slate-500">Files</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{filesystemStats.files}</p>
                        </div>
                        <input
                          value={filesystemQuery}
                          onChange={(e) => setFilesystemQuery(e.target.value)}
                          placeholder="بحث داخل الملفات"
                          className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-100 outline-none"
                        />
                      </div>
                      <div className="space-y-2 max-h-52 overflow-auto pr-1">
                      {filesystemLoading ? (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">جاري تحميل بيانات الملفات التشغيلية...</p>
                      ) : filteredFilesystemItems.length === 0 ? (
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا توجد بيانات تشغيلية حالياً</p>
                      ) : filteredFilesystemItems.slice(0, 40).map((item: any, idx: number) => (
                        <div key={`${item.path || item.name || 'item'}-${idx}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-500">{item.isDirectory ? 'DIR' : 'FILE'}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item.name || item.path}</span>
                        </div>
                      ))}
                    </div>
                    </div>
                  )}
                  {activeTab === 'monitoring' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                        <p className="text-[10px] text-slate-500">CPU</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{runtimeMetrics?.cpu?.usagePercent ?? 'N/A'}%</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                        <p className="text-[10px] text-slate-500">RAM</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{runtimeMetrics?.ram?.usagePercent ?? 'N/A'}%</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                        <p className="text-[10px] text-slate-500">Disk</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{runtimeMetrics?.disk?.usagePercent ?? 'N/A'}%</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                        <p className="text-[10px] text-slate-500">Network</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{runtimeMetrics?.network?.status || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                        <p className="text-[10px] text-slate-500">Health</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{healthLabel}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                        <p className="text-[10px] text-slate-500">Last Sync</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{lastSync ? new Date(lastSync).toLocaleTimeString('ar-SA') : 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  {activeTab === 'terminal' && (
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">الطرفية التشغيلية متاحة في لوحة Persistent Runtime Terminal بالأسفل.</p>
                  )}
                  {activeTab === 'git' && (
                    <div className="space-y-2">
                      <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                        <p className="text-[10px] text-slate-500">Git Branch</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{project.git_branch || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-2">
                        <p className="text-[10px] text-slate-500">Runtime Source</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{project.source || project.runtime_source || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  {(activeTab === 'database' || activeTab === 'apis') && (
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا توجد بيانات تشغيلية حالياً</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-xl border border-slate-200 dark:border-slate-800/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Unified Runtime Timeline</p>
              <div className="flex items-center gap-1">
                {(['all', 'approval', 'mutation', 'deploy', 'recovery'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimelineFilter(f)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                      timelineFilter === f
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-auto pr-1">
              {unifiedTimeline.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">لا توجد بيانات تشغيلية حالياً</p>
              ) : unifiedTimeline.map((item) => (
                <div key={`${item.id}-${item.timestamp}`} className="rounded-lg border border-slate-200 dark:border-white/10 p-2 bg-white dark:bg-slate-900/40">
                  <p className="text-[11px] text-slate-500">{item.timestamp || 'N/A'}</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item.type} · {item.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{item.message || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-xl border border-slate-200 dark:border-slate-800/50 p-3 bg-[#080c14]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Persistent Runtime Terminal</p>
              <span className="text-[10px] text-slate-500">Context: {terminalContext}</span>
            </div>
            <div className="h-36 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2 font-mono text-[11px] text-slate-200">
              {terminalOutput.length === 0 ? <p className="text-slate-500">لا توجد بيانات تشغيلية حالياً</p> : terminalOutput.map((line, idx) => <p key={`${line}-${idx}`} className="whitespace-pre-wrap break-words">{line}</p>)}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTerminalCommand()}
                placeholder="أدخل أمر تشغيلي ضمن سياق المشروع"
                className="flex-1 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 outline-none"
              />
              <button onClick={handleTerminalCommand} disabled={terminalRunning} className="px-3 py-2 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-300 text-xs font-bold disabled:opacity-60">
                {terminalRunning ? 'تنفيذ...' : 'تنفيذ'}
              </button>
            </div>
          </div>
        </div>

        {!rightCollapsed && (
          <div className="xl:col-span-3 glass-panel rounded-xl border border-slate-200 dark:border-slate-800/50 p-3 h-fit">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-2">Runtime Intelligence</p>
            <div className="space-y-2">
              <div className="rounded-lg border border-slate-200 dark:border-white/10 p-2 bg-white dark:bg-slate-900/40">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">Production Readiness</p>
                  <button onClick={handleReadinessDrill} disabled={readinessDrillRunning} className="px-2 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold disabled:opacity-60">
                    {readinessDrillRunning ? 'Running...' : 'Run Drill'}
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">
                  {readinessReport?.status || 'UNKNOWN'} | {readinessReport?.readinessScore ?? 'N/A'}%
                </p>
              </div>
              <MetricPanel label="Runtime Health" value={healthLabel} />
              <MetricPanel label="PM2 Stability" value={`${onlinePm2Count} / ${pm2Processes.length} online`} />
              <MetricPanel label="Infrastructure State" value={activeBinding?.nginxBinding ? 'Bound' : 'Unbound'} />
              <MetricPanel label="Runtime Alerts" value={healthLabel === 'WARNING' ? 'Operational warning detected' : 'No critical alerts'} />
              <MetricPanel label="Telemetry" value={`CPU: ${runtimeMetrics?.cpu?.usagePercent ?? 'N/A'} | RAM: ${runtimeMetrics?.ram?.usagePercent ?? 'N/A'}`} />
              <MetricPanel label="Last Sync" value={lastSync ? new Date(lastSync).toLocaleString('ar-SA') : 'N/A'} />
              <MetricPanel label="Validated Environments" value={`${healthyBindings} / ${environmentBindings.length}`} />
            </div>
            <div className="mt-3 rounded-lg border border-slate-200 dark:border-white/10 p-2 bg-white dark:bg-slate-900/40">
              <p className="text-xs text-slate-500 mb-2">Approvals & Mutation Execution Queue</p>
              <div className="space-y-2 max-h-52 overflow-auto">
                {runtimeApprovals.filter((row: any) => String(row?.approval_status || '').toUpperCase() === 'PENDING').length === 0 && pendingMutations.length === 0 ? (
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">لا توجد بيانات تشغيلية حالياً</p>
                ) : runtimeApprovals
                  .filter((row: any) => String(row?.approval_status || '').toUpperCase() === 'PENDING')
                  .slice(0, 8)
                  .map((row: any) => (
                    <div key={row.id} className="rounded-md border border-slate-200 dark:border-white/10 p-2">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{row.operation_type || 'operation'}</p>
                      <p className="text-[10px] text-slate-500">{row.id} | Risk: {row.risk_level || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500">Stage: {Number(row.stage_index || 1)} / {Number(row.total_stages || 1)} | Role: {row.required_role || 'Admin'}</p>
                      <div className="mt-1.5 flex items-center gap-1">
                        <button onClick={() => handleApprovalDecision(row.id, 'APPROVED')} className="px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Approve</button>
                        <button onClick={() => handleApprovalDecision(row.id, 'REJECTED')} className="px-2 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] font-bold">Reject</button>
                      </div>
                    </div>
                  ))}
                {pendingMutations.slice(0, 8).map((row: any) => (
                  <div key={`${row.approval_id}-mutation`} className="rounded-md border border-slate-200 dark:border-white/10 p-2 bg-slate-50 dark:bg-slate-950/50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{row.mutation_kind || 'mutation'} | {row.approval_id}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        String(row.execution_status || '').toUpperCase() === 'COMPLETED'
                          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                          : String(row.execution_status || '').toUpperCase() === 'FAILED'
                            ? 'text-red-400 border-red-500/30 bg-red-500/10'
                            : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      }`}>
                        {String(row.execution_status || 'PENDING').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Mutation: {row.mutation_id || 'N/A'}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <button onClick={() => handleReplayMutation(row.approval_id, row.payload_nonce)} className="px-2 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold">Replay</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
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
