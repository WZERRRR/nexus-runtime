import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, CheckCircle2, Clock, Play, ShieldCheck, XCircle } from 'lucide-react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { runtimeAPI } from '../services/runtimeApi';

type TimelineStage = {
  stage: string;
  status: 'ok' | 'failed' | 'skipped';
  startedAt: string;
  endedAt: string;
  durationMs: number;
  output?: string;
  error?: string;
};

type MutationFilter = 'all' | 'deploy' | 'recovery' | 'governance' | 'runtime';

function mutationState(status: string) {
  const s = String(status || '').toLowerCase();
  if (s.includes('running') || s.includes('pending') || s.includes('deploy')) return 'text-blue-400';
  if (s.includes('success') || s.includes('ok') || s.includes('completed')) return 'text-emerald-400';
  if (s.includes('warn') || s.includes('skip')) return 'text-amber-400';
  if (s.includes('fail') || s.includes('error')) return 'text-red-400';
  if (s.includes('recover') || s.includes('rollback')) return 'text-violet-400';
  return 'text-slate-400';
}

export function Deploy() {
  const { state } = useLocation();
  const context = state?.project;
  const runtimeId = context?.runtime_id || context?.id;

  const [history, setHistory] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<TimelineStage[]>([]);
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [governance, setGovernance] = useState<any[]>([]);
  const [runtimeEvents, setRuntimeEvents] = useState<any[]>([]);
  const [mutationStream, setMutationStream] = useState<any[]>([]);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MutationFilter>('all');

  const loadData = async () => {
    if (!runtimeId) return;
    try {
      const [deployments, recs, gov, events] = await Promise.all([
        runtimeAPI.getRuntimeDeployments(runtimeId),
        runtimeAPI.getRuntimeRecoveries(runtimeId).catch(() => []),
        runtimeAPI.getGovernanceActions().catch(() => []),
        runtimeAPI.getEvents(String(runtimeId), 30).catch(() => []),
      ]);
      setHistory(deployments || []);
      setRecoveries(recs || []);
      setGovernance(gov || []);
      setRuntimeEvents(events || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load mutation data');
    }
  };

  useEffect(() => {
    loadData();
  }, [runtimeId]);

  useEffect(() => {
    if (!runtimeId) return;
    const stream = runtimeAPI.connectMutationStream(
      {
        onData: (rows) => {
          setMutationStream((prev) => {
            const map = new Map(prev.map((item: any) => [`${item.id}:${item.timestamp}:${item.source}`, item]));
            rows.forEach((item: any) => {
              map.set(`${item.id}:${item.timestamp}:${item.source}`, item);
            });
            return Array.from(map.values()).slice(-200);
          });
        },
      },
      { runtimeId: String(runtimeId), projectId: context?.id ? String(context.id) : undefined },
    );
    return () => stream.close();
  }, [runtimeId, context?.id]);

  const runDeploy = async () => {
    if (!runtimeId || isRunning) return;
    setError(null);
    setIsRunning(true);
    setTimeline([]);
    try {
      const result = await runtimeAPI.runGovernedDeploy(runtimeId, context?.git_branch || 'main');
      setDeployResult(result);
      setTimeline(result?.timeline || []);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Deployment failed');
    } finally {
      setIsRunning(false);
    }
  };

  const mergedMutationTimeline = useMemo(() => {
    const stageRows = timeline.map((s, i) => ({
      id: `st-${i}-${s.stage}`,
      source: 'deploy',
      label: s.stage,
      status: s.status,
      message: s.error || s.output || '',
      ts: s.endedAt || s.startedAt || null,
      duration: s.durationMs,
    }));
    const deployRows = history.map((d: any, i: number) => ({
      id: `dp-${d.deployment_id || i}`,
      source: 'deploy',
      label: d.deployment_id || d.deploy_strategy || 'deploy',
      status: d.deploy_status || 'unknown',
      message: d.risk_level || '',
      ts: d.created_at || d.executed_at || null,
      duration: d.duration_ms || null,
    }));
    const recoveryRows = recoveries.map((r: any, i: number) => ({
      id: `rc-${r.recovery_id || i}`,
      source: 'recovery',
      label: r.recovery_type || 'recovery',
      status: r.recovery_status || 'unknown',
      message: r.risk_level || '',
      ts: r.created_at || null,
      duration: null,
    }));
    const govRows = governance.slice(0, 50).map((g: any, i: number) => ({
      id: `gv-${g.id || i}`,
      source: 'governance',
      label: g.action_type || 'governance',
      status: g.status || 'unknown',
      message: g.target || g.details || '',
      ts: g.created_at || g.timestamp || null,
      duration: null,
    }));
    const runtimeRows = runtimeEvents.map((e: any, i: number) => ({
      id: `rt-${e.id || i}`,
      source: 'runtime',
      label: e.event_type || e.type || 'runtime',
      status: e.severity || e.level || 'info',
      message: e.message || e.event || '',
      ts: e.created_at || e.timestamp || null,
      duration: null,
    }));
    const streamRows = mutationStream.map((m: any, i: number) => ({
      id: `ws-${m.id || i}`,
      source: m.source || 'runtime',
      label: m.label || m.type || 'mutation',
      status: m.status || 'unknown',
      message: m.message || '',
      ts: m.timestamp || null,
      duration: null,
    }));

    const all = [...stageRows, ...deployRows, ...recoveryRows, ...govRows, ...runtimeRows, ...streamRows]
      .sort((a, b) => new Date(b.ts || 0).getTime() - new Date(a.ts || 0).getTime());
    if (filter === 'all') return all.slice(0, 120);
    return all.filter((row) => row.source === filter).slice(0, 120);
  }, [timeline, history, recoveries, governance, runtimeEvents, mutationStream, filter]);

  const failedStages = useMemo(() => timeline.filter((s) => s.status === 'failed').length, [timeline]);
  const completedStages = useMemo(() => timeline.filter((s) => s.status === 'ok').length, [timeline]);

  return (
    <div className="space-y-3 pb-6" dir="rtl">
      <ProjectHeader
        projectName={context?.name}
        project={context}
        sectionName="Runtime Mutation Execution Center"
        actions={
          <button onClick={runDeploy} disabled={!runtimeId || isRunning} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2">
            <Play className="w-4 h-4" />
            {isRunning ? 'Running...' : 'Run Governed Deploy'}
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Metric label="Runtime" value={runtimeId ? String(runtimeId) : 'N/A'} />
        <Metric label="Completed Stages" value={String(completedStages)} />
        <Metric label="Failed Stages" value={String(failedStages)} />
        <Metric label="Deploy Duration" value={deployResult?.durationMs ? `${deployResult.durationMs} ms` : 'N/A'} />
      </div>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-xs font-black text-[var(--text-primary)]">Operational Runtime Mutation Timeline</h3>
          <div className="flex items-center gap-1">
            {(['all', 'deploy', 'recovery', 'governance', 'runtime'] as MutationFilter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 rounded-md text-[10px] border ${filter === f ? 'border-blue-500/40 bg-blue-500/10 text-blue-300' : 'border-[var(--border-subtle)] text-[var(--text-tertiary)]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5 max-h-80 overflow-auto">
          {mergedMutationTimeline.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">لا توجد بيانات تشغيلية حالياً</p>
          ) : mergedMutationTimeline.map((item) => (
            <div key={item.id} className="p-2 rounded-lg border border-[var(--border-subtle)] bg-white dark:bg-slate-900/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--text-primary)]">{item.source} · {item.label}</p>
                <p className={`text-[10px] font-bold ${mutationState(item.status)}`}>{String(item.status).toUpperCase()}</p>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] truncate">{item.message || 'N/A'}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{item.ts || 'N/A'} {item.duration ? `· ${item.duration}ms` : ''}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-3">
          <h3 className="text-xs font-black text-[var(--text-primary)] mb-2">Deploy Stage Progression</h3>
          {timeline.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">لا توجد بيانات تشغيلية حالياً</p>
          ) : timeline.map((stage, idx) => (
            <div key={`${stage.stage}-${idx}`} className="p-2 rounded-lg border border-[var(--border-subtle)] bg-white dark:bg-slate-900/30 mb-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                  {stage.status === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : stage.status === 'failed' ? <XCircle className="w-4 h-4 text-red-500" /> : <Activity className="w-4 h-4 text-amber-500" />}
                  {stage.stage}
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)]">{stage.durationMs} ms</span>
              </div>
              {stage.error && <p className="text-xs text-red-400 mt-1">{stage.error}</p>}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-3">
          <h3 className="text-xs font-black text-[var(--text-primary)] mb-2">Runtime Verification Context</h3>
          <div className="space-y-1.5">
            <Verification label="Deploy Verification" value={failedStages === 0 && timeline.length > 0 ? 'SUCCESS' : timeline.length === 0 ? 'N/A' : 'WARNING'} />
            <Verification label="Recovery Awareness" value={recoveries.length > 0 ? 'RECOVERY READY' : 'NO RECOVERY EVENTS'} />
            <Verification label="Governance Traceability" value={governance.length > 0 ? 'AUDITED' : 'LIMITED'} />
            <Verification label="Runtime Signals" value={runtimeEvents.length > 0 ? 'VISIBLE' : 'NO EVENTS'} />
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 p-3 text-sm font-bold">{error}</div>}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 p-3 text-xs font-bold flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        Every runtime mutation is visible, governed, traceable, and recoverable.
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
      <p className="text-[var(--text-tertiary)] text-xs">{label}</p>
      <p className="text-[var(--text-primary)] font-bold text-sm">{value}</p>
    </div>
  );
}

function Verification({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-2 rounded-lg border border-[var(--border-subtle)] bg-white dark:bg-slate-900/30">
      <p className="text-[10px] text-[var(--text-tertiary)]">{label}</p>
      <p className={`text-xs font-bold ${mutationState(value)}`}>{value}</p>
    </div>
  );
}
