import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, ShieldCheck, Wallet } from 'lucide-react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { runtimeAPI } from '../services/runtimeApi';

export function PaymentsCenter() {
  const { state } = useLocation();
  const context = state?.project;
  const [logs, setLogs] = useState<any[]>([]);
  const [risk, setRisk] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchOperationalData = async () => {
    try {
      const [runtimeLogs, riskIndicators] = await Promise.all([
        runtimeAPI.getLogs(context?.id?.toString()).catch(() => []),
        runtimeAPI.getRiskIndicators().catch(() => ({}))
      ]);
      setLogs(Array.isArray(runtimeLogs) ? runtimeLogs : []);
      setRisk(riskIndicators || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationalData();
    const interval = window.setInterval(fetchOperationalData, 30000);
    return () => window.clearInterval(interval);
  }, [context?.id]);

  return (
    <div className="space-y-6">
      <ProjectHeader
        projectName={context?.name}
        sectionName="Payments Operations"
        projectDescription={context ? undefined : 'تعرض هذه الصفحة مؤشرات تشغيلية حقيقية من logs وrisk layer فقط.'}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs text-slate-500 font-bold">Risk Score</p>
          <p className="text-xl font-black">{risk?.system_risk ?? 0}%</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs text-slate-500 font-bold">Threat Forecast</p>
          <p className="text-xl font-black">{risk?.threat_forecast || '-'}</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs text-slate-500 font-bold">Operational Entries</p>
          <p className="text-xl font-black">{logs.length}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-black">Governed Payment Runtime Feed</h3>
          {Number(risk?.system_risk || 0) > 50 ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          )}
        </div>
        {loading ? (
          <p className="text-xs text-slate-500">جاري تحميل البيانات التشغيلية...</p>
        ) : logs.length === 0 ? (
          <p className="text-xs text-slate-500">لا توجد بيانات تشغيلية حالياً</p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-auto">
            {logs.map((log, idx) => (
              <div key={`${log.id ?? idx}`} className="border border-[var(--border-subtle)] rounded-lg p-3">
                <p className="text-xs font-bold">{log.message || 'Runtime event'}</p>
                <p className="text-[10px] text-slate-500 mt-1">{log.timestamp ? new Date(log.timestamp).toLocaleString('ar-SA') : '-'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
