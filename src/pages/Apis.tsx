import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, Database, ShieldCheck } from 'lucide-react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { runtimeAPI } from '../services/runtimeApi';

type RuntimeEvent = {
  id?: string | number;
  event?: string;
  message?: string;
  type?: string;
  timestamp?: string;
};

export function ApisCenter() {
  const { state } = useLocation();
  const context = state?.project;
  const runtimeId = context?.id?.toString() || context?.runtimeId?.toString() || 'rt-core';
  const [events, setEvents] = useState<RuntimeEvent[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const loadData = async () => {
    try {
      setError('');
      const [eventData, logData] = await Promise.all([
        runtimeAPI.getEvents(runtimeId, 50).catch(() => []),
        runtimeAPI.getLogs(runtimeId).catch(() => [])
      ]);
      setEvents(Array.isArray(eventData) ? eventData : []);
      setLogs(Array.isArray(logData) ? logData : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load API operational data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await loadData();
    };
    run();
    const interval = window.setInterval(run, 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [runtimeId]);

  const totalEvents = events.length;
  const errorEvents = useMemo(() => events.filter(e => String(e.type || '').toLowerCase() === 'error').length, [events]);
  const warningEvents = useMemo(() => events.filter(e => String(e.type || '').toLowerCase() === 'warning').length, [events]);

  return (
    <div className="space-y-6">
      <ProjectHeader
        projectName={context?.name}
        sectionName="Operational APIs"
        projectDescription={context ? undefined : 'مراقبة تكاملات التشغيل الفعلية من سجل runtime والأحداث.'}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs text-slate-500 font-bold">Total Events</p>
          <p className="text-xl font-black text-[var(--text-primary)]">{totalEvents}</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs text-slate-500 font-bold">Error Events</p>
          <p className="text-xl font-black text-red-500">{errorEvents}</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs text-slate-500 font-bold">Warning Events</p>
          <p className="text-xl font-black text-orange-500">{warningEvents}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-black">Runtime API Events</h3>
        </div>
        {loading ? (
          <p className="text-xs text-slate-500">جاري تحميل البيانات التشغيلية...</p>
        ) : error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-slate-500">لا توجد بيانات تشغيلية حالياً</p>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-auto">
            {events.map((item, idx) => (
              <div key={`${item.id ?? idx}`} className="border border-[var(--border-subtle)] rounded-lg p-3">
                <p className="text-xs font-bold text-[var(--text-primary)]">{item.message || item.event || 'Runtime Event'}</p>
                <p className="text-[10px] text-slate-500 mt-1">{item.timestamp ? new Date(item.timestamp).toLocaleString('ar-SA') : '-'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-black">Governed Runtime Logs</h3>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </div>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500">لا توجد بيانات تشغيلية حالياً</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-auto">
            {logs.map((log, idx) => (
              <div key={`${log.id ?? idx}`} className="border border-[var(--border-subtle)] rounded-lg p-3">
                <p className="text-xs font-bold">{log.message || 'Log entry'}</p>
                <p className="text-[10px] text-slate-500 mt-1">{log.timestamp ? new Date(log.timestamp).toLocaleString('ar-SA') : '-'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
