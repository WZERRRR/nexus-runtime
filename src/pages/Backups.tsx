import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
 ArchiveRestore, Download, RefreshCw, Database, FileCode2, HardDrive, 
 CheckCircle2, Clock, AlertTriangle, Calendar, Settings, ShieldCheck, 
 Search, ChevronRight, Play, Trash2, Zap, Save, Activity, Globe,
 History, Server, ExternalLink, Cloud
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';

const BACKUP_HISTORY = [
 { id: 1, type: 'Full System', target: 'Prod-Main-01', size: '45.2 GB', date: '2026-05-08 03:00', status: 'success', duration: '45m', method: 'Incremental' },
 { id: 2, type: 'Database Only', target: 'LIVE DB', size: '24.5 GB', date: '2026-05-08 12:00', status: 'success', duration: '12m', method: 'Full' },
 { id: 3, type: 'User Uploads', target: 'S3 Sync', size: '120.4 GB', date: '2026-05-07 02:00', status: 'success', duration: '1h 15m', method: 'Mirror' },
 { id: 4, type: 'Full System', target: 'Prod-Main-01', size: '44.8 GB', date: '2026-05-07 03:00', status: 'failed', duration: '5m', method: 'Incremental' },
 { id: 5, type: 'Database Only', target: 'LIVE DB', size: '24.1 GB', date: '2026-05-07 12:00', status: 'success', duration: '11m', method: 'Full' },
];

const storageData = [
 { day: 'Mon', size: 180 }, { day: 'Tue', size: 185 }, { day: 'Wed', size: 190 },
 { day: 'Thu', size: 188 }, { day: 'Fri', size: 210 }, { day: 'Sat', size: 215 },
 { day: 'Sun', size: 225 },
];

