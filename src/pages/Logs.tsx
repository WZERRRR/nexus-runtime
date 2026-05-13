import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { runtimeAPI } from '../services/runtimeApi';
import { 
 Terminal, AlignLeft, Search, Filter, Server, Download, 
 Play, Pause, Trash2, ShieldAlert, CheckCircle2, Info, 
 AlertTriangle, Activity, Zap, History, ChevronRight,
 ShieldCheck, ExternalLink, Globe, Cpu, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';

const LOG_LEVELS = ['all', 'info', 'warning', 'error', 'success'] as const;
type LogLevel = typeof LOG_LEVELS[number];

type LogEntry = {
 id: string;
 timestamp: string;
 level: LogLevel;
 service: string;
 message: string;
};

// Removed static mocks for dynamic runtime fetching
const SERVICES: string[] = []; // Will be handled dynamically if needed or just use current logs

export function LogsCenter() {
 const { state } = useLocation();
 const context = state?.project;
 const [logs, setLogs] = useState<LogEntry[]>([]);
 const [isLive, setIsLive] = useState(true);
 const [filterLevel, setFilterLevel] = useState<LogLevel>('all');
 const [filterService, setFilterService] = useState('all');
 const [searchTerm, setSearchTerm] = useState('');
 const scrollRef = useRef<HTMLDivElement>(null);

 // Auto-scroll logic
 useEffect(() => {
 if (isLive && scrollRef.current) {
 scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
 }
 }, [logs, isLive]);

 // Simulate live incoming logs
 useEffect(() => {
 if (!isLive) return;

 const fetchLogs = async () => {
   try {
     if (context?.id) {
       const data = await runtimeAPI.getLogs(context.id.toString());
       if (data && Array.isArray(data)) { setLogs(data as any[]); return; }
     }
     if (false) {
       const projectPath = context.environments?.[0]?.path;
       const pms = await runtimeAPI.getPM2Processes(projectPath);
       
       if (pms.length > 0) {
          const pmLogs = await runtimeAPI.getPM2Logs(pms[0].id);
          const formattedLogs = pmLogs.split('\n').filter(l => l.trim()).map((msg, i) => ({
             id: `pm-${pms[0].id}-${i}`,
             timestamp: new Date().toISOString(),
             level: (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('err')) ? 'error' : msg.toLowerCase().includes('warn') ? 'warning' : 'info',
             service: pms[0].name,
             message: msg
          }));
          setLogs(formattedLogs.slice(-100).reverse() as any[]);
          return;
       }
     }

     const data = await runtimeAPI.getLogs();
     if (data) {
       setLogs(data as any[]);
     }
   } catch (e) {
     console.error('Failed to fetch logs', e);
   }
 };

 fetchLogs();
 const interval = setInterval(fetchLogs, 3000);

 return () => clearInterval(interval);
 }, [isLive, context]);

 const filteredLogs = logs.filter((log) => {
 const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
 const matchesService = filterService === 'all' || log.service === filterService;
 const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
 log.service.toLowerCase().includes(searchTerm.toLowerCase());
 return matchesLevel && matchesService && matchesSearch;
 });

 const getLevelColor = (level: LogLevel) => {
 switch (level) {
 case 'info': return 'text-blue-400 bg-blue-500/10 border-blue-500/10';
 case 'warning': return 'text-orange-400 bg-orange-500/10 border-orange-500/10';
 case 'error': return 'text-red-400 bg-red-500/10 border-red-500/10';
 case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10';
 default: return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/20 border-slate-200 dark:border-white/5';
 }
 };

 return (
 <div className="space-y-8 flex flex-col h-[calc(100vh-6rem)] overflow-hidden text-right" dir="rtl">
 <ProjectHeader 
 projectName={context?.name}
 project={context}
 projectDescription={context ? undefined : "مراقبة حية للأحداث، تشخيص الأعطال، وتحليل أداء الخدمات اللحظي عبر الشبكة."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="مركز السجلات المتقدم"
 actions={
 <div className="flex items-center gap-3">
 <button 
 onClick={() => setIsLive(!isLive)}
 className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
 isLive 
 ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20' 
 : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
 }`}
 >
 {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
 {isLive ? 'إيقاف المراقبة' : 'استئناف البث الحي'}
 </button>
 <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition-all">
 <Download className="w-4 h-4" />
 </button>
 </div>
 }
 />

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
 {/* Left Sidebar: Controls & Stats */}
 <div className="lg:col-span-1 space-y-6 overflow-y-auto custom-scrollbar px-2">
 <div className="flex items-center justify-between px-2 mb-4">
 <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">تحكم المراقبة</h3>
 <Zap className="w-4 h-4 text-emerald-500" />
 </div>

 <div className="space-y-4">
 <div className="glass-panel p-6 rounded-3xl ">
 <div className="flex items-center gap-3 mb-6">
 <Search className="w-4 h-4 text-slate-500" />
 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">بحث سريع</h4>
 </div>
 <input 
 type="text" 
 placeholder="ابحث في الأحداث..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all font-bold text-right"
 />
 </div>

 <div className="glass-panel p-6 rounded-3xl ">
 <div className="flex items-center gap-3 mb-6">
 <Filter className="w-4 h-4 text-slate-500" />
 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">عوامل التصفية</h4>
 </div>
 <div className="space-y-3">
 <select 
 value={filterLevel}
 onChange={(e) => setFilterLevel(e.target.value as LogLevel)}
 className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest outline-none focus:border-emerald-500/50 transition-all cursor-pointer text-right"
 >
 <option value="all">ALL LEVELS</option>
 <option value="info">INFO</option>
 <option value="warning">WARNING</option>
 <option value="error">ERROR</option>
 <option value="success">SUCCESS</option>
 </select>
 <select
 value={filterService}
 onChange={(e) => setFilterService(e.target.value)}
 className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest outline-none focus:border-emerald-500/50 transition-all cursor-pointer text-right"
 >
 <option value="all">ALL SERVICES</option>
 {SERVICES.filter(s => s !== 'all').map(srv => (
 <option key={srv} value={srv}>{srv.toUpperCase()}</option>
 ))}
 </select>
 </div>
 </div>

 <div className="glass-panel p-6 rounded-3xl ">
 <div className="flex items-center gap-3 mb-4">
 <Cpu className="w-4 h-4 text-blue-500" />
 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">تحليل اللحظة</h4>
 </div>
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold text-slate-500">معدل الأحداث (rps)</span>
 <span className="text-[10px] font-black text-emerald-500">12.5 ops</span>
 </div>
 <div className="h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
 <motion.div 
 animate={{ width: ['20%', '45%', '30%', '60%', '40%'] }}
 transition={{ duration: 4, repeat: Infinity }}
 className="h-full bg-emerald-500"
 />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Log Viewer Content */}
 <div className="lg:col-span-3 flex flex-col h-full bg-slate-100 dark:bg-black/20 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl relative">
 <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none"></div>
 
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between px-10 relative z-10 text-right">
 <div className="flex items-center gap-4">
 <History className="w-4 h-4 text-emerald-500" />
 <h3 className="font-black text-white text-xs uppercase tracking-[0.2em]">بث السجلات الحي</h3>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
 {isLive ? 'LIVE STREAM ACTIVE' : 'STREAM PAUSED'}
 </span>
 </div>
 <button 
 onClick={() => setLogs([])}
 className="text-[9px] font-black text-red-500/70 hover:text-red-500 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
 >
 <Trash2 className="w-3 h-3" />
 مسح السجل
 </button>
 </div>
 </div>

 <div 
 ref={scrollRef}
 className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0a0f1c]/80 relative z-10"
 >
 {filteredLogs.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full text-slate-700 opacity-50">
 <AlignLeft className="w-12 h-12 mb-4" />
 <p className="text-xs font-black uppercase tracking-widest">لم يتم العثور على سجلات تطابق البحث</p>
 </div>
 ) : (
 <div className="space-y-1 font-mono text-[11px] leading-relaxed" dir="ltr">
 {filteredLogs.map((log) => (
 <motion.div 
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 key={log.id} 
 className="flex items-start gap-4 p-2 hover:bg-white/[0.02] rounded transition-all group border-l border-transparent hover:border-emerald-500/30"
 >
 <span className="text-slate-600 font-bold shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
 <span className={`px-2 py-0.5 rounded border shrink-0 font-black text-[9px] uppercase tracking-widest ${getLevelColor(log.level)}`}>
 {log.level}
 </span>
 <span className="text-blue-400 font-black shrink-0 tracking-tight">{log.service}:</span>
 <span className="text-slate-700 dark:text-slate-300 break-all">{log.message}</span>
 </motion.div>
 ))}
 </div>
 )}
 </div>

 <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 flex items-center justify-between px-10 relative z-10 shrink-0">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <Globe className="w-3.5 h-3.5 text-slate-600" />
 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">GEO: EU-WEST-2</span>
 </div>
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TLS 1.3 SECURED</span>
 </div>
 </div>
 <div className="text-[9px] font-black text-slate-700 uppercase tracking-widest">
 TOTAL LOG LINES: {logs.length}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
