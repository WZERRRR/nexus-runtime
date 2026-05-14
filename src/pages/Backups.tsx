import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock, Database, History, RefreshCw, ShieldCheck, Undo2 } from 'lucide-react';
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

function recoveryState(status: string) {
  const s = String(status || '').toLowerCase();
  if (s.includes('running') || s.includes('pending')) return 'text-blue-400';
  if (s.includes('ok') || s.includes('success') || s.includes('completed')) return 'text-emerald-400';
  if (s.includes('warn') || s.includes('skip')) return 'text-amber-400';
  if (s.includes('fail') || s.includes('error')) return 'text-red-400';
  if (s.includes('recover') || s.includes('rollback') || s.includes('restore')) return 'text-violet-400';
  return 'text-slate-400';
}

export function BackupCenter() {
  const { state } = useLocation();
  const context = state?.project;
  const runtimeId = context?.runtime_id || context?.id;

  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [governance, setGovernance] = useState<any[]>([]);
  const [runtimeEvents, setRuntimeEvents] = useState<any[]>([]);
  const [mutationStream, setMutationStream] = useState<any[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const [rollbackResult, setRollbackResult] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineStage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecoveryData = async () => {
    if (!runtimeId) return;
    try {
      const [snaps, recs, gov, events] = await Promise.all([
        runtimeAPI.getRuntimeSnapshots(runtimeId),
        runtimeAPI.getRuntimeRecoveries(runtimeId),
        runtimeAPI.getGovernanceActions().catch(() => []),
        runtimeAPI.getEvents(String(runtimeId), 30).catch(() => []),
      ]);
      setSnapshots(snaps || []);
      setRecoveries(recs || []);
      setGovernance(gov || []);
      setRuntimeEvents(events || []);
      if (!selectedSnapshot && snaps?.length) setSelectedSnapshot(snaps[0].snapshot_id);
    } catch (e: any) {
      setError(e.message || 'Failed to load recovery data');
    }
  };

  useEffect(() => {
    loadRecoveryData();
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

  const runRollback = async () => {
    if (!runtimeId || !selectedSnapshot || isRunning) return;
    setError(null);
    setIsRunning(true);
    setTimeline([]);
    try {
      const result = await runtimeAPI.runRuntimeRollback(runtimeId, selectedSnapshot);
      setRollbackResult(result);
      setTimeline(result?.timeline || []);
      await loadRecoveryData();
    } catch (e: any) {
      setError(e.message || 'Rollback failed');
    } finally {
      setIsRunning(false);
    }
  };

  const okCount = useMemo(() => timeline.filter((s) => s.status === 'ok').length, [timeline]);
  const failCount = useMemo(() => timeline.filter((s) => s.status === 'failed').length, [timeline]);

  const mergedRecoveryTimeline = useMemo(() => {
    const stageRows = timeline.map((s, i) => ({
      id: `stage-${i}`,
      source: 'rollback',
      label: s.stage,
      status: s.status,
      message: s.error || s.output || '',
      ts: s.endedAt || s.startedAt || null,
      duration: s.durationMs,
    }));
    const recRows = recoveries.map((r: any, i: number) => ({
      id: `rec-${r.recovery_id || i}`,
      source: 'recovery',
      label: r.recovery_type || 'recovery',
      status: r.recovery_status || 'unknown',
      message: r.risk_level || '',
      ts: r.created_at || null,
      duration: null,
    }));
    const govRows = governance.slice(0, 50).map((g: any, i: number) => ({
      id: `gov-${g.id || i}`,
      source: 'governance',
      label: g.action_type || 'governance',
      status: g.status || 'unknown',
      message: g.target || '',
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

    return [...stageRows, ...recRows, ...govRows, ...runtimeRows, ...streamRows]
      .sort((a, b) => new Date(b.ts || 0).getTime() - new Date(a.ts || 0).getTime())
      .slice(0, 120);
  }, [timeline, recoveries, governance, runtimeEvents, mutationStream]);

  return (
    <div className="space-y-2 pb-6" dir="rtl">
      <ProjectHeader
        projectName={context?.name}
        project={context}
        sectionName="Runtime Recovery Operations Center"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={loadRecoveryData} className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-xs font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button onClick={runRollback} disabled={!runtimeId || !selectedSnapshot || isRunning} className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2">
              <Undo2 className="w-4 h-4" />
              {isRunning ? 'Rollback Running...' : 'Run Governed Rollback'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Metric label="Runtime" value={runtimeId ? String(runtimeId) : 'N/A'} icon={<Database className="w-4 h-4" />} />
        <Metric label="Snapshots" value={String(snapshots.length)} icon={<History className="w-4 h-4" />} />
        <Metric label="Recovery Stages OK" value={String(okCount)} icon={<ShieldCheck className="w-4 h-4" />} />
        <Metric label="Recovery Stages Failed" value={String(failCount)} icon={<Clock className="w-4 h-4" />} />
      </div>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-3">
        <h3 className="text-xs font-black text-[var(--text-primary)] mb-2">Runtime Snapshots</h3>
        {snapshots.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)]">لا توجد بيانات تشغيلية حالياً</p>
        ) : (
          <div className="space-y-2">
            <select value={selectedSnapshot} onChange={(e) => setSelectedSnapshot(e.target.value)} className="w-full rounded-xl px-3 py-2 bg-slate-100 dark:bg-slate-900 text-xs font-bold">
              {snapshots.map((snap) => (
                <option key={snap.snapshot_id} value={snap.snapshot_id}>
                  {snap.snapshot_id} | {snap.snapshot_type} | {snap.created_at}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {snapshots.slice(0, 10).map((snap) => (
                <div key={snap.snapshot_id} className="p-2 rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-slate-900/30">
                  <p className="text-xs font-bold text-[var(--text-primary)]">{snap.snapshot_id}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{snap.snapshot_type} / {snap.created_by}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-3">
        <h3 className="text-xs font-black text-[var(--text-primary)] mb-2">Unified Recovery / Rollback Timeline</h3>
        <div className="space-y-1.5 max-h-80 overflow-auto">
          {mergedRecoveryTimeline.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">لا توجد بيانات تشغيلية حالياً</p>
          ) : mergedRecoveryTimeline.map((row) => (
            <div key={row.id} className="p-2 rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-slate-900/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--text-primary)]">{row.source} · {row.label}</p>
                <p className={`text-[10px] font-bold ${recoveryState(row.status)}`}>{String(row.status).toUpperCase()}</p>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] truncate">{row.message || 'N/A'}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{row.ts || 'N/A'} {row.duration ? `· ${row.duration}ms` : ''}</p>
            </div>
          ))}
        </div>
      </section>

      {rollbackResult?.durationMs && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 p-3 text-xs font-bold">
          Recovery completed in {rollbackResult.durationMs} ms.
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 p-3 text-xs font-bold">
          {error}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
      <div className="flex items-center gap-2 text-[var(--text-tertiary)] text-xs">{icon}<span>{label}</span></div>
      <p className="text-[var(--text-primary)] font-bold text-sm mt-1">{value}</p>
    </div>
  );
}
