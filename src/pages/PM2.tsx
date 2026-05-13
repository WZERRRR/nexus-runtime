import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Square, RotateCw, Trash2, Cpu, Activity, Clock, Box, CheckCircle2, AlertCircle, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { runtimeAPI } from '../services/runtimeApi';

export function PM2Manager() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const context = state?.project;

  const [processes, setProcesses] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ procId: number, name: string, type: 'restart' | 'stop' | 'start' | 'delete' } | null>(null);

  const fetchProcesses = async () => {
    try {
      const projectPath = context?.environments?.[0]?.path;
      const data = await runtimeAPI.getPM2Processes(projectPath, context?.id?.toString());
      setProcesses(data);
   } catch (e) {
     console.error(e);
   }
 };

 useEffect(() => {
   fetchProcesses();
   const interval = setInterval(fetchProcesses, 3000);
   return () => clearInterval(interval);
 }, [context]);

 const handleAction = (id: number, action: 'restart' | 'stop' | 'start' | 'delete') => {
  const proc = processes.find(p => p.id === id);
  if (!proc) return;
  setConfirmAction({ procId: id, name: proc.name, type: action });
 };

 const executeConfirmedAction = async () => {
  if (!confirmAction) return;
  const { procId: id, type: action } = confirmAction;
  setConfirmAction(null);
  setLoadingId(id);
  
  try {
    const res = await runtimeAPI.performPM2Action(action, id);
    if (res.success) {
      showToast(`تم ${action === 'restart' ? 'إعادة تشغيل' : action === 'stop' ? 'إيقاف' : action === 'start' ? 'تشغيل' : 'حذف'} العملية بنجاح`, 'success');
      await fetchProcesses();
    } else {
      showToast(res.message || 'حدث خطأ غير معروف', 'error');
    }
  } catch (e: any) {
    showToast(e.message || 'حدث خطأ يرجى المحاولة', 'error');
  } finally {
    setLoadingId(null);
  }
 };

 const showToast = (message: string, type: 'success' | 'error') => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
 };

 return (
 <div className="space-y-6 relative">
 <AnimatePresence>
 {toast && (
 <motion.div 
 initial={{ opacity: 0, y: -20, x: '-50%' }}
 animate={{ opacity: 1, y: 20, x: '-50%' }}
 exit={{ opacity: 0, y: -20, x: '-50%' }}
 className={`fixed top-4 left-1/2 z-[100] px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 font-bold text-sm backdrop-blur-md ${
 toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
 }`}
 >
 {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
 {toast.message}
 </motion.div>
 )}
 </AnimatePresence>

 <ProjectHeader 
 projectName={context?.name}
 project={context}
 projectDescription={context ? undefined : "التحكم الكامل بخدمات السيرفر العاملة في الخلفية"}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="إدارة عمليات PM2"
 actions={
 <div className="flex gap-2">
 {context && (
 <button 
 onClick={() => navigate('/logs', { state: { project: context } })}
 className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/20 transition-all text-xs font-bold"
 >
 <Clock className="w-3.5 h-3.5" />
 السجلات
 </button>
 )}
 <button 
 onClick={() => {
 setLoadingId(0);
 setTimeout(() => {
 setLoadingId(null);
 showToast('تم تحديث قائمة العمليات من السيرفر', 'success');
 }, 1000);
 }}
 className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-sm font-bold shadow-sm active:scale-95"
 >
 <RotateCw className={`w-4 h-4 ${loadingId === 0 ? 'animate-spin' : ''}`} />
 تحديث القائمة
 </button>
 <button 
 onClick={() => showToast('جاري فتح معالج إضافة خدمة PM2 جديدة...', 'success')}
 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_5px_15px_-5px_rgba(37,99,235,0.4)] transition-all active:scale-95"
 >
 <Plus className="w-4 h-4" />
 إضافة خدمة جديدة
 </button>
 </div>
 }
 />

 {context && (
   <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
     <div className="flex items-center gap-4">
       <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
         <Activity className="w-5 h-5 text-blue-400" />
       </div>
       <div>
         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Runtime Status Context</h4>
         <div className="flex items-center gap-2">
           <span className="text-sm font-black text-white">{context?.name || 'Global'}</span>
           <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest border border-blue-500/30">
             {context?.environments?.[0]?.name || 'Production'}
           </span>
         </div>
       </div>
     </div>
     
     <div className="flex gap-4">
       <div className="flex flex-col items-end">
         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Path</span>
         <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{context?.environments?.[0]?.path || '/'}</span>
       </div>
       <div className="flex flex-col items-end">
         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Processes Found</span>
         <span className="text-[10px] font-mono text-emerald-400 font-bold">{processes.length}</span>
       </div>
     </div>
   </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 px-1">
 <AnimatePresence mode="popLayout">
 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="contents">
 <ProcessInsightCard 
 icon={<Box />}
 label="إجمالي الخدمات"
 value={processes.length}
 sub="عمليات مراقبة نشطة"
 color="blue"
 />
 </motion.div>
 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="contents">
 <ProcessInsightCard 
 icon={<Play />}
 label="يعمل الآن (Online)"
 value={processes.filter(p => p.status === 'online').length}
 sub="جاهز لاستقبال الطلبات"
 color="emerald"
 pulse={processes.some(p => p.status === 'online')}
 />
 </motion.div>
 <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="contents">
 <ProcessInsightCard 
 icon={<Square />}
 label="متوقف (Stopped)"
 value={processes.filter(p => p.status === 'stopped').length}
 sub="يتطلب تدخل يدوي"
 color="red"
 />
 </motion.div>
 </AnimatePresence>
 </div>

 <div className="glass-panel rounded-3xl overflow-hidden relative">
 <div className="px-6 py-4 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5 flex items-center justify-between backdrop-blur-md">
 <div className="flex items-center gap-3">
 <Activity className="w-4 h-4 text-slate-500" />
 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">قائمة العمليات المراقبة (Runtime)</h3>
 </div>
 <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 dark:bg-white/5 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/5">
 Instance ID: #SVR-442
 </div>
 </div>
 <div className="hidden lg:block overflow-x-auto custom-scrollbar">
 <table className="w-full text-right text-[11px]">
 <thead className="bg-white dark:bg-slate-900/20 text-slate-600 border-b border-slate-200 dark:border-white/5 font-black uppercase tracking-widest">
 <tr>
 <th className="px-6 py-4 sticky right-0 bg-white dark:bg-slate-900/90 backdrop-blur-sm z-10 w-12">#</th>
 <th className="px-6 py-4 text-emerald-400">Runtime Process Info</th>
 <th className="px-6 py-4 text-center">Health Status</th>
 <th className="px-6 py-4 text-center">Resources (CPU/RAM)</th>
 <th className="px-6 py-4 text-center">Lifecycle (Uptime)</th>
 <th className="px-6 py-4 text-left">
     Runtime Actions
     {processes.some(p => p.isReadOnly) && (
       <span className="block text-[8px] text-blue-400 mt-0.5 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded w-max">READ ONLY MODE</span>
     )}
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-white/5 bg-slate-50 dark:bg-slate-950/20">
 {processes.map((proc, idx) => (
 <tr key={proc.id} className="hover:bg-blue-500/[0.03] transition-all group/row border-r-4 border-transparent hover:border-blue-500/50">
 <td className="px-6 py-5 text-slate-600 font-mono sticky right-0 group-hover/row:text-blue-400 bg-transparent transition-colors z-10 text-[10px] font-bold">
 {String(idx).padStart(2, '0')}
 </td>
 <td className="px-6 py-5">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-3">
 <span className="font-black text-slate-200 group-hover/row:text-white transition-colors text-sm tracking-tight">{proc.name}</span>
 <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/5 uppercase tracking-widest group-hover/row:border-blue-500/20 group-hover/row:text-blue-400/60 transition-all">
 {proc.mode}
 </span>
 </div>
  <div className="flex items-center gap-3 mt-1">
  <span className="text-[10px] font-mono text-slate-600">Port: <span className="text-emerald-400 font-bold">{proc.port || 'Vite'}</span></span>
  <span className="text-[10px] font-mono text-slate-600">ID: <span className="text-slate-600 dark:text-slate-400 font-bold">{proc.id}</span></span>
  <span className="text-[10px] font-mono text-slate-700 truncate max-w-[150px]" title={proc.path}>{proc.path}</span>
  </div>
 </div>
 </td>
 <td className="px-6 py-5">
 <div className="flex items-center justify-center">
 {proc.status === 'online' ? (
 <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-[10px] font-black shadow-inner group/status">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
 ONLINE
 </div>
 ) : (
 <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20 text-[10px] font-black shadow-inner">
 <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm dark:shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
 STOPPED
 </div>
 )}
 </div>
 </td>
 <td className="px-6 py-5">
 <div className="flex flex-col items-center gap-2">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono font-bold">
 <Cpu className="w-3 h-3 text-blue-500/60" />
 {proc.cpu}
 </div>
 <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono font-bold">
 <Activity className="w-3 h-3 text-purple-500/60" />
 {proc.mem}
 </div>
 </div>
 <div className="w-24 h-1 bg-white dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
 <div className={`h-full bg-blue-500 scale-x-[0.3] origin-right`}></div>
 </div>
 </div>
 </td>
 <td className="px-6 py-5 text-center">
 <div className="flex flex-col gap-1 items-center">
 <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-mono font-black text-xs">
 <Clock className="w-3.5 h-3.5 text-slate-600" />
 {proc.uptime}
 </div>
 <div className="text-[10px] font-black uppercase tracking-tighter text-slate-600 group-hover/row:text-slate-500 transition-colors">
 Restarts: <span className={proc.restarts > 0 ? 'text-orange-500' : 'text-slate-700'}>{proc.restarts}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-5">
 <div className="flex items-center gap-3 justify-start relative">
 {loadingId === proc.id && (
 <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-20">
 <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
 </div>
 )}
 
 <button 
 title={proc.isReadOnly ? "Read-Only Runtime Insight" : "إعادة تشغيل"}
 onClick={() => handleAction(proc.id, 'restart')}
 disabled={loadingId !== null || proc.isReadOnly}
 className="p-2.5 bg-slate-200 dark:bg-white/5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500/30 transition-all shadow-lg active:scale-95 group/action disabled:opacity-50"
 >
 <RotateCw className="w-4 h-4 group-hover/action:rotate-180 transition-transform duration-500" />
 </button>
 {proc.status === 'online' ? (
 <button 
 title={proc.isReadOnly ? "Read-Only Runtime Insight" : "إيقاف"}
 onClick={() => handleAction(proc.id, 'stop')}
 disabled={loadingId !== null || proc.isReadOnly}
 className="p-2.5 bg-slate-200 dark:bg-white/5 text-slate-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl border border-slate-200 dark:border-white/10 hover:border-orange-500/30 transition-all shadow-lg active:scale-95 disabled:opacity-50"
 >
 <Square className="w-4 h-4 fill-current opacity-40 group-hover:opacity-100" />
 </button>
 ) : (
 <button 
 title={proc.isReadOnly ? "Read-Only Runtime Insight" : "تشغيل"}
 onClick={() => handleAction(proc.id, 'start')}
 disabled={loadingId !== null || proc.isReadOnly}
 className="p-2.5 bg-slate-200 dark:bg-white/5 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all shadow-lg active:scale-95 disabled:opacity-50"
 >
 <Play className="w-4 h-4 fill-current opacity-40 group-hover:opacity-100" />
 </button>
 )}
 <button 
 title={proc.isReadOnly ? "Read-Only Runtime Insight" : "حذف المصدر"}
 onClick={() => handleAction(proc.id, 'delete')}
 disabled={loadingId !== null || proc.isReadOnly}
 className="p-2.5 bg-slate-200 dark:bg-white/5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-slate-200 dark:border-white/10 hover:border-red-500/30 transition-all shadow-lg active:scale-95 ml-2 disabled:opacity-50"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Mobile View: High-Density Operational Cards */}
 <div className="lg:hidden p-4 space-y-4 bg-slate-50 dark:bg-slate-950/20">
 {processes.map((proc) => (
 <div key={proc.id} className="glass-panel p-5 rounded-2xl space-y-4 relative overflow-hidden">
 <div className="flex items-start justify-between">
 <div className="flex flex-col gap-1">
 <div className="flex items-center gap-2">
 <span className="font-black text-white text-sm tracking-tight">{proc.name}</span>
 <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/5 uppercase tracking-widest">{proc.mode}</span>
 </div>
 <span className="text-[10px] font-mono text-slate-600">ID: {proc.id} • Port: {proc.port || 'N/A'}</span>
 </div>
 {proc.status === 'online' ? (
 <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 text-[9px] font-black">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
 ONLINE
 </div>
 ) : (
 <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 text-[9px] font-black">
 <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
 STOPPED
 </div>
 )}
 </div>

 <div className="grid grid-cols-2 gap-3 p-3 bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 font-mono text-[10px]">
 <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
 <Cpu className="w-3 h-3 text-blue-500/60" />
 CPU: <span className="text-white font-bold">{proc.cpu}</span>
 </div>
 <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
 <Activity className="w-3 h-3 text-purple-500/60" />
 MEM: <span className="text-white font-bold">{proc.mem}</span>
 </div>
 <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
 <Clock className="w-3 h-3 text-slate-600" />
 UP: <span className="text-white font-bold">{proc.uptime}</span>
 </div>
 <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
 <RotateCw className="w-3 h-3 text-orange-500/60" />
 RES: <span className="text-white font-bold">{proc.restarts}</span>
 </div>
 </div>

 <div className="flex items-center gap-2 pt-2">
 <button 
 onClick={() => handleAction(proc.id, 'restart')}
 disabled={proc.isReadOnly}
 className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl border border-blue-600/20 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:pointer-events-none"
 >
 <RotateCw className="w-3.5 h-3.5" /> RESTART
 </button>
 {proc.status === 'online' ? (
 <button 
 onClick={() => handleAction(proc.id, 'stop')}
 disabled={proc.isReadOnly}
 className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 rounded-xl border border-orange-600/20 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:pointer-events-none"
 >
 <Square className="w-3.5 h-3.5 fill-current" /> STOP
 </button>
 ) : (
 <button 
 onClick={() => handleAction(proc.id, 'start')}
 disabled={proc.isReadOnly}
 className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-600/20 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:pointer-events-none"
 >
 <Play className="w-3.5 h-3.5 fill-current" /> START
 </button>
 )}
 <button 
 onClick={() => handleAction(proc.id, 'delete')}
 disabled={proc.isReadOnly}
 className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl border border-red-600/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 {proc.isReadOnly && (
    <div className="mt-2 text-center text-[10px] text-blue-400/80 bg-blue-500/10 p-2 rounded-xl border border-blue-500/20 font-bold tracking-widest">
       PROTECTED RUNTIME • SAFE INSPECTION MODE
    </div>
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Runtime Safety Confirmation Modal */}
 <AnimatePresence>
 {confirmAction && (
 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-slate-50 dark:bg-slate-950/90 backdrop-blur-xl"
 onClick={() => setConfirmAction(null)}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }} 
 animate={{ opacity: 1, scale: 1, y: 0 }} 
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-lg glass-panel rounded-3xl shadow-sm dark:shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
 >
 <div className={`h-2 w-full ${confirmAction.type === 'delete' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
 <div className="p-8 text-right">
 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${
 confirmAction.type === 'delete' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
 }`}>
 <AlertCircle className="w-8 h-8" />
 </div>
 
 <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
 تأكيد عملية التشغيل
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm font-bold leading-relaxed mb-8">
 أنت على وشك تنفيذ عملية <span className="text-white">({confirmAction.type.toUpperCase()})</span> على الخدمة <span className="text-blue-400">{confirmAction.name}</span>. 
 يرجى التأكد من أن هذا الإجراء لن يؤثر على استقرار النظام الحالي.
 </p>

 <div className="bg-slate-200 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 mb-8 space-y-3">
 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
 <span>{confirmAction.type === 'delete' ? 'CRITICAL' : 'HIGH'}</span>
 <span>Risk level</span>
 </div>
 <div className="flex items-center gap-3">
 <div className={`flex-1 h-1.5 rounded-full ${confirmAction.type === 'delete' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
 <div className={`flex-1 h-1.5 rounded-full ${confirmAction.type === 'delete' ? 'bg-slate-100 dark:bg-slate-800' : 'bg-orange-500/20'}`}></div>
 <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800"></div>
 </div>
 </div>

 <div className="flex gap-4">
 <button 
 onClick={() => setConfirmAction(null)}
 className="flex-1 py-4 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
 >
 إلغاء
 </button>
 <button 
 onClick={executeConfirmedAction}
 className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 ${
 confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20'
 }`}
 >
 تأكيد الإجراء
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}

const ProcessInsightCard = ({ icon, label, value, sub, color, pulse }: any) => {
 const colorMap: any = {
 blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
 emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
 red: 'text-red-500 bg-red-500/10 border-red-500/20',
 slate: 'text-slate-600 dark:text-slate-400 bg-slate-400/10 border-slate-400/20',
 };

 return (
 <div className="glass-panel p-6 rounded-3xl flex items-center gap-6 group hover:bg-white/[0.03] hover:border-slate-200 dark:border-white/10 transition-all relative overflow-hidden">
 <div className={`absolute -right-6 -top-6 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity ${color === 'blue' ? 'bg-blue-500/10' : color === 'emerald' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}></div>
 <div className={`p-4 rounded-2xl ${colorMap[color]} shadow-lg relative group-hover:scale-110 transition-transform duration-500`}>
 {React.cloneElement(icon, { className: 'w-6 h-6' })}
 {pulse && (
 <div className="absolute top-0 right-0 w-3 h-3">
 <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
 <div className="absolute inset-0 bg-emerald-500 rounded-full"></div>
 </div>
 )}
 </div>
 <div className="relative z-10 flex flex-col gap-0.5">
 <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</p>
 <p className="text-3xl font-black text-white tracking-tighter group-hover:text-white/100 transition-colors">{value}</p>
 <p className="text-[11px] font-bold text-slate-500 group-hover:text-slate-600 dark:text-slate-400 transition-colors">{sub}</p>
 </div>
 </div>
 );
};

