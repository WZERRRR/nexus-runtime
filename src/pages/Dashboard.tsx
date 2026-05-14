import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Cpu, Server, AlertTriangle, Clock, Activity, Layers, Globe, ShieldCheck } from 'lucide-react';
import { runtimeAPI, SystemStatus, ProcessStatus } from '../services/runtimeApi';

function statusColor(status: string) {
  const s = String(status || '').toLowerCase();
  if (s.includes('healthy') || s.includes('ok') || s.includes('online')) return 'text-emerald-400';
  if (s.includes('warn')) return 'text-amber-400';
  if (s.includes('critical') || s.includes('error') || s.includes('failed')) return 'text-red-400';
  if (s.includes('deploy')) return 'text-blue-400';
  if (s.includes('recovery')) return 'text-violet-400';
  return 'text-slate-400';
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-3 py-2">
      <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
        <span>{label}</span>
        <span className="text-blue-400">{icon}</span>
      </div>
      <p className="mt-1 text-sm font-black text-[var(--text-primary)] truncate">{value}</p>
    </div>
  );
}

export function Dashboard() {
  const location = useLocation();
  const projectContext = location.state?.project;
  const runtimeId = projectContext?.id || projectContext?.runtimeId || 'rt-core';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
  const [procStatus, setProcessStatus] = useState<ProcessStatus | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [pm2Procs, setPm2Procs] = useState<any[]>([]);
  const [riskIndicators, setRiskIndicators] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const lastFetchRef = useRef<number>(0);

  const fetchData = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 5000) return;
    lastFetchRef.current = now;
    setIsRefreshing(true);
    try {
      const [
        sys,
        proc,
        ev,
        pm2,
        risk,
        nds,
        pipes,
        recs,
      ] = await Promise.all([
        runtimeAPI.getSystemStatus(),
        runtimeAPI.getProcessStatus(),
        runtimeAPI.getEvents(runtimeId, 15).catch(() => []),
        runtimeAPI.getPM2Processes(undefined, runtimeId).catch(() => []),
        runtimeAPI.getRiskIndicators().catch(() => ({})),
        runtimeAPI.getNodes().catch(() => []),
        runtimeAPI.getPipelines().catch(() => []),
        runtimeAPI.getRuntimeRecoveries(runtimeId).catch(() => []),
      ]);
      setSysStatus(sys);
      setProcessStatus(proc);
      setEvents(ev || []);
      setPm2Procs(pm2 || []);
      setRiskIndicators(risk || {});
      setNodes(nds || []);
      setPipelines(pipes || []);
      setRecoveries(recs || []);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const timer = setInterval(() => fetchData(false), 15000);
    return () => clearInterval(timer);
  }, [runtimeId]);

  const uptime = useMemo(() => {
    if (!sysStatus?.uptime) return 'N/A';
    const d = Math.floor(sysStatus.uptime / 86400);
    const h = Math.floor((sysStatus.uptime % 86400) / 3600);
    return `${d}d ${h}h`;
  }, [sysStatus]);

  const unifiedTimeline = useMemo(() => {
    const evRows = events.map((e: any, i: number) => ({
      id: `ev-${e.id || i}`,
      type: 'runtime',
      label: e.event_type || e.type || 'event',
      message: e.message || e.event || '',
      ts: e.timestamp || e.created_at || null,
      status: e.severity || e.level || 'info',
    }));
    const pipeRows = pipelines.map((p: any, i: number) => ({
      id: `dp-${p.id || i}`,
      type: 'deploy',
      label: p.name || 'deploy',
      message: p.status || 'unknown',
      ts: p.created_at || p.updated_at || null,
      status: p.status || 'deploying',
    }));
    const recRows = recoveries.map((r: any, i: number) => ({
      id: `rc-${r.recovery_id || i}`,
      type: 'recovery',
      label: r.recovery_type || 'recovery',
      message: r.recovery_status || 'unknown',
      ts: r.created_at || null,
      status: r.recovery_status || 'recovery',
    }));
    return [...evRows, ...pipeRows, ...recRows]
      .sort((a, b) => new Date(b.ts || 0).getTime() - new Date(a.ts || 0).getTime())
      .slice(0, 30);
  }, [events, pipelines, recoveries]);

  return (
    <div className="space-y-3 max-w-7xl mx-auto" dir="rtl">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Operational Runtime Command Center</p>
          <h1 className="text-lg font-black text-[var(--text-primary)]">{projectContext?.name || 'Core Runtime'}</h1>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Runtime ID: {runtimeId}</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-slate-900/40 text-xs font-bold"
        >
          {isRefreshing ? 'تحديث...' : 'تحديث'}
        </button>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-6 gap-2">
        <Metric label="CPU" value={sysStatus?.loadavg ? `${(sysStatus.loadavg[0] * 10).toFixed(1)}%` : 'N/A'} icon={<Cpu className="w-3.5 h-3.5" />} />
        <Metric label="RAM" value={sysStatus ? `${Math.round((sysStatus.totalmem - sysStatus.freemem) / 1024 / 1024)} MB` : 'N/A'} icon={<Server className="w-3.5 h-3.5" />} />
        <Metric label="Uptime" value={uptime} icon={<Clock className="w-3.5 h-3.5" />} />
        <Metric label="Risk" value={`${riskIndicators?.system_risk ?? 0}%`} icon={<AlertTriangle className="w-3.5 h-3.5" />} />
        <Metric label="PM2 Online" value={`${pm2Procs.filter((p: any) => String(p.status).toLowerCase() === 'online').length}/${pm2Procs.length}`} icon={<Layers className="w-3.5 h-3.5" />} />
        <Metric label="Nodes" value={String(nodes.length)} icon={<Globe className="w-3.5 h-3.5" />} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7 rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
          <div className="px-3 py-2 border-b border-[var(--border-subtle)] text-xs font-black text-[var(--text-primary)]">Operational Feed</div>
          <div className="p-2 max-h-80 overflow-auto space-y-1.5">
            {events.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)]">لا توجد بيانات تشغيلية حالياً</p>
            ) : events.map((ev: any, i: number) => (
              <div key={`${ev.id || i}-${ev.timestamp || i}`} className="rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-slate-900/30 px-2 py-1.5">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">{ev.message || ev.event || 'event'}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{ev.timestamp || ev.created_at || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)]">
          <div className="px-3 py-2 border-b border-[var(--border-subtle)] text-xs font-black text-[var(--text-primary)]">Runtime Timeline</div>
          <div className="p-2 max-h-80 overflow-auto space-y-1.5">
            {unifiedTimeline.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)]">لا توجد بيانات تشغيلية حالياً</p>
            ) : unifiedTimeline.map((row) => (
              <div key={row.id} className="rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-slate-900/30 px-2 py-1.5">
                <p className={`text-xs font-bold ${statusColor(row.status)}`}>{row.type} · {row.label}</p>
                <p className="text-xs text-[var(--text-primary)] truncate">{row.message || 'N/A'}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{row.ts || 'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-3">
        <div className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)] mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          PM2 Stability & Runtime Status
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {pm2Procs.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">لا توجد بيانات تشغيلية حالياً</p>
          ) : pm2Procs.slice(0, 12).map((p: any, i: number) => (
            <div key={`${p.id || i}-${p.name || i}`} className="rounded-xl border border-[var(--border-subtle)] bg-white dark:bg-slate-900/30 px-2 py-1.5">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">{p.name || `proc-${i}`}</p>
              <p className={`text-[10px] font-bold ${statusColor(p.status || 'offline')}`}>{String(p.status || 'unknown').toUpperCase()}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">CPU {p.cpu || 'N/A'} · RAM {p.mem || p.memory || 'N/A'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
