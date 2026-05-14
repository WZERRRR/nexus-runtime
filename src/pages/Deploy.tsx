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

export function Deploy() {
  const { state } = useLocation();
  const context = state?.project;
  const runtimeId = context?.runtime_id || context?.id;

  const [history, setHistory] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<TimelineStage[]>([]);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!runtimeId) return;
    try {
      const deployments = await runtimeAPI.getRuntimeDeployments(runtimeId);
      setHistory(deployments || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load deploy history');
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtimeId]);

  const runDeploy = async () => {
    if (!runtimeId || isRunning) return;
    setError(null);
    setIsRunning(true);
    setTimeline([]);
    try {
      const result = await runtimeAPI.runGovernedDeploy(runtimeId, context?.git_branch || 'main');
      setDeployResult(result);
      setTimeline(result?.timeline || []);
      await loadHistory();
    } catch (e: any) {
      setError(e.message || 'Deployment failed');
    } finally {
      setIsRunning(false);
    }
  };

  const failedStages = useMemo(() => timeline.filter((s) => s.status === 'failed').length, [timeline]);
  const completedStages = useMemo(() => timeline.filter((s) => s.status === 'ok').length, [timeline]);

  return (
    <div className="space-y-5 pb-8">
      <ProjectHeader
        projectName={context?.name}
        project={context}
        sectionName="Governed Runtime Deployment Pipeline"
        actions={
          <button
            onClick={runDeploy}
            disabled={!runtimeId || isRunning}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Deploy Running...' : 'Run Governed Deploy'}
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Metric label="Runtime" value={runtimeId ? String(runtimeId) : 'N/A'} />
        <Metric label="Completed Stages" value={String(completedStages)} />
        <Metric label="Failed Stages" value={String(failedStages)} />
        <Metric label="Deploy Duration" value={deployResult?.durationMs ? `${deployResult.durationMs} ms` : 'N/A'} />
      </div>

      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Deploy Timeline</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">لا توجد بيانات تشغيلية حالياً</p>
        ) : (
          <div className="space-y-2">
            {timeline.map((stage, idx) => (
              <div key={`${stage.stage}-${idx}`} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    {stage.status === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : stage.status === 'failed' ? <XCircle className="w-4 h-4 text-red-500" /> : <Activity className="w-4 h-4 text-amber-500" />}
                    {stage.stage}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{stage.durationMs} ms</div>
                </div>
                {stage.error && <p className="text-xs text-red-400 mt-1">{stage.error}</p>}
                {stage.output && <p className="text-xs text-slate-500 mt-1 truncate">{stage.output}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/10 p-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Deploy History / Audit</h3>
        {history.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">لا توجد بيانات تشغيلية حالياً</p>
        ) : (
          <div className="space-y-2">
            {history.map((item: any) => (
              <div key={item.deployment_id} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.deployment_id}</p>
                  <p className="text-xs text-slate-500">{item.deploy_strategy} / Risk: {item.risk_level}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.deploy_status}</p>
                  <p className="text-[11px] text-slate-500"><Clock className="w-3 h-3 inline mr-1" />{item.created_at || item.executed_at || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 p-3 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 p-3 text-xs font-bold flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" />
        Deploys are governed, audited, and recovery-aware.
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/40">
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-slate-700 dark:text-slate-200 font-bold text-sm">{value}</p>
    </div>
  );
}