export function BackupCenter() {
 const [isBackingUp, setIsBackingUp] = useState(false);
 const [activeTab, setActiveTab] = useState('history');
 const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);

 const [confirmBackup, setConfirmBackup] = useState(false);

 const { state } = useLocation();
 const context = state?.project;

 const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
 setToast({ message, type });
 setTimeout(() => setToast(null), 3500);
 };

 const handleStartBackup = () => {
 setConfirmBackup(true);
 };

 const executeBackup = () => {
 setConfirmBackup(false);
 setIsBackingUp(true);
 setTimeout(() => {
 setIsBackingUp(false);
 showToast('تم بدء عملية النسخ الاحتياطي للنظام بالكامل بنجاح', 'success');
 }, 3000);
 };

 return (
 <div className="space-y-8 pb-10 text-right" dir="rtl">
 <AnimatePresence>
 {toast && (
 <motion.div
 initial={{ opacity: 0, y: -20, x: '-50%' }}
 animate={{ opacity: 1, y: 20, x: '-50%' }}
 exit={{ opacity: 0, y: -20, x: '-50%' }}
 className={`fixed top-4 left-1/2 z-[150] px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 font-bold text-sm backdrop-blur-md ${
 toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
 toast.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
 'bg-red-500/10 border-red-500/20 text-red-400'
 }`}
 >
 <ShieldCheck className="w-5 h-5" />
 {toast.message}
 </motion.div>
 )}
 </AnimatePresence>

 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "إدارة استراتيجيات الأرشفة، مراقبة مساحة التخزين، واستعادة البيانات بضغطة زر."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="مركز النسخ الاحتياطي المتقدم"
 actions={
 <div className="flex items-center gap-3">
 <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:bg-slate-800 transition-all text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest">
 <Settings className="w-3.5 h-3.5" />
 الإعدادات
 </button>
 <button 
 onClick={handleStartBackup}
 disabled={isBackingUp}
 className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50"
 >
 {isBackingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
 {isBackingUp ? 'جاري النسخ...' : 'نسخ احتياطي فوري'}
 </button>
 </div>
 }
 />

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <BackupStatCard 
 label="إجمالي مساحة النسخ"
 value="225 GB"
 sub="دورة احتفاظ 30 يوم"
 icon={<HardDrive />}
 color="text-blue-400"
 bgColor="bg-blue-500/10"
 progress={75}
 />
 <BackupStatCard 
 label="معدل النجاح الأسبوعي"
 value="98.5%"
 sub="14/15 عملية ناجحة"
 icon={<CheckCircle2 />}
 color="text-emerald-400"
 bgColor="bg-emerald-500/10"
 progress={98.5}
 />
 <BackupStatCard 
 label="أقرب عملية مجدولة"
 value="12:00 AM"
 sub="نسخ تراكمي لقاعدة البيانات"
 icon={<Clock />}
 color="text-orange-400"
 bgColor="bg-orange-500/10"
 progress={40}
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
 {/* Backup Sources */}
 <div className="lg:col-span-1 space-y-6">
 <div className="flex items-center justify-between px-2">
 <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">مصادر البيانات</h3>
 <button className="text-slate-600 hover:text-white transition-colors">
 <Zap className="w-3.5 h-3.5" />
 </button>
 </div>
 <div className="space-y-4">
 <SourceCard 
 name="قواعد البيانات"
 targets="LIVE, STAGING"
 schedule="يومي 03:00 ص"
 retention="7 أيام"
 icon={<Database />}
 color="text-orange-500"
 bg="bg-orange-500/10"
 active
 />
 <SourceCard 
 name="الكود البرمجي"
 targets="Prod-Main-01"
 schedule="يومي 04:00 ص"
 retention="30 يوم"
 icon={<FileCode2 />}
 color="text-blue-500"
 bg="bg-blue-500/10"
 />
 <SourceCard 
 name="ملفات المستخدمين"
 targets="Amazon S3 Sync"
 schedule="فوري / Mirror"
 retention="غير محدود"
 icon={<Cloud />}
 color="text-purple-500"
 bg="bg-purple-500/10"
 />
 </div>

 <div className="glass-panel p-6 rounded-3xl mt-8">
 <div className="flex items-center gap-3 mb-4">
 <ShieldCheck className="w-4 h-4 text-emerald-500" />
 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">التوافق والأمن</h4>
 </div>
 <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-4">
 جميع النسخ الاحتياطية مشفرة بـ AES-256 ويتم توزيعها جغرافياً لضمان استمرارية الأعمال في حالات الكوارث.
 </p>
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">نظام الحماية النشط يعمل</span>
 </div>
 </div>
 </div>

 {/* History and Stats */}
 <div className="lg:col-span-3 space-y-6">
 {/* Tabs */}
 <div className="flex items-center gap-1 bg-white dark:bg-slate-900/40 rounded-2xl p-1.5 border border-slate-200 dark:border-white/5 shadow-inner">
 {[
 { id: 'history', icon: <History className="w-4 h-4" />, label: 'سجل العمليات' },
 { id: 'growth', icon: <Activity className="w-4 h-4" />, label: 'تحليل الاستهلاك' },
 { id: 'settings', icon: <Settings className="w-4 h-4" />, label: 'قواعد الاستبقاء' }
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
 layoutId="backupTabBg" 
 className="absolute inset-0 bg-emerald-600 rounded-xl shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)] z-[-1]"
 />
 )}
 </button>
 ))}
 </div>

 <AnimatePresence mode="wait">
 {activeTab === 'history' && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="glass-panel rounded-3xl overflow-hidden "
 >
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between px-10">
 <div className="flex items-center gap-4">
 <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
 <h3 className="font-black text-white text-xs uppercase tracking-[0.2em]">أحدث العمليات</h3>
 </div>
 <div className="relative">
 <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
 <input 
 type="text" 
 placeholder="ابحث في السجل..." 
 className="bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl pr-10 pl-4 py-2 text-[10px] font-black text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500/50 transition-all text-right"
 />
 </div>
 </div>
 <div className="p-0 overflow-x-auto overflow-y-visible custom-scrollbar">
 {/* Desktop View */}
 <table className="hidden md:table w-full text-right text-[11px]">
 <thead className="bg-white dark:bg-slate-900/20 text-slate-600 uppercase font-black tracking-widest border-b border-slate-200 dark:border-white/5">
 <tr>
 <th className="px-8 py-5">النوع والهدف</th>
 <th className="px-8 py-5 text-center">التاريخ</th>
 <th className="px-8 py-5 text-center">الحجم</th>
 <th className="px-8 py-5 text-center">الحالة</th>
 <th className="px-8 py-5 text-left">الإجراءات</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-white/5">
 {BACKUP_HISTORY.map((backup) => (
 <tr key={backup.id} className="hover:bg-emerald-500/[0.02] transition-colors group/row">
 <td className="px-8 py-6">
 <div className="flex items-center gap-4">
 <div className={`p-2.5 rounded-xl border ${backup.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-500' : 'bg-red-500/10 border-red-500/10 text-red-500'}`}>
 <Server className="w-4 h-4" />
 </div>
 <div>
 <p className="font-black text-white uppercase tracking-tight">{backup.type}</p>
 <p className="text-[10px] text-slate-500 font-mono mt-0.5">{backup.target} • {backup.method}</p>
 </div>
 </div>
 </td>
 <td className="px-8 py-6 text-center text-slate-600 dark:text-slate-400 font-bold">{backup.date}</td>
 <td className="px-8 py-6 text-center">
 <span className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-2 py-1 rounded text-slate-700 dark:text-slate-300 font-mono font-black">{backup.size}</span>
 </td>
 <td className="px-8 py-6 text-center">
 {backup.status === 'success' ? (
 <div className="inline-flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
 <span className="text-[9px] font-black uppercase tracking-widest">SUCCESS</span>
 </div>
 ) : (
 <div className="inline-flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
 <AlertTriangle className="w-3 h-3" />
 <span className="text-[9px] font-black uppercase tracking-widest">FAILED</span>
 </div>
 )}
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-2 justify-start opacity-0 group-hover/row:opacity-100 transition-opacity">
 <button className="p-2 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-lg text-slate-600 dark:text-slate-400 hover:text-white transition-all border border-slate-200 dark:border-white/5">
 <Download className="w-3.5 h-3.5" />
 </button>
 <button className="p-2 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg text-orange-400 transition-all border border-orange-500/10 shadow-lg">
 <RefreshCw className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>

 {/* Mobile View */}
 <div className="md:hidden grid grid-cols-1 divide-y divide-slate-200 dark:divide-white/5 bg-slate-50 dark:bg-slate-950/20">
 {BACKUP_HISTORY.map((backup) => (
 <div key={backup.id} className="p-5 active:bg-emerald-500/5 transition-all text-right group">
 <div className="flex justify-between items-start mb-4">
 <div className="flex gap-3">
 <div className={`p-2.5 rounded-xl border ${backup.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/10 text-emerald-500' : 'bg-red-500/10 border-red-500/10 text-red-500'}`}>
 <Server className="w-4 h-4" />
 </div>
 <div>
 <p className="font-black text-white text-[11px] uppercase tracking-tight">{backup.type}</p>
 <p className="text-[9px] text-slate-500 font-bold mt-0.5">{backup.target}</p>
 </div>
 </div>
 {backup.status === 'success' ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
 ) : (
 <AlertTriangle className="w-4 h-4 text-red-500" />
 )}
 </div>
 
 <div className="flex items-center justify-between mt-2">
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-mono font-black text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded">{backup.size}</span>
 <span className="text-[10px] text-slate-600 font-bold">{backup.date}</span>
 </div>
 <div className="flex gap-2">
 <button className="p-2.5 bg-slate-200 dark:bg-white/5 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
 <Download className="w-3.5 h-3.5" />
 </button>
 <button className="p-2.5 bg-orange-500/10 rounded-xl text-orange-400 border border-orange-500/10">
 <RefreshCw className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="p-5 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 text-center">
 <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2 w-full">
 تحميل سجل العمليات الكامل
 <ChevronRight className="w-3 h-3 rotate-180" />
 </button>
 </div>
 </motion.div>
 )}

 {activeTab === 'growth' && (
 <motion.div
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.98 }}
 className="glass-panel p-6 md:p-10 rounded-3xl relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>
 <div className="flex justify-between items-center mb-10">
 <div>
 <h3 className="font-black text-white text-xs uppercase tracking-[0.2em] mb-1">تحليل نمو البيانات</h3>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">إجمالي استهلاك التخزين خلال الفترة الماضية</p>
 </div>
 <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
 <Zap className="w-3.5 h-3.5 text-emerald-500" />
 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">+12% هذا الأسبوع</span>
 </div>
 </div>
 <div className="h-80 w-full mt-4" dir="ltr">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={storageData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <XAxis dataKey="day" stroke="#475569" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
 <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
 <Tooltip 
 contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }} 
 itemStyle={{ color: '#10b981', fontWeight: 'bold' }} 
 />
 <Area type="monotone" dataKey="size" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorStorage)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </motion.div>
 )}

 {activeTab === 'settings' && (
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="grid grid-cols-1 md:grid-cols-2 gap-8"
 >
 <div className="glass-panel p-6 md:p-10 rounded-3xl ">
 <h3 className="font-black text-white text-xs uppercase tracking-widest mb-8">سياسة استبقاء النسخ الاحتياطية</h3>
 <div className="space-y-6">
 <p className="text-[11px] text-slate-500 font-bold leading-relaxed mb-8">
 حدد المخطط الزمني للاحتفاظ بالبيانات. النسخ القديمة يتم تدويرها تلقائياً لتوفير المساحة.
 </p>
 <div className="space-y-4">
 <PolicyItem label="النسخ اليومي" value="7 أيام" active />
 <PolicyItem label="اللقطات الأسبوعية" value="4 أسابيع" />
 <PolicyItem label="الأرشفة الشهرية" value="12 شهر" />
 </div>
 <button className="w-full py-4 mt-8 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-slate-200 dark:border-white/5 transition-all">
 حفظ التغييرات
 </button>
 </div>
 </div>

 <div className="glass-panel p-6 md:p-10 rounded-3xl relative overflow-hidden">
 <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-500/10 blur-[80px] pointer-events-none"></div>
 <h3 className="font-black text-white text-xs uppercase tracking-widest mb-8">خيارات متقدمة</h3>
 <div className="space-y-6">
 <div className="flex items-center justify-between p-5 bg-slate-100 dark:bg-black/40 rounded-[1.8rem] border border-slate-200 dark:border-white/5">
 <div>
 <p className="text-xs font-black text-white mb-1">تشفير البيانات</p>
 <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">AES-256 GCM Standard</p>
 </div>
 <div className="w-12 h-6 bg-emerald-600/40 rounded-full border border-emerald-500/50 flex items-center justify-start px-1">
 <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-lg"></div>
 </div>
 </div>
 <div className="flex items-center justify-between p-5 bg-slate-100 dark:bg-black/40 rounded-[1.8rem] border border-slate-200 dark:border-white/5">
 <div>
 <p className="text-xs font-black text-white mb-1">ضغط الملفات (LZ4)</p>
 <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">وضع الكفاءة العالية</p>
 </div>
 <div className="w-12 h-6 bg-emerald-600/40 rounded-full border border-emerald-500/50 flex items-center justify-start px-1">
 <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-lg"></div>
 </div>
 </div>
 <div className="p-5 border border-red-500/20 bg-red-500/5 rounded-[1.8rem] mt-10">
 <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
 <AlertTriangle className="w-3 h-3" /> المنطقة الخطرة
 </h5>
 <p className="text-[9px] text-slate-500 font-bold mb-4">مسح جميع النسخ الاحتياطية القديمة قبل موعدها المحدد.</p>
 <button className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">مسح كاش النسخ الاحتياطي</button>
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 <AnimatePresence>
 {confirmBackup && (
 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-slate-50 dark:bg-slate-950/90 backdrop-blur-xl"
 onClick={() => setConfirmBackup(false)}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }} 
 animate={{ opacity: 1, scale: 1, y: 0 }} 
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-lg glass-panel rounded-3xl shadow-sm dark:shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden text-right"
 >
 <div className="h-2 w-full bg-emerald-500"></div>
 <div className="p-8">
 <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-500 shadow-2xl">
 <Save className="w-8 h-8" />
 </div>
 
 <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
 بدء عملية نسخ احتياطي فوري
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm font-bold leading-relaxed mb-8">
 أنت على وشك تشغيل عملية نسخ كاملة لـ <span className="text-white">Neural Infrastructure</span>. هذه العملية تستهلك موارد النظام وتؤدي إلى زيادة مؤقتة في استخدام القرص الصلب.
 </p>

 <div className="bg-slate-200 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 mb-8 space-y-3">
 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
 <span>Resource Consumption</span>
 <span className="text-emerald-500">Normal</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex-1 h-1.5 rounded-full bg-emerald-500"></div>
 <div className="flex-1 h-1.5 rounded-full bg-emerald-500/40"></div>
 <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800"></div>
 </div>
 </div>

 <div className="flex gap-4">
 <button 
 onClick={() => setConfirmBackup(false)}
 className="flex-1 py-4 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
 >
 إلغاء
 </button>
 <button 
 onClick={executeBackup}
 className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all shadow-emerald-500/20"
 >
 تأكيد البدء
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

const BackupStatCard = ({ label, value, sub, icon, color, bgColor, progress }: any) => (
 <div className="glass-panel p-6 md:p-8 rounded-3xl transition-all group hover: hover:border-slate-200 dark:border-white/10 relative overflow-hidden">
 <div className={`absolute -right-10 -top-10 w-32 h-32 ${bgColor} blur-[80px] opacity-0 group-hover:opacity-40 transition-all duration-700`}></div>
 <div className="flex justify-between items-start mb-6 relative z-10 text-right">
 <div className="space-y-1">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-600 dark:text-slate-400 transition-colors">{label}</p>
 <p className="text-4xl font-black text-white tracking-tighter group-hover:scale-105 origin-right transition-transform duration-700">{value}</p>
 </div>
 <div className={`p-4 rounded-[1.8rem] ${bgColor} ${color} border border-slate-200 dark:border-white/5 transform group-hover:rotate-[15deg] transition-all shadow-2xl group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]`}>
 {React.cloneElement(icon, { className: 'w-7 h-7' })}
 </div>
 </div>
 <div className="space-y-4 relative z-10 text-right">
 <div className="flex items-center gap-3 text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-100 dark:bg-black/20 w-fit px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 mr-auto">
 <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] animate-pulse`}></div>
 {sub}
 </div>
 <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-white/5">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${progress}%` }}
 transition={{ duration: 1.5, ease: "easeOut" }}
 className={`h-full ${color.replace('text-', 'bg-')} rounded-full shadow-[0_0_15px_currentColor]`}
 />
 </div>
 </div>
 </div>
);

