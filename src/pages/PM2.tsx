import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Square, RotateCw, Trash2, Clock, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { runtimeAPI } from '../services/runtimeApi';

type ActionType = 'restart' | 'stop' | 'start' | 'delete';

function statusClass(status: string) {
  const s = String(status || '').toLowerCase();
  if (s === 'online') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (s === 'stopped') return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  if (s.includes('restart')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  if (s.includes('warn')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (s.includes('error') || s.includes('crash')) return 'text-red-400 bg-red-500/10 border-red-500/20';
  return 'text-slate-300 bg-slate-500/10 border-slate-500/20';
}

export function PM2Manager() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const context = state?.project;

  const [processes, setProcesses] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ procId: number; name: string; type: ActionType } | null>(null);

  const fetchProcesses = async () => {
    try {
      const projectPath = context?.environments?.[0]?.path;
      const data = await runtimeAPI.getPM2Processes(projectPath, context?.id?.toString());
      setProcesses(Array.isArray(data) ? data : []);
    } catch {
      setProcesses([]);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, [context]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleAction = (id: number, action: ActionType) => {
    const proc = processes.find((p) => p.id === id);
    if (!proc) return;
    setConfirmAction({ procId: id, name: proc.name, type: action });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const { procId, type } = confirmAction;
    setConfirmAction(null);
    setLoadingId(procId);
    try {
      const res = await runtimeAPI.performPM2Action(type, procId);
      if (res.success) {
        showToast('تم تنفيذ العملية بنجاح', 'success');
        await fetchProcesses();
      } else {
        showToast(res.message || 'فشل تنفيذ العملية', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'فشل تنفيذ العملية', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const counts = useMemo(() => ({
    total: processes.length,
    online: processes.filter((p) => String(p.status).toLowerCase() === 'online').length,
    stopped: processes.filter((p) => String(p.status).toLowerCase() === 'stopped').length,
  }), [processes]);

  return (
    <div className="space-y-3 pb-6" dir="rtl">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-[100] px-5 py-2 rounded-xl border shadow-xl flex items-center gap-2 text-xs font-bold ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <ProjectHeader
        projectName={context?.name}
        project={context}
        sectionName="Operational Runtime Process Control Center"
        actions={
          <div className="flex gap-2">
            {context && (
              <button
                onClick={() => navigate('/logs', { state: { project: context } })}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 text-xs font-bold"
              >
                <Clock className="w-3.5 h-3.5" />
                السجلات
              </button>
            )}
            <button
              onClick={fetchProcesses}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900/40 rounded-lg border border-[var(--border-subtle)] text-xs font-bold"
            >
              <RotateCw className="w-3.5 h-3.5" />
              تحديث
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Info label="إجمالي العمليات" value={String(counts.total)} />
        <Info label="Online" value={String(counts.online)} />
        <Info label="Stopped" value={String(counts.stopped)} />
      </section>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] overflow-hidden">
        <div className="px-3 py-2 border-b border-[var(--border-subtle)] text-xs font-black text-[var(--text-primary)]">PM2 Event Timeline / Process Table</div>
        <div className="overflow-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-white dark:bg-slate-900/20 text-[var(--text-tertiary)]">
              <tr>
                <th className="px-3 py-2">العملية</th>
                <th className="px-3 py-2">الحالة</th>
                <th className="px-3 py-2">CPU/RAM</th>
                <th className="px-3 py-2">Uptime</th>
                <th className="px-3 py-2">Restarts</th>
                <th className="px-3 py-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {processes.length === 0 ? (
                <tr><td className="px-3 py-4 text-[var(--text-tertiary)]" colSpan={6}>لا توجد بيانات تشغيلية حالياً</td></tr>
              ) : processes.map((proc, idx) => (
                <tr key={`${proc.id}-${idx}`} className="border-t border-[var(--border-subtle)]">
                  <td className="px-3 py-2">
                    <p className="font-bold text-[var(--text-primary)]">{proc.name}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] truncate">{proc.path || 'N/A'} · Port {proc.port || 'N/A'}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-md border text-[10px] font-bold ${statusClass(proc.status)}`}>
                      {String(proc.status || 'unknown').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-primary)]">{proc.cpu || 'N/A'} · {proc.mem || 'N/A'}</td>
                  <td className="px-3 py-2 text-[var(--text-primary)]">{proc.uptime || 'N/A'}</td>
                  <td className="px-3 py-2 text-[var(--text-primary)]">{proc.restarts ?? 0}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button disabled={loadingId !== null || proc.isReadOnly} onClick={() => handleAction(proc.id, 'restart')} className="p-2 rounded-lg border border-[var(--border-subtle)] disabled:opacity-50"><RotateCw className="w-3.5 h-3.5" /></button>
                      {String(proc.status).toLowerCase() === 'online' ? (
                        <button disabled={loadingId !== null || proc.isReadOnly} onClick={() => handleAction(proc.id, 'stop')} className="p-2 rounded-lg border border-[var(--border-subtle)] disabled:opacity-50"><Square className="w-3.5 h-3.5" /></button>
                      ) : (
                        <button disabled={loadingId !== null || proc.isReadOnly} onClick={() => handleAction(proc.id, 'start')} className="p-2 rounded-lg border border-[var(--border-subtle)] disabled:opacity-50"><Play className="w-3.5 h-3.5" /></button>
                      )}
                      <button disabled={loadingId !== null || proc.isReadOnly} onClick={() => handleAction(proc.id, 'delete')} className="p-2 rounded-lg border border-[var(--border-subtle)] disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-3">
        <div className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)] mb-2">
          <Activity className="w-4 h-4 text-blue-400" />
          PM2 Activity Feed
        </div>
        <div className="space-y-1.5">
          {processes.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">لا توجد بيانات تشغيلية حالياً</p>
          ) : processes.slice(0, 8).map((proc, i) => (
            <div key={`${proc.id}-${i}-feed`} className="rounded-lg border border-[var(--border-subtle)] bg-white dark:bg-slate-900/30 px-2 py-1.5">
              <p className="text-xs font-bold text-[var(--text-primary)]">{proc.name}</p>
              <p className={`text-[10px] font-bold ${statusClass(proc.status).split(' ')[0]}`}>{String(proc.status || 'unknown').toUpperCase()} · restart={proc.restarts ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80" onClick={() => setConfirmAction(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--panel-bg)] p-4">
              <h3 className="text-sm font-black text-[var(--text-primary)]">تأكيد الإجراء</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">الإجراء: {confirmAction.type} · العملية: {confirmAction.name}</p>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => setConfirmAction(null)} className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-xs font-bold">إلغاء</button>
                <button onClick={executeConfirmedAction} className="flex-1 px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold">تأكيد</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--panel-bg)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-tertiary)]">{label}</p>
      <p className="text-sm font-black text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
