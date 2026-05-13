import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Database, Activity, HardDrive, AlertTriangle, Terminal, Download, Play, Search, Clock, ShieldAlert, CheckCircle2, LayoutList, RefreshCw, History, Plus, Layers, Zap, ChevronRight, Save, Trash2, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { RuntimeErrorAlert } from '../components/common/RuntimeErrorAlert';
import { RuntimeTable } from '../components/common/RuntimeTable';

const DATABASES_DATA = [
 { id: 'live', name: 'LIVE DB', env: 'Production', size: '24.5 GB', connections: 145, slowQueries: 12, status: 'healthy', host: 'db-prod-01.devcore.internal', engine: 'MySQL 8.0', uptime: '156d 4h' },
 { id: 'staging', name: 'STAGING DB', env: 'Staging', size: '4.2 GB', connections: 15, slowQueries: 0, status: 'healthy', host: 'db-staging.devcore.internal', engine: 'MySQL 8.0', uptime: '12d 8h' },
 { id: 'dev', name: 'DEV DB', env: 'Development', size: '1.8 GB', connections: 8, slowQueries: 2, status: 'warning', host: 'db-dev.devcore.internal', engine: 'PostgreSQL 14', uptime: '2d 1h' },
];

const connectionData = [
 { time: '10:00', value: 120 }, { time: '10:05', value: 135 }, { time: '10:10', value: 140 },
 { time: '10:15', value: 125 }, { time: '10:20', value: 155 }, { time: '10:25', value: 160 },
 { time: '10:30', value: 145 }, { time: '10:35', value: 170 }, { time: '10:40', value: 165 },
];

const TABLES = [
 { name: 'users', rows: '145,200', size: '450 MB', engine: 'InnoDB' },
 { name: 'orders', rows: '420,500', size: '1.2 GB', engine: 'InnoDB' },
 { name: 'order_items', rows: '1,250,000', size: '3.4 GB', engine: 'InnoDB' },
 { name: 'payment_logs', rows: '850,000', size: '2.1 GB', engine: 'InnoDB' },
 { name: 'notifications', rows: '5,400,000', size: '8.5 GB', engine: 'InnoDB' },
];

