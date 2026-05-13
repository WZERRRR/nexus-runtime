import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Rocket, GitBranch, Server, AlertCircle, Database, LayoutGrid, ShieldCheck, CheckCircle2, Clock, ListOrdered, XCircle, Play, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';

const INITIAL_HISTORY = [
 { id: 1, env: 'DEV', message: 'fixed payment gateway logic (a1b2c3d)', status: 'success', time: 'منذ ساعة' },
 { id: 2, env: 'LIVE', message: 'major UI overhaul (9f8e7d6)', status: 'failed', error: 'Tests did not pass', time: 'أمس' },
];

export function Deploy() {
 const { state } = useLocation();
 const context = state?.project;
 const [history] = useState(INITIAL_HISTORY);
 const [toast, setToast] = useState<{message: string, type: 'success' | 'alert'} | null>(null);

 const showToast = (message: string, type: 'success' | 'alert' = 'success') => {
 setToast({ message, type });
 setTimeout(() => setToast(null), 3000);
 };

 return (
 <div className="space-y-8 relative pb-12">
 <AnimatePresence>
 {toast && (
 <motion.div 
 initial={{ opacity: 0, y: -20, x: '-50%' }}
 animate={{ opacity: 1, y: 20, x: '-50%' }}
 exit={{ opacity: 0, y: -20, x: '-50%' }}
 className={`fixed top-4 left-1/2 z-[100] px-6 py-4 rounded-2xl border shadow-2xl flex items-center gap-3 font-bold text-xs uppercase tracking-widest backdrop-blur-md ${
 toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
 }`}
 >
 <ShieldCheck className="w-5 h-5" />
 {toast.message}
 </motion.div>
 )}
 </AnimatePresence>

 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "نظرة عامة على حالة عمليات النشر والمخططات البرمجية لكافة المشاريع."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="مركز النشر (Deployment Center)"
 actions={
 <div className="flex gap-2">
 <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-inner">
 <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm dark:shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
 <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none">Ready to Deploy</span>
 </div>
 </div>
 }
 />

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-1">
 {/* Overview Stats */}
 <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
 <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
 <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">العمليات النشطة</h3>
 <p className="text-5xl font-black text-white tracking-tighter">0</p>
 <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-slate-100 dark:bg-black/20 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">
 <Activity className="w-3 h-3" /> NO ACTIVE PIPELINES
 </div>
 </div>
 <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
 <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
 <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">نجاح النشر</h3>
 <p className="text-5xl font-black text-emerald-400 tracking-tighter">142</p>
 <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-500/60 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
 <CheckCircle2 className="w-3 h-3" /> LAST 30 DAYS
 </div>
 </div>
 <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
 <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/5 blur-3xl rounded-full"></div>
 <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">فشل النشر</h3>
 <p className="text-5xl font-black text-red-500 tracking-tighter">3</p>
 <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/10">
 <XCircle className="w-3 h-3" /> REQUIRES AUDIT
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-1">
 {/* Active Pipelines */}
 <div className="glass-panel rounded-3xl overflow-hidden">
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Play className="w-4 h-4 text-blue-500" />
 <h3 className="font-black text-white text-[11px] uppercase tracking-widest">خطوط النشر النشطة (Active)</h3>
 </div>
 <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Monitoring Live</span>
 </div>
 <div className="p-16 text-center">
 <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-center mx-auto mb-6">
 <Activity className="w-8 h-8 text-slate-700" />
 </div>
 <p className="text-slate-500 text-xs font-bold uppercase tracking-tight">لا توجد عمليات نشر نشطة في الوقت الحالي</p>
 </div>
 </div>

 {/* Deployment Queue */}
 <div className="glass-panel rounded-3xl overflow-hidden">
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <ListOrdered className="w-4 h-4 text-purple-500" />
 <h3 className="font-black text-white text-[11px] uppercase tracking-widest">طابور الانتظار (Queue)</h3>
 </div>
 <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Priority: High</span>
 </div>
 <div className="p-16 text-center">
 <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-center mx-auto mb-6">
 <Rocket className="w-8 h-8 text-slate-700" />
 </div>
 <p className="text-slate-500 text-xs font-bold uppercase tracking-tight">الطابور فارغ وجاهز لتلقي الأوامر</p>
 </div>
 </div>
 </div>

 {/* Deployment History & Failed */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-1">
 <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20"></div>
 <h3 className="font-black text-white mb-6 flex items-center gap-3 text-xs uppercase tracking-widest">
 <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500">
 <Clock className="w-4 h-4" />
 </div>
 سجل عمليات النشر المؤخرة
 </h3>
 <div className="space-y-4">
 {history.map((job) => (
 <div key={job.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-slate-200 dark:border-white/10 transition-all group">
 <div className="flex items-center gap-4">
 <div className={`w-2 h-2 rounded-full ${job.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
 <div>
 <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{job.message}</p>
 <p className="text-[10px] text-slate-600 font-black uppercase mt-1 tracking-widest">{job.env} ENVIRONMENT</p>
 </div>
 </div>
 <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${job.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/10'}`}>
 {job.status}
 </span>
 </div>
 ))}
 <button onClick={() => showToast('عرض السجل الكامل معطل حتى إشعار آخر', 'alert')} className="w-full py-4 text-[10px] font-black text-slate-600 hover:text-slate-600 dark:text-slate-400 transition-all uppercase tracking-widest border border-dashed border-slate-200 dark:border-white/5 hover:border-slate-200 dark:border-white/10 rounded-2xl">
 عرض السجل الكامل للهجرات والنشر
 </button>
 </div>
 </div>
 <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20"></div>
 <h3 className="font-black text-white mb-6 flex items-center gap-3 text-xs uppercase tracking-widest">
 <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-red-500">
 <AlertCircle className="w-4 h-4" />
 </div>
 تحليل عمليات الفشل (Failed)
 </h3>
 <div className="space-y-4">
 {history.filter(h => h.status === 'failed').map((job) => (
 <div key={job.id} className="flex flex-col gap-3 p-5 rounded-2xl bg-red-500/[0.03] border border-red-500/10">
 <div className="flex items-center justify-between">
 <p className="text-sm font-bold text-red-200 uppercase tracking-tight">{job.message}</p>
 <span className="text-[10px] font-black text-red-900 bg-red-500/20 px-2.5 py-0.5 rounded-lg border border-red-500/10 uppercase tracking-widest">{job.time}</span>
 </div>
 <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-white/5 font-mono text-xs text-red-500/60 leading-relaxed pr-1 flex items-center gap-3">
 <XCircle className="w-4 h-4 shrink-0" />
 ERROR_LOG: Pipeline rejected. Integration tests for payment_gateway failed at node_prod_01.
 </div>
 </div>
 ))}
 <div className="p-10 text-center flex flex-col items-center gap-4 bg-white dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
 <ShieldCheck className="w-8 h-8 text-slate-700" />
 <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">لا توجد تنبيهات فشل إضافية للفحص</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}


