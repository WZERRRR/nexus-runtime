import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TerminalSquare, Play, RefreshCw, Trash2, Database, Clock, FileText, CheckCircle2, AlertTriangle, Box, ArrowRight, ShieldCheck, X, Loader2, Zap, Terminal, ChevronRight, Activity, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';

const ARTISAN_COMMANDS = [
 { name: 'optimize:clear', desc: 'مسح جميع ملفات الكاش (Config, Views, Routes)', icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
 { name: 'config:cache', desc: 'إعادة بناء كاش الإعدادات وتثبيت التغييرات الجديدة', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
 { name: 'route:cache', desc: 'إعادة بناء كاش المسارات لتحسين سرعة التوجيه', icon: RefreshCw, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
 { name: 'view:cache', desc: 'بناء كاش واجهات Blade المستقرة', icon: Box, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
 { name: 'migrate', desc: 'تحديث الجداول والمخططات لقاعدة البيانات', icon: Database, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
 { name: 'queue:restart', desc: 'إعادة تشغيل طوابير المهام لتبني التغيرات في الكود', icon: Play, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
];

export function LaravelCenter() {
 const [loadingCmd, setLoadingCmd] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState('commands');
 const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
 const [failedJobs, setFailedJobs] = useState([
 { id: 1, name: 'App\\Jobs\\ProcessVideoEncoding', error: 'Exception: Connection timeout to encoding server.', time: '2h ago' },
 { id: 2, name: 'App\\Jobs\\SendWelcomeEmail', error: 'Exception: API Key for Mailgun is missing.', time: '4h ago' },
 ]);

 const { state } = useLocation();
 const context = state?.project;

 const showToast = (message: string, type: 'success' | 'error' = 'success') => {
 setToast({ message, type });
 setTimeout(() => setToast(null), 3500);
 };

 const handleCommand = async (cmdName: string) => {
 if (cmdName === 'migrate') {
 if (!confirm('هل أنت متأكد من تنفيذ Migration على بيئة الإنتاج؟ قد يؤدي هذا لتغيير هيكلية البيانات.')) return;
 }
 
 setLoadingCmd(cmdName);
 // Simulation
 await new Promise(resolve => setTimeout(resolve, 2000));
 
 setLoadingCmd(null);
 showToast(`تم تنفيذ php artisan ${cmdName} بنجاح`);
 };

 const handleRetryJob = async (id: number) => {
 setLoadingCmd(`job-${id}`);
 await new Promise(resolve => setTimeout(resolve, 1500));
 setFailedJobs(prev => prev.filter(job => job.id !== id));
 setLoadingCmd(null);
 showToast('تمت إعادة إرسال المهمة للطابور بنجاح');
 };

 return (
 <div className="space-y-6 relative">
 <AnimatePresence>
 {toast && (
 <motion.div 
 initial={{ opacity: 0, y: -20, x: '-50%' }}
 animate={{ opacity: 1, y: 20, x: '-50%' }}
 exit={{ opacity: 0, y: -20, x: '-50%' }}
 className={`fixed top-4 left-1/2 z-[150] px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 font-bold text-sm backdrop-blur-md ${
 toast.type === 'success' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
 }`}
 >
 <ShieldCheck className="w-5 h-5" />
 {toast.message}
 </motion.div>
 )}
 </AnimatePresence>

 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "التحكم في أداء Laravel، إدارة Artisan، ومراقبة الطوابير والجدولة."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="مركز Laravel المتقدم"
 actions={
 <div className="flex items-center gap-3">
 <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-inner">
 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm dark:shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
 <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">PHP 8.2 | Laravel 10.x</span>
 </div>
 </div>
 }
 />

 <div className="flex items-center gap-1 bg-white dark:bg-slate-900/40 rounded-2xl p-1.5 border border-slate-200 dark:border-white/5 shadow-inner">
 {[
 { id: 'commands', icon: <TerminalSquare className="w-4 h-4" />, label: 'Artisan Commands' },
 { id: 'queues', icon: <Clock className="w-4 h-4" />, label: 'Queue Monitor' },
 { id: 'logs', icon: <FileText className="w-4 h-4" />, label: 'Storage Logs' }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all relative z-10 ${
 activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/5'
 }`}
 >
 {tab.icon}
 {tab.label}
 {activeTab === tab.id && (
 <motion.div 
 layoutId="laravelTabBg" 
 className="absolute inset-0 bg-red-600 rounded-xl shadow-[0_10px_20px_-5px_rgba(220,38,38,0.4)] z-[-1]"
 />
 )}
 </button>
 ))}
 </div>

 <AnimatePresence mode="wait">
 {activeTab === 'commands' && (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-6"
 >
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
 {ARTISAN_COMMANDS.map((cmd, idx) => (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: idx * 0.05 }}
 key={idx} 
 onClick={() => !loadingCmd && handleCommand(cmd.name)}
 className={`glass-panel p-6 rounded-3xl hover:border-red-500/30 transition-all group cursor-pointer active:scale-95 relative overflow-hidden ${loadingCmd === cmd.name ? 'opacity-70 pointer-events-none' : ''}`}
 >
 <div className={`absolute -right-6 -top-6 w-24 h-24 ${cmd.bg} blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity`}></div>
 <div className="flex justify-between items-start mb-6 relative z-10">
 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl transform group-hover:rotate-6 transition-all ${cmd.bg} ${cmd.color} ${cmd.border}`}>
 {loadingCmd === cmd.name ? <Loader2 className="w-7 h-7 animate-spin" /> : <cmd.icon className="w-7 h-7" />}
 </div>
 <div className="flex flex-col items-end gap-1">
 <span className="text-[10px] font-black bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5 text-slate-500 uppercase tracking-widest">Global</span>
 <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
 </div>
 </div>
 <h3 className="text-white font-black mb-3 text-sm flex items-center gap-2 group-hover:text-red-400 transition-colors">
 <span className="text-red-500 font-mono tracking-tighter opacity-50">php artisan</span>
 {cmd.name}
 </h3>
 <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium line-clamp-2">{cmd.desc}</p>
 </motion.div>
 ))}
 </div>

 <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden ">
 <div className="flex items-center gap-4 mb-6">
 <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
 <Terminal className="w-5 h-5 text-red-500" />
 </div>
 <div>
 <h3 className="font-black text-white text-xs uppercase tracking-[0.2em]">Storage & Logs Analyzer</h3>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time PHP log stream analysis</p>
 </div>
 </div>
 <div className="bg-[#050810] p-8 rounded-3xl border border-slate-200 dark:border-white/5 font-mono text-xs text-blue-400 leading-relaxed shadow-inner max-h-64 overflow-auto custom-scrollbar">
 <p className="opacity-40 mb-2 font-black">[DEBUG] Core initialized...</p>
 <p className="opacity-40 mb-2 font-black">[INFO] Laravel kernel loaded.</p>
 <p className="text-emerald-400 font-black mb-2">[SUCCESS] All services green.</p>
 <p className="animate-pulse">_</p>
 </div>
 </div>
 </motion.div>
 )}

 {activeTab === 'queues' && (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="grid grid-cols-1 lg:grid-cols-3 gap-6"
 >
 {/* Queue Monitor */}
 <div className="glass-panel rounded-3xl lg:col-span-2 flex flex-col overflow-hidden shadow-cyan-500/5">
 <div className="p-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900/60 pr-10">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/10">
 <Clock className="w-6 h-6 text-cyan-500" />
 </div>
 <h3 className="font-black text-white uppercase tracking-[0.2em] text-sm">مراقب الطوابير (Live Monitor)</h3>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-[10px] font-black text-slate-500 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/5 uppercase tracking-widest">Redis Engine</span>
 </div>
 </div>
 <div className="p-8">
 <div className="grid grid-cols-3 gap-5 mb-10">
 <QueueStatCard label="Jobs Pending" value="45" icon={<Activity className="text-blue-400" />} color="text-blue-400" bgColor="bg-blue-500/10" />
 <QueueStatCard label="Jobs Failed" value={`${failedJobs.length}`} icon={<AlertTriangle className="text-red-500" />} color="text-red-500" bgColor="bg-red-500/10" />
 <QueueStatCard label="Live Workers" value="4" icon={<Zap className="text-emerald-400" />} color="text-emerald-400" bgColor="bg-emerald-500/10" dot />
 </div>

 <h4 className="text-[11px] font-black text-slate-600 dark:text-slate-400 mb-6 flex items-center gap-3 uppercase tracking-[0.3em]">
 <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-sm dark:shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse"></div>
 سجل الفشل الأخير (Stack Trace)
 </h4>
 <div className="space-y-4">
 <AnimatePresence>
 {failedJobs.map(job => (
 <motion.div 
 layout
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 key={job.id} 
 className="flex items-center justify-between p-6 rounded-3xl bg-red-500/[0.03] border border-red-500/10 group/job hover:bg-red-500/[0.06] transition-all relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-1 h-full bg-red-500 shadow-sm dark:shadow-[0_0_10px_rgba(220,38,38,0.4)]"></div>
 <div className="max-w-[70%]">
 <p className="font-mono text-sm font-black text-red-500 mb-2 truncate">{job.name}</p>
 <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{job.error}</p>
 </div>
 <div className="flex flex-col items-end gap-3">
 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{job.time}</span>
 <button 
 onClick={() => handleRetryJob(job.id)}
 disabled={loadingCmd === `job-${job.id}`}
 className="px-6 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-white text-[10px] font-black rounded-xl border border-slate-200 dark:border-white/5 transition-all shadow-xl active:scale-90 flex items-center gap-3 uppercase tracking-widest group/btn"
 >
 {loadingCmd === `job-${job.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 group-hover/btn:rotate-180 transition-transform duration-500" />}
 Retry Task
 </button>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 {failedJobs.length === 0 && (
 <div className="p-16 text-center bg-emerald-500/[0.02] border border-emerald-500/10 rounded-3xl flex flex-col items-center gap-4 group">
 <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center border border-emerald-500/10 group-hover:scale-110 transition-transform">
 <CheckCircle2 className="w-10 h-10 text-emerald-500/40" />
 </div>
 <div>
 <h5 className="text-white font-black uppercase tracking-widest text-sm">No Failed Tasks</h5>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Your worker pipeline is running smoothly!</p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Scheduled Tasks */}
 <div className="glass-panel rounded-3xl lg:col-span-1 flex flex-col overflow-hidden ">
 <div className="p-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900/60">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
 <FileText className="w-6 h-6 text-emerald-500" />
 </div>
 <h3 className="font-black text-white uppercase tracking-[0.2em] text-sm">المهام المجدولة (Scheduler)</h3>
 </div>
 </div>
 <div className="p-8 flex-1 bg-slate-50 dark:bg-slate-950/20">
 <div className="space-y-10 mt-2">
 <CronItem 
 cron="0 0 * * *" 
 command="backup:run" 
 status="success" 
 lastRun="منذ 12 ساعة"
 color="emerald"
 />
 <CronItem 
 cron="*/5 * * * *" 
 command="sync:payments" 
 status="failed" 
 lastRun="قبل 4 دقائق"
 color="red"
 />
 <CronItem 
 cron="0 2 * * 0" 
 command="telescope:clear" 
 status="pending" 
 lastRun="الأحد القادم 02:00"
 color="slate"
 />
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}

const QueueStatCard = ({ label, value, icon, color, bgColor, dot }: any) => (
 <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner group hover:bg-white dark:bg-slate-900/60 transition-all relative overflow-hidden flex flex-col items-center text-center">
 <div className={`absolute -right-6 -top-6 w-20 h-20 ${bgColor} blur-2xl opacity-0 group-hover:opacity-30 transition-opacity`}></div>
 <div className={`p-3 rounded-2xl ${bgColor} ${color} mb-3 relative z-10 shadow-lg`}>
 {icon}
 </div>
 <p className="text-slate-500 text-[9px] font-black mb-1 uppercase tracking-[0.2em] relative z-10">{label}</p>
 <div className="flex items-center gap-2 relative z-10">
 <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
 {dot && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>}
 </div>
 </div>
);

const CronItem = ({ cron, command, status, lastRun, color }: any) => (
 <div className={`relative pl-8 border-r-2 ${status === 'failed' ? 'border-red-500/30' : status === 'success' ? 'border-emerald-500/30' : 'border-slate-200 dark:border-white/10'} group/cron`}>
 <div className={`absolute top-1 -right-[5.5px] w-2.5 h-2.5 rounded-full shadow-lg ${
 status === 'failed' ? 'bg-red-500 shadow-red-500/40 animate-pulse' : 
 status === 'success' ? 'bg-emerald-500 shadow-emerald-500/40' : 
 'bg-slate-600 shadow-slate-600/40'
 }`}></div>
 <p className="text-xs font-black text-white tracking-[0.2em] font-mono group-hover:text-red-400 transition-colors uppercase">{cron}</p>
 <div className="flex items-center gap-2 mt-2">
 <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-white/5">
 <Command className="w-3 h-3 text-slate-500" />
 </div>
 <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-bold">{command}</p>
 </div>
 <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest mt-4 p-2 rounded-xl bg-slate-100 dark:bg-black/20 w-fit border border-slate-200 dark:border-white/5 ${
 status === 'failed' ? 'text-red-400' : status === 'success' ? 'text-emerald-400' : 'text-slate-500'
 }`}>
 {status === 'failed' ? <AlertTriangle className="w-3 h-3" /> : status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
 {status === 'failed' ? 'Failed' : status === 'success' ? 'Last OK' : 'Scheduled'}: {lastRun}
 </div>
 </div>
);