const SourceCard = ({ name, targets, schedule, retention, icon, color, bg, active }: any) => (
 <div className={`p-6 rounded-3xl border transition-all group cursor-pointer relative overflow-hidden ${active ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-xl' : 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-white/5 hover:border-slate-200 dark:border-white/10'}`}>
 {active && <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>}
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-4 text-right">
 <div className={`p-3 rounded-2xl ${bg} ${color} shadow-inner`}>
 {React.cloneElement(icon, { className: 'w-5 h-5' })}
 </div>
 <div>
 <h4 className="font-black text-white text-[13px] uppercase tracking-wide group-hover:text-emerald-400 transition-colors">{name}</h4>
 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{targets}</p>
 </div>
 </div>
 <div className="opacity-0 group-hover:opacity-100 transition-opacity">
 <ExternalLink className="w-3.5 h-3.5 text-slate-700" />
 </div>
 </div>
 <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
 <div className="flex items-center gap-1.5">
 <Clock className="w-3 h-3 text-slate-600" />
 <span className="text-[10px] font-bold text-slate-500 tracking-tighter">{schedule}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Save className="w-3 h-3 text-slate-600" />
 <span className="text-[10px] font-bold text-slate-500 tracking-tighter">{retention}</span>
 </div>
 </div>
 </div>
);

const PolicyItem = ({ label, value, active }: any) => (
 <div className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-200 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:bg-white/10'}`}>
 <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{label}</span>
 <span className={`text-[11px] font-black px-3 py-1 rounded-lg ${active ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-white/5'}`}>{value}</span>
 </div>
);
