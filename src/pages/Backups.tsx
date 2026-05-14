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

export function BackupCenter() {
  const { state } = useLocation();
  const context = state?.project;
  const runtimeId = context?.runtime_id || context?.id;
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const [rollbackResult, setRollbackResult] = useState<any>(null);
  const [timeline, setTimeline] = useState<TimelineStage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecoveryData = async () => {
    if (!runtimeId) return;
    try {
      const [snaps, recs] = await Promise.all([
        runtimeAPI.getRuntimeSnapshots(runtimeId),
        runtimeAPI.getRuntimeRecoveries(runtimeId),
      ]);
      setSnapshots(snaps || []);
      setRecoveries(recs || []);
      if (!selectedSnapshot && snaps?.length) setSelectedSnapshot(snaps[0].snapshot_id);
    } catch (e: any) {
      setError(e.message || 'Failed to load recovery data');
    }
  };

  useEffect(() => {
    loadRecoveryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtimeId]);

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

  return (
    <div className="space-y-5 pb-8">
      <ProjectHeader
        projectName={context?.name}
        project={context}
        sectionName="Runtime Recovery & Rollback Center"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadRecoveryData}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={runRollback}
              disabled={!runtimeId || !selectedSnapshot || isRunning}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2"
            >
              <Undo2 className="w-4 h-4" />
              {isRunning ? 'Rollback Running...' : 'Run Governed Rollback'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Metric label="Runtime" value={runtimeId ? String(runtimeId) : 'N/A'} icon={<Database className="w-4 h-4" />} />
        <Metric label="Snapshots" value={String(snapshots.length)} icon={<History className="w-4 h-4" />} />
        <Metric label="Recovery Stages OK" value={String(okCount)} icon={<ShieldCheck className="w-4 h-4" />} />
        <Metric label="Recovery Stages Failed" value={String(failCount)} icon={<Clock className="w-4 h-4" />} />
      </div>

      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Runtime Snapshots</h3>
        {snapshots.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">لا توجد بيانات تشغيلية حالياً</p>
        ) : (
          <div className="space-y-2">
            <select
              value={selectedSnapshot}
              onChange={(e) => setSelectedSnapshot(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-100 dark:bg-slate-900 text-xs font-bold"
            >
              {snapshots.map((snap) => (
                <option key={snap.snapshot_id} value={snap.snapshot_id}>
                  {snap.snapshot_id} | {snap.snapshot_type} | {snap.created_at}
                </option>
              ))}
            </select>
            {snapshots.map((snap) => (
              <div key={snap.snapshot_id} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{snap.snapshot_id}</p>
                <p className="text-xs text-slate-500">{snap.snapshot_type} / {snap.created_by}</p>
                <p className="text-[11px] text-slate-500">{snap.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Rollback Timeline</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">لا توجد بيانات تشغيلية حالياً</p>
        ) : (
          <div className="space-y-2">
            {timeline.map((stage, idx) => (
              <div key={`${stage.stage}-${idx}`} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{stage.stage}</p>
                  <span className="text-xs font-bold text-slate-500">{stage.durationMs} ms</span>
                </div>
                <p className={`text-xs mt-1 ${stage.status === 'failed' ? 'text-red-400' : stage.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {stage.status.toUpperCase()}
                </p>
                {stage.error && <p className="text-xs text-red-400 mt-1">{stage.error}</p>}
                {stage.output && <p className="text-xs text-slate-500 mt-1 truncate">{stage.output}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Recovery History</h3>
        {recoveries.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">لا توجد بيانات تشغيلية حالياً</p>
        ) : (
          <div className="space-y-2">
            {recoveries.map((rec) => (
              <div key={rec.recovery_id} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{rec.recovery_id}</p>
                <p className="text-xs text-slate-500">{rec.recovery_type} / {rec.recovery_status} / Risk: {rec.risk_level}</p>
                <p className="text-[11px] text-slate-500">{rec.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>

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
    <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
      <div className="flex items-center gap-2 text-slate-500 text-xs">{icon}<span>{label}</span></div>
      <p className="text-slate-700 dark:text-slate-200 font-bold text-sm mt-1">{value}</p>
    </div>
  );
}
