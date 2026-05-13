import React, { useState } from 'react';
import { LayoutDashboard, Play, RefreshCw, Box, AlertTriangle, MonitorPlay, Code, FileCode2, PackageOpen, Globe, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const FRONTEND_COMMANDS = [
 { name: 'npm install', desc: 'تثبيت وتحديث حزم المشروع', icon: PackageOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
 { name: 'npm run build', desc: 'بناء نسخة الإنتاج (Production Build)', icon: Box, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
 { name: 'npm run start', desc: 'تشغيل خادم Next.js / React', icon: Play, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
 { name: 'npm cache clean', desc: 'مسح الكاش الخاص بـ npm', icon: RefreshCw, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
];

const bundleData = [
 { time: 'v1.0', size: 120 }, { time: 'v1.1', size: 125 }, { time: 'v1.2', size: 140 },
 { time: 'v1.3', size: 135 }, { time: 'v1.4', size: 155 }, { time: 'v1.5', size: 150 },
 { time: 'v1.6', size: 145 },
];

export function FrontendCenter() {
 const [loadingCmd, setLoadingCmd] = useState<string | null>(null);
 const [toast, setToast] = useState<{message: string, type: 'success' | 'alert'} | null>(null);

 const showToast = (message: string, type: 'success' | 'alert' = 'success') => {
 setToast({ message, type });
 setTimeout(() => setToast(null), 3500);
 };

 const handleCommand = async (cmd: any) => {
 setLoadingCmd(cmd.name);
 // Simulation of the command
 await new Promise(resolve => setTimeout(resolve, 2500));
 setLoadingCmd(null);
 showToast(`تم تنفيذ الأمر ${cmd.name} بنجاح` );
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

 <motion.div 
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex items-center justify-between"
 >
 <div>
 <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
 <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
 <LayoutDashboard className="w-8 h-8 text-purple-400" />
 </div>
 إدارة الواجهات (Frontend Control)
 </h1>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">التحكم بمشاريع React و Next.js ومراقبة حجم الـ Bundle وأخطاء المتصفح.</p>
 </div>
 <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
 <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm dark:shadow-[0_0_5px_rgba(34,197,94,0.8)] animate-pulse"></div>
 <span className="text-xs font-mono text-slate-700 dark:text-slate-300">Node 20.x | Next.js 14.x</span>
 </div>
 </motion.div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {FRONTEND_COMMANDS.map((cmd, idx) => (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: idx * 0.05 }}
 key={idx} 
 onClick={() => !loadingCmd && handleCommand(cmd)}
 className={`glass-panel p-5 rounded-2xl /50 hover:border-slate-600 transition-all group cursor-pointer active:scale-95 ${loadingCmd === cmd.name ? 'opacity-70 pointer-events-none' : ''}`}
 >
 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${cmd.bg} ${cmd.color} ${cmd.border} shadow-inner`}>
 {loadingCmd === cmd.name ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <cmd.icon className="w-6 h-6" />}
 </div>
 <h3 className="text-white font-mono font-bold mb-2 text-sm flex items-center justify-between">
 {cmd.name}
 <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transform -translate-x-2 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100" />
 </h3>
 <p className="text-slate-600 dark:text-slate-400 text-xs font-medium leading-relaxed">{cmd.desc}</p>
 </motion.div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Bundle Size Monitor */}
 <motion.div 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 className="glass-panel rounded-3xl /50 lg:col-span-2 flex flex-col overflow-hidden"
 >
 <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900/40">
 <h3 className="font-bold text-white flex items-center gap-3">
 <FileCode2 className="w-5 h-5 text-emerald-400" />
 مراقب حجم التطبيق (Bundle Size Tracking)
 </h3>
 <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5 shadow-inner uppercase tracking-wider">Project: admin-frontend</span>
 </div>
 <div className="p-6">
 <div className="grid grid-cols-3 gap-4 mb-8">
 <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner group hover:border-emerald-500/20 transition-all">
 <p className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wide">First Load JS</p>
 <div className="flex items-center gap-2">
 <p className="text-3xl font-black text-white tracking-tight">145 KB</p>
 <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">-5 KB</span>
 </div>
 </div>
 <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner group hover:border-blue-500/20 transition-all">
 <p className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wide">Total Assets</p>
 <p className="text-3xl font-black text-white tracking-tight">2.4 MB</p>
 </div>
 <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner group hover:border-blue-500/20 transition-all">
 <p className="text-slate-500 text-xs font-bold mb-2 uppercase tracking-wide">Build Time</p>
 <p className="text-3xl font-black text-blue-400 tracking-tight">45s</p>
 </div>
 </div>

 <div className="h-56 w-full mt-4 bg-white dark:bg-slate-900/10 rounded-2xl p-2 border border-slate-200 dark:border-white/5">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={bundleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorBundle" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={15} fontStyle="italic" />
 <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
 <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }} labelStyle={{ color: '#64748b', marginBottom: '4px' }} formatter={(value: number) => [`${value} KB`, 'الحجم']} />
 <Area type="monotone" dataKey="size" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBundle)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </motion.div>

 {/* Browser Errors & Logs */}
 <motion.div 
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 className="glass-panel rounded-3xl /50 lg:col-span-1 flex flex-col overflow-hidden"
 >
 <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-900/40">
 <h3 className="font-bold text-white flex items-center gap-3">
 <Globe className="w-5 h-5 text-orange-400" />
 أخطاء المتصفح (Runtime Errors)
 </h3>
 </div>
 <div className="p-6 flex-1 bg-slate-50 dark:bg-slate-950/20">
 <div className="space-y-4">
 
 <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl group transition-all hover:bg-red-500/10">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-red-500 mt-1 shrink-0" />
 <div>
 <h4 className="text-sm font-bold text-red-400 leading-tight">TypeError: Cannot read properties of undefined (reading 'map')</h4>
 <p className="text-[10px] text-slate-500 mt-2 font-mono bg-slate-100 dark:bg-black/30 px-2 py-1 rounded inline-block">at UserList (UserList.tsx:45)</p>
 <div className="flex justify-between items-center mt-3 pt-3 border-t border-red-500/10">
 <span className="text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5">Desktop / Chrome</span>
 <span className="text-[10px] font-medium text-slate-500">قبل 5 دقائق (12 مرة)</span>
 </div>
 </div>
 </div>
 </div>

 <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl group transition-all hover:bg-orange-500/10">
 <div className="flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-orange-500 mt-1 shrink-0" />
 <div>
 <h4 className="text-sm font-bold text-orange-400 leading-tight">Unhandled Promise Rejection: Network Error</h4>
 <p className="text-[10px] text-slate-500 mt-2 font-mono bg-slate-100 dark:bg-black/30 px-2 py-1 rounded inline-block">at axios.get (/api/stats)</p>
 <div className="flex justify-between items-center mt-3 pt-3 border-t border-orange-500/10">
 <span className="text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/5">Mobile / Safari</span>
 <span className="text-[10px] font-medium text-slate-500">قبل قليل (3 مرات)</span>
 </div>
 </div>
 </div>
 </div>

 <button 
 onClick={() => showToast('عرض سجل الأخطاء الكامل')}
 className="w-full py-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all border border-slate-200 dark:border-white/5 shadow-lg active:scale-95"
 >
 عرض جميع الأخطاء
 </button>

 </div>
 </div>
 </motion.div>

 </div>

 </div>
 );
}