export function DatabasesCenter() {
 const { state } = useLocation();
 const context = state?.project;

 const [activeTab, setActiveTab] = useState('overview');
 
 // Local DB Data (Mock filtering)
 const availableDatabases = context 
 ? DATABASES_DATA.filter(db => db.name.toLowerCase().includes(context.name.toLowerCase().split(' ')[0].toLowerCase())) 
 : DATABASES_DATA;

 const [activeDb, setActiveDb] = useState(availableDatabases[0]?.id || 'live');
 const [queryCode, setQueryCode] = useState('SELECT * FROM users\nWHERE created_at >= NOW() - INTERVAL 1 DAY\nORDER BY id DESC\nLIMIT 100;');
 const [isRunning, setIsRunning] = useState(false);
 const [isSnapshotting, setIsSnapshotting] = useState(false);
 const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 let mounted = true;
 const fetchData = async () => {
 try {
 setIsLoading(true);
 setError(null);
 await new Promise(resolve => setTimeout(resolve, 800)); // Simulate async network
 } catch (err) {
 if (mounted) setError('فشل مزامنة قواعد البيانات. يرجى التحقق من الخادم.');
 } finally {
 if (mounted) setIsLoading(false);
 }
 };
 fetchData();
 return () => { mounted = false; };
 }, []);

 const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
 setToast({ message, type });
 setTimeout(() => setToast(null), 3500);
 };

 const handleRunQuery = () => {
 if (!queryCode.trim()) return;
 setIsRunning(true);
 setTimeout(() => {
 setIsRunning(false);
 showToast('تم تنفيذ الاستعلام بنجاح وإرجاع 124 صفاً');
 }, 1500);
 };

 const handleSnapshot = () => {
 setIsSnapshotting(true);
 setTimeout(() => {
 setIsSnapshotting(false);
 showToast('تم إنشاء نسخة احتياطية فورية (Snapshot) بنجاح');
 }, 2500);
 };

 const handleRefresh = async () => {
 setIsLoading(true);
 setError(null);
 try {
 await new Promise(resolve => setTimeout(resolve, 1500));
 showToast('تم تحديث بيانات القاعدة بنجاح');
 } catch (err) {
 setError('تعذر تحديث قواعد البيانات.');
 showToast('فشل في عملية الاتصال بالمخدم', 'error');
 } finally {
 setIsLoading(false);
 }
 };

 const currentDb = availableDatabases.find(db => db.id === activeDb) || availableDatabases[0] || DATABASES_DATA[0];

 return (
 <div className="space-y-6 relative">
 <AnimatePresence>
 {toast && (
 <motion.div 
 initial={{ opacity: 0, y: -20, x: '-50%' }}
 animate={{ opacity: 1, y: 20, x: '-50%' }}
 exit={{ opacity: 0, y: -20, x: '-50%' }}
 className={`fixed top-4 left-1/2 z-[150] px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 font-bold text-sm backdrop-blur-md ${
 toast.type === 'success' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
 }`}
 >
 <ShieldCheck className="w-5 h-5" />
 {toast.message}
 </motion.div>
 )}
 </AnimatePresence>

 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "التحكم الكامل في محركات البيانات، تحسين الأداء، وإدارة الجداول."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="مركز إدارة قواعد البيانات"
 actions={
 <div className="flex items-center gap-3">
 <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-inner">
 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm dark:shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
 <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{currentDb.engine}</span>
 </div>
 <button 
 onClick={handleSnapshot}
 disabled={isSnapshotting}
 className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50"
 >
 {isSnapshotting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
 {isSnapshotting ? 'جاري النسخ...' : 'لقطة فورية'}
 </button>
 </div>
 }
 />

 <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar px-1 relative z-10">
 {availableDatabases.map(db => (
 <button
 key={db.id}
 onClick={() => setActiveDb(db.id)}
 className={`min-w-[280px] p-5 rounded-2xl border text-right transition-all flex flex-col gap-4 relative overflow-hidden group ${
 activeDb === db.id 
 ? 'bg-white dark:bg-slate-900/[0.04] border-blue-500/30' 
 : 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.05]'
 }`}
 >
 <div className="flex justify-between items-start z-10 w-full relative">
 <div className="flex flex-col gap-1 items-start">
 <span className={`text-[8px] font-black px-2 py-0.5 rounded border tracking-widest uppercase ${
 db.id === 'live' ? 'bg-red-500/5 text-red-500/60 border-red-500/10' :
 db.id === 'staging' ? 'bg-orange-500/5 text-orange-500/60 border-orange-500/10' :
 'bg-blue-500/5 text-blue-500/60 border-blue-500/10'
 }`}>
 {db.env}
 </span>
 <span className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-tight opacity-60 group-hover:opacity-100 transition-opacity">
 UPTIME: {db.uptime}
 </span>
 </div>
 <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-slate-100 dark:bg-black/20 border-white/[0.03]">
 <div className={`w-1 h-1 rounded-full ${db.status === 'healthy' ? 'bg-emerald-500/60 shadow-sm dark:shadow-[0_0_5px_rgba(16,185,129,0.4)]' : 'bg-yellow-500/60 shadow-sm dark:shadow-[0_0_5px_rgba(234,179,8,0.4)]'}`}></div>
 <span className={`text-[8px] font-black uppercase tracking-widest ${db.status === 'healthy' ? 'text-emerald-500/60' : 'text-yellow-500/60'}`}>
 {db.status === 'healthy' ? 'Active' : 'Warning'}
 </span>
 </div>
 </div>
 <div className="relative z-10 mt-1">
 <h3 className="font-black text-white text-xl flex items-center gap-3 tracking-tight">
 <div className={`p-2 rounded-lg border transition-all ${activeDb === db.id ? 'bg-blue-500/5 border-blue-500/20 text-blue-500/60' : 'bg-white/[0.02] border-white/[0.05] text-slate-700'}`}>
 <Database className="w-4 h-4" />
 </div>
 {db.name}
 </h3>
 <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.03]">
 <div className="flex items-center gap-2">
 <Activity className="w-3 h-3 text-blue-500/40" />
 <span className="text-[10px] font-black text-slate-500">{db.connections} CONNS</span>
 </div>
 <div className="flex items-center gap-2">
 <HardDrive className="w-3 h-3 text-slate-600" />
 <span className="text-[10px] font-black text-slate-500">{db.size}</span>
 </div>
 </div>
 <p className="text-[9px] text-slate-700 font-mono mt-3 w-full truncate bg-slate-100 dark:bg-black/10 p-1.5 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity">
 {db.host}
 </p>
 </div>
 </button>
 ))}
 </div>

 {/* Tabs */}
 <div className="flex items-center gap-1 bg-white/[0.01] rounded-xl p-1 border border-white/[0.03] relative">
 {[
 { id: 'overview', icon: <Layers className="w-3.5 h-3.5" />, label: 'OVERVIEW' },
 { id: 'console', icon: <Terminal className="w-3.5 h-3.5" />, label: 'SQL TERMINAL' },
 { id: 'slow', icon: <Clock className="w-3.5 h-3.5" />, label: 'PERFORMANCE', alert: currentDb.slowQueries },
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${
 activeTab === tab.id ? 'text-white' : 'text-slate-600 hover:text-slate-600 dark:text-slate-400 hover:bg-white/[0.02]'
 }`}
 >
 {tab.icon}
 {tab.label}
 {tab.alert && tab.alert > 0 && (
 <span className="bg-red-500/20 text-red-500 text-[8px] px-1.5 py-0.5 rounded-md border border-red-500/10 ml-1">
 {tab.alert}
 </span>
 )}
 {activeTab === tab.id && (
 <motion.div 
 layoutId="tabBg" 
 className="absolute inset-0 bg-white/[0.03] border border-white/[0.05] rounded-lg z-[-1]"
 />
 )}
 </button>
 ))}
 </div>

 <AnimatePresence mode="wait">
 {activeTab === 'overview' && (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="space-y-6"
 >
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 <DbInsightCard 
 label="الاتصالات النشطة"
 value={`${currentDb.connections}`}
 sub="Active Sessions"
 icon={<Activity />}
 color="text-blue-400"
 bgColor="bg-blue-500/10"
 progress={(currentDb.connections / 1000) * 100}
 />
 <DbInsightCard 
 label="حجم قاعدة البيانات"
 value={currentDb.size}
 sub="Current Storage"
 icon={<HardDrive />}
 color="text-purple-400"
 bgColor="bg-purple-500/10"
 progress={65}
 />
 <DbInsightCard 
 label="الاستعلامات البطيئة"
 value={currentDb.slowQueries}
 sub="Last 24h Window"
 icon={<Zap />}
 color={currentDb.slowQueries > 5 ? 'text-red-400' : 'text-emerald-400'}
 bgColor={currentDb.slowQueries > 5 ? 'bg-red-500/10' : 'bg-emerald-500/10'}
 progress={currentDb.slowQueries > 0 ? 30 : 0}
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="glass-panel p-6 md:p-8 rounded-3xl lg:col-span-2 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none"></div>
 <div className="flex justify-between items-center mb-8">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/10 shadow-inner">
 <Activity className="w-6 h-6 text-orange-500" />
 </div>
 <div>
 <h3 className="font-black text-white uppercase tracking-[0.2em] text-xs">معدل الاتصالات (Live Stats)</h3>
 <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">Monitoring connection spikes in real-time</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
 <span className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">Live Monitor</span>
 </div>
 </div>
 <div className="h-64 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={connectionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorConn" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
 <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
 <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
 <Tooltip 
 contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }} 
 itemStyle={{ color: '#f97316', fontWeight: 'bold' }} 
 />
 <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorConn)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="glass-panel rounded-3xl flex flex-col relative overflow-hidden group">
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <LayoutList className="w-4 h-4 text-slate-600 dark:text-slate-400" />
 <h3 className="font-black text-white text-[11px] uppercase tracking-[0.2em]">أكبر الجداول (Data Map)</h3>
 </div>
 <button onClick={() => showToast('البحث معطل حالياً', 'warning')} className="p-1.5 hover:bg-slate-200 dark:bg-white/5 rounded-lg text-slate-500 transition-colors">
 <Search className="w-4 h-4" />
 </button>
 </div>
 <div className="p-0 flex-1 overflow-auto custom-scrollbar">
 <AnimatePresence mode="wait">
 {isLoading ? (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }}
 className="p-4 space-y-4 w-full h-[600px] bg-slate-50 dark:bg-slate-950/20"
 >
 {Array.from({ length: 5 }).map((_, i) => (
 <div key={i} className="flex items-center justify-between p-4 bg-slate-200 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 animate-pulse">
 <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded"></div>
 <div className="h-4 w-16 bg-slate-200 dark:bg-white/10 rounded"></div>
 <div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded"></div>
 </div>
 ))}
 </motion.div>
 ) : error ? (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }}
 className="p-12 w-full h-full flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-950/20"
 >
 <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
 <p className="text-red-400 font-bold mb-4">{error}</p>
 <button onClick={handleRefresh} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold border border-red-500/20 hover:bg-red-500/30 transition-all">إعادة المحاولة</button>
 </motion.div>
 ) : (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 >
 {/* Desktop Table View */}
 <table className="hidden md:table w-full text-right text-[11px]">
 <thead className="bg-white dark:bg-slate-900/20 text-slate-600 sticky top-0 uppercase font-black tracking-widest border-b border-slate-200 dark:border-white/5 backdrop-blur-md z-10">
 <tr>
 <th className="px-6 py-4 text-right">الجدول</th>
 <th className="px-6 py-4 text-center">الصفوف</th>
 <th className="px-6 py-4 text-left">الحجم</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-white/5">
 {TABLES.map((table, idx) => (
 <tr 
 key={idx} 
 onClick={() => showToast(`عرض بيانات جدول ${table.name}`)}
 className="hover:bg-orange-500/5 transition-all group/row cursor-pointer border-r-2 border-transparent hover:border-orange-500"
 >
 <td className="px-6 py-5 font-black text-blue-400 group-hover/row:text-orange-400 transition-colors uppercase tracking-tight">{table.name}</td>
 <td className="px-6 py-5 text-center text-slate-700 dark:text-slate-300 font-bold tracking-tight">{table.rows}</td>
 <td className="px-6 py-5 text-left font-mono text-slate-500 font-bold group-hover/row:text-slate-700 dark:text-slate-300 transition-colors">{table.size}</td>
 </tr>
 ))}
 </tbody>
 </table>

 {/* Mobile Grid View */}
 <div className="md:hidden grid grid-cols-1 divide-y divide-slate-200 dark:divide-white/5 bg-slate-50 dark:bg-slate-950/20">
 {TABLES.map((table, idx) => (
 <div 
 key={idx} 
 onClick={() => showToast(`عرض بيانات جدول ${table.name}`)}
 className="p-5 active:bg-orange-500/10 transition-all flex items-center justify-between group"
 >
 <div className="flex flex-col gap-1 items-start">
 <span className="font-black text-blue-400 text-xs uppercase tracking-tight group-active:text-orange-400">{table.name}</span>
 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Rows: {table.rows}</span>
 </div>
 <div className="flex flex-col items-end gap-1">
 <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-300">{table.size}</span>
 <span className="flex items-center gap-1 text-[8px] font-black text-slate-500 uppercase tracking-widest">
 <ChevronRight className="w-3 h-3 text-slate-700" /> View Data
 </span>
 </div>
 </div>
 ))}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 text-center">
 <button onClick={() => showToast('عرض جميع الجداول قيد التطوير', 'warning')} className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center gap-2 w-full">
 عرض جميع الجداول (54)
 <ChevronRight className="w-3 h-3" />
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {activeTab === 'console' && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.98 }}
 className="space-y-4"
 >
 <div className="glass-panel overflow-hidden rounded-xl border-white/[0.03]">
 <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/80 backdrop-blur-md">
 <div className="flex items-center gap-5">
 <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-white/[0.05]">
 <Terminal className="w-4 h-4 text-slate-500" />
 </div>
 <div>
 <span className="text-[9px] font-black text-blue-500/60 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 uppercase tracking-widest mb-0.5 block">{currentDb.name}</span>
 <h4 className="text-[11px] font-black text-white uppercase tracking-widest">SQL Terminal Console</h4>
 </div>
 </div>
 <div className="flex gap-4">
 <button onClick={() => showToast('سجل الاستعلامات غير متوفر في نمط العرض الحي', 'warning')} className="flex items-center gap-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/5 active:scale-95">
 <History className="w-4 h-4" />
 Query History
 </button>
 <button 
 onClick={handleRunQuery}
 disabled={isRunning}
 className="flex items-center gap-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 group disabled:opacity-50 disabled:cursor-wait"
 >
 {isRunning ? (
 <RefreshCw className="w-4 h-4 animate-spin" />
 ) : (
 <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
 )}
 {isRunning ? 'جاري التنفيذ...' : 'Execute Run'}
 </button>
 </div>
 </div>
 <div className="relative group/console">
 {isRunning && (
 <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950/40 backdrop-blur-sm z-10 flex items-center justify-center">
 <div className="flex flex-col items-center gap-4">
 <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
 <span className="text-xs font-black text-orange-400 uppercase tracking-[0.3em]">Querying Runtime...</span>
 </div>
 </div>
 )}
 <textarea
 value={queryCode}
 onChange={(e) => setQueryCode(e.target.value)}
 className="w-full h-72 bg-[#050811] text-blue-400/80 font-mono text-sm p-6 focus:outline-none resize-none custom-scrollbar leading-relaxed selection:bg-blue-500/20"
 spellCheck="false"
 />
 </div>
 </div>
 
 <div className="glass-panel rounded-xl overflow-hidden border-white/[0.03]">
 <div className="p-4 border-b border-white/[0.03] bg-white dark:bg-slate-900/40 flex justify-between items-center px-6">
 <div className="flex items-center gap-3">
 <LayoutList className="w-3.5 h-3.5 text-emerald-500/60" />
 <h3 className="text-[10px] font-black text-white uppercase tracking-widest">مخرجات الاستعلام (Results Payload)</h3>
 </div>
 <button 
 onClick={() => showToast('EXPORTING CSV...')}
 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.03]"
 >
 <Download className="w-3.5 h-3.5" />
 Export CSV
 </button>
 </div>
 <div className="py-16 text-center flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-950/20">
 <div className="p-4 bg-white dark:bg-slate-900/50 rounded-full border border-white/[0.03]">
 <Terminal className="w-8 h-8 text-slate-800" />
 </div>
 <div className="space-y-1">
 <h4 className="text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">Terminal Ready</h4>
 <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest leading-relaxed max-w-sm">
 لم يتم تشغيل استعلام بعد. أدخل الكود الخاص بك في الكونسول أعلاه ثم اضغط على Run.
 </p>
 </div>
 </div>
 </div>
 </motion.div>
 )}

 {activeTab === 'slow' && (
 <motion.div 
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="glass-panel rounded-3xl relative overflow-hidden "
 >
 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-100 dark:from-red-500/0 via-slate-100 dark:via-red-500/20 to-slate-100 dark:to-red-500/0"></div>
 <div className="p-8 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900/80 pr-10">
 <div className="flex items-center gap-5">
 <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/10">
 <Clock className="w-6 h-6 text-red-500" />
 </div>
 <h3 className="font-black text-white uppercase tracking-[0.2em] text-sm">تحليل الاستعلامات البطيئة (Performance Audit)</h3>
 </div>
 <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/5">
 LAST 24 HOURS
 </div>
 </div>
 <div className="divide-y divide-slate-200 dark:divide-white/5">
 {currentDb.slowQueries > 0 ? (
 <div className="p-8 flex flex-col gap-6 group/entry transition-all hover:bg-red-500/[0.02]">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <span className="text-[10px] font-black text-red-500 bg-red-400/10 px-4 py-2 rounded-2xl border border-red-500/20 shadow-lg uppercase tracking-[0.2em]">Execution Time: 4.2s</span>
 <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm dark:shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
 </div>
 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover/entry:text-slate-600 dark:text-slate-400 transition-colors">منذ ساعتين (2h ago)</span>
 </div>
 <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl border border-slate-200 dark:border-white/5 font-mono text-sm text-blue-400/90 whitespace-pre-wrap leading-relaxed shadow-3xl">
 <span className="text-slate-700 mr-2">QUERY_RAW:</span> 
 SELECT COUNT(*) FROM notifications n \nJOIN users u ON n.user_id = u.id \nWHERE n.read_at IS NULL AND u.status = 'active';
 </div>
 <div className="flex items-center gap-6 pt-2">
 <button onClick={() => { setActiveTab('console'); showToast('تلميح: سيتم نقل الاستعلام تلقائياً قريباً', 'success') }} className="text-[10px] font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-3">
 <Play className="w-4 h-4" /> التعديل في الكونسول
 </button>
 <button onClick={() => showToast('تم تجاهل التنبيه وإخفاؤه', 'success')} className="text-[10px] font-black text-slate-600 hover:text-slate-600 dark:text-slate-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2">
 <Trash2 className="w-4 h-4" /> تجاهل
 </button>
 </div>
 </div>
 ) : (
 <div className="p-24 text-center text-slate-600 dark:text-slate-400 flex flex-col items-center gap-8 bg-slate-50 dark:bg-slate-950/20">
 <div className="w-24 h-24 bg-green-500/5 rounded-full border border-green-500/10 flex items-center justify-center relative group">
 <div className="absolute inset-0 bg-green-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
 <CheckCircle2 className="w-12 h-12 text-green-500" />
 </div>
 <div className="space-y-3">
 <h4 className="text-white font-black uppercase tracking-widest text-lg">أداء مثالي (All Clean)</h4>
 <p className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed max-w-sm mx-auto">
 لم يتم رصد أي استعلامات بطيئة. قاعدة البيانات تعمل في المنطقة الخضراء!
 </p>
 </div>
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 </div>
 );
}

const DbInsightCard = ({ label, value, sub, icon, color, bgColor, progress }: any) => (
 <div className="glass-panel p-5 rounded-2xl transition-all group border-white/[0.03] hover:border-white/[0.08] relative overflow-hidden">
 <div className="flex justify-between items-start mb-4 relative z-10 text-right">
 <div className="space-y-1">
 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">{label}</p>
 <p className="text-2xl font-black text-white tracking-tight">{value}</p>
 </div>
 <div className={`p-2.5 rounded-lg ${bgColor} ${color} border border-white/[0.03] transition-all`}>
 {React.cloneElement(icon, { className: 'w-4 h-4' })}
 </div>
 </div>
 <div className="space-y-3 relative z-10 text-right">
 <div className="flex items-center gap-2 text-[8px] text-slate-500 font-black uppercase tracking-widest bg-slate-100 dark:bg-black/10 w-fit px-2 py-1 rounded-md border border-white/[0.03] ml-auto">
 <div className={`w-1 h-1 rounded-full ${color.replace('text-', 'bg-')} shadow-[0_0_4px_currentColor] opacity-60`}></div>
 {sub}
 </div>
 {progress !== undefined && (
 <div className="h-1 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.03]">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${progress}%` }}
 transition={{ duration: 1, ease: "easeOut" }}
 className={`h-full ${color.replace('text-', 'bg-')} rounded-full opacity-40`}
 />
 </div>
 )}
 </div>
 </div>
);
