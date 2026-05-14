import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, ShieldCheck } from 'lucide-react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { runtimeAPI } from '../services/runtimeApi';

export function OTPCenter() {
  const { state } = useLocation();
  const context = state?.project;
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [sessionEvents, setSessionEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sec, sessions] = await Promise.all([
        runtimeAPI.getSecurityEvents().catch(() => []),
        runtimeAPI.getSessions().catch(() => [])
      ]);
      setSecurityEvents(Array.isArray(sec) ? sec : []);
      setSessionEvents(Array.isArray(sessions) ? sessions : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = window.setInterval(fetchData, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const highRisk = useMemo(
    () => securityEvents.filter((e) => String(e.risk_level || '').toLowerCase() === 'high').length,
    [securityEvents]
  );

  return (
    <div className="space-y-6">
      <ProjectHeader
        projectName={context?.name}
        sectionName="OTP & Notifications"
        projectDescription={context ? undefined : 'عرض أمني تشغيلي قائم على أحداث الأمن والجلسات فقط.'}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs text-slate-500 font-bold">Security Events</p>
          <p className="text-xl font-black">{securityEvents.length}</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs text-slate-500 font-bold">High Risk</p>
          <p className="text-xl font-black text-red-500">{highRisk}</p>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <p className="text-xs text-slate-500 font-bold">Active Sessions</p>
          <p className="text-xl font-black">{sessionEvents.length}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-black">Operational Security Stream</h3>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </div>
        {loading ? (
          <p className="text-xs text-slate-500">جاري تحميل البيانات التشغيلية...</p>
        ) : securityEvents.length === 0 ? (
          <p className="text-xs text-slate-500">لا توجد بيانات تشغيلية حالياً</p>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-auto">
            {securityEvents.map((event, idx) => (
              <div key={`${event.id ?? idx}`} className="border border-[var(--border-subtle)] rounded-lg p-3">
                <p className="text-xs font-bold">{event.event || event.message || 'Security Event'}</p>
                <p className="text-[10px] text-slate-500 mt-1">{event.timestamp ? new Date(event.timestamp).toLocaleString('ar-SA') : '-'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
