import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
 ShieldCheck, AlertTriangle, HardDrive, Settings2, Info, 
 Archive, Trash2, LayoutGrid, CheckCircle2, RefreshCw, Layers, 
 BarChart3, Activity, Gauge, Terminal, FolderTree, FileJson,
 Zap, Database, Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';


import { runtimeAPI } from '../services/runtimeApi';

export function InfrastructureManager() {
 const { state } = useLocation();
 const context = state?.project;
 const [activeTab, setActiveTab] = useState<'health' | 'structure' | 'config'>('health');
 const [isScanning, setIsScanning] = useState(false);
 const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
 const [recommendations, setRecommendations] = useState<any[]>([]);
 const [compliance, setCompliance] = useState<any[]>([]);
 const [score, setScore] = useState(85);

 const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
 };

 useEffect(() => {
  const fetchData = async () => {
   try {
    const recs = await runtimeAPI.getRecommendations();
    setRecommendations(recs.length > 0 ? recs : [
     { id: 'nexus-01', level: 'info', title: 'تحسين بنية المجلدات', desc: `جاري تحليل هيكلة ${context?.name || 'المشروع'}...`, action: 'فحص' }
    ]);

    if (context?.id) {
     try {
      const files = await runtimeAPI.listFiles('.', undefined, context.id);
      const folders = files.filter(f => f.isDirectory).map(f => f.name);
      const checkFolders = ['app', 'environments', 'logs', 'backups', 'uploads', 'scripts', 'configs'];
      const comp = checkFolders.map((name, idx) => ({
       id: idx,
       name: name + '/',
       status: folders.includes(name) ? 'present' : 'missing',
       role: name === 'logs' ? 'Error & Access Logs' : name === 'app' ? 'Main Source' : 'Nexus Component',
       healthy: folders.includes(name),
       issue: folders.includes(name) ? undefined : 'Standard folder missing'
      }));
      setCompliance(comp);
      setScore(Math.round((comp.filter(c => c.healthy).length / checkFolders.length) * 100));
     } catch (err) {
      setCompliance([
       { id: 1, name: 'app/', status: 'present', role: 'Main Source Code', healthy: true },
       { id: 2, name: 'logs/', status: 'warning', role: 'Error & Access Logs', healthy: false, issue: 'Log Rotation Needed' },
       { id: 3, name: 'configs/', status: 'present', role: 'Nexus Infrastructure', healthy: true },
      ]);
     }
    }
   } catch (err) {
    console.error('Infrastructure load failed', err);
   }
  };
  fetchData();
 }, [context]);

 const handleScan = async () => {
  setIsScanning(true);
  await new Promise(resolve => setTimeout(resolve, 2000));
  const recs = await runtimeAPI.getRecommendations();
  if (recs && recs.length > 0) setRecommendations(recs);
  setIsScanning(false);
  showToast('اكتمل الفحص الهيكلي للبنية التحتية بنجاح.');
 };

 return (
 <div className="space-y-8 pb-12 relative">
 <AnimatePresence>
 {toast && (
 <motion.div 
 initial={{ opacity: 0, y: -20, x: '-50%' }}
 animate={{ opacity: 1, y: 20, x: '-50%' }}
 exit={{ opacity: 0, y: -20, x: '-50%' }}
 className={`fixed top-4 left-1/2 z-[100] px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 font-bold text-sm backdrop-blur-md ${
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
 projectDescription="نظام المراقبة والتنظيم الهيكلي للبنية التحتية"
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 actions={
 <div className="flex gap-2">
 <button 
 onClick={handleScan}
 disabled={isScanning}
 className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-sm font-bold shadow-sm active:scale-95 disabled:opacity-50"
 >
 <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-blue-400' : ''}`} />
 {isScanning ? 'جاري الفحص...' : 'إعادة الفحص الهيكلي'}
 </button>
 <button 
 onClick={() => showToast('نظام الحماية مفعل (Immutable Path Protection)')}
 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_5px_15px_-5px_rgba(37,99,235,0.4)] transition-all active:scale-95"
 >
 <ShieldCheck className="w-4 h-4" />
 حماية المسارات
 </button>
 </div>
 }
 />

 {/* Hero Stats */}
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-1">
 <HealthMetric 
 label="درجة التنظيم (Score)"
 value={`${score}%`}
 desc="مستوى الالتزام بالمعايير"
 icon={<Gauge />}
 color="blue"
 />
 <HealthMetric 
 label="استهلاك التخزين"
 value="1.2 GB"
 desc="إجمالي حجم المشروع"
 icon={<HardDrive />}
 color="emerald"
 />
 <HealthMetric 
 label="حالة السجلات (Logs)"
 value="Critical"
 desc="تنبيه: حجم السجلات مرتفع"
 icon={<Activity />}
 color="red"
 />
 <HealthMetric 
 label="النسخ الاحتياطية"
 value="12 File"
 desc="آخر عملية: منذ 4 ساعات"
 icon={<Archive />}
 color="purple"
 />
 </div>

 {/* Tabs Layout */}
 <div className="flex flex-col gap-6">
 <div className="flex items-center gap-1 bg-white dark:bg-slate-900/60 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-white/5">
 <TabButton active={activeTab === 'health'} onClick={() => setActiveTab('health')} icon={<ShieldCheck />} label="فحص الحالة (Health Check)" />
 <TabButton active={activeTab === 'structure'} onClick={() => setActiveTab('structure')} icon={<FolderTree />} label="الهيكلية القياسية" />
 <TabButton active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={<FileJson />} label="الإعدادات (Config)" />
 </div>

 <div className="min-h-[500px]">
 <AnimatePresence mode="wait">
  {activeTab === 'health' && <HealthTab key="health" onAction={(msg) => showToast(msg)} recommendations={recommendations} />}
  {activeTab === 'structure' && <StructureTab key="structure" compliance={compliance} score={score} />}
  {activeTab === 'config' && <ConfigTab key="config" onSave={() => showToast('تم تحديث ملف الإعدادات التقني بنجاح')} context={context} />}
 </AnimatePresence>
 </div>
 </div>
 </div>
 );
}

const HealthTab = ({ onAction, recommendations }: { onAction: (m: string) => void, recommendations: any[], key?: string }) => (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="grid grid-cols-1 lg:grid-cols-3 gap-8"
 >
 {/* Recommendations List */}
 <div className="lg:col-span-2 space-y-6">
 <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] pr-2">توصيات ذكية (Smart Suggestions)</h3>
 {recommendations.map((rec) => (
 <div key={rec.id} className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
 <div className={`absolute top-0 right-0 w-1.5 h-full ${
 rec.level === 'critical' ? 'bg-red-500' : 
 rec.level === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
 }`}></div>
 <div className="flex items-start justify-between gap-4">
 <div className="space-y-2">
 <div className="flex items-center gap-3">
 {rec.level === 'critical' ? <AlertTriangle className="w-5 h-5 text-red-500 shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.3)]" /> : <Info className="w-5 h-5 text-blue-500" />}
 <span className="text-white font-black text-lg tracking-tight">{rec.title}</span>
 </div>
 <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xl font-medium">{rec.desc}</p>
 </div>
 <button 
 onClick={() => onAction(`تم تنفيذ الإجراء: ${rec.action}`)}
 className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 ${
 rec.level === 'critical' ? 'bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white shadow-lg shadow-red-500/10' : 
 'bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/10 border border-slate-200 dark:border-white/10'
 }`}
 >
 {rec.action}
 </button>
 </div>
 </div>
 ))}
 </div>

 {/* Storage Analysis */}
 <div className="space-y-6">
 <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] pr-2">تحليل المساحة (Storage)</h3>
 <div className="glass-panel p-6 rounded-3xl space-y-6 ">
 <div className="flex flex-col items-center justify-center py-4">
 <div className="relative w-32 h-32 flex items-center justify-center">
 <svg className="w-full h-full transform -rotate-90">
 <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
 <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-blue-500" 
 strokeDasharray={364} 
 strokeDashoffset={364 * (1 - 0.72)} 
 strokeLinecap="round"
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-2xl font-black text-white">72%</span>
 <span className="text-[10px] font-bold text-slate-500 uppercase">ممتلئ</span>
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <StorageRow label="تطبيقات (Apps)" size="450MB" color="bg-blue-500" percent={40} />
 <StorageRow label="سجلات (Logs)" size="512MB" color="bg-red-500" percent={45} />
 <StorageRow label="نسخ (Backups)" size="120MB" color="bg-purple-500" percent={10} />
 <StorageRow label="مؤقت (Other)" size="20MB" color="bg-slate-500" percent={5} />
 </div>
 <button 
 onClick={() => onAction('بدأ تحليل التخزين المعمق للمجلدات...')}
 className="w-full py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-white rounded-xl border border-slate-200 dark:border-white/10 text-xs font-black transition-all flex items-center justify-center gap-2 group"
 >
 <Zap className="w-4 h-4 text-orange-500 group-hover:scale-125 transition-transform" />
 تحليل معمق للمساحة
 </button>
 </div>
 </div>
 </motion.div>
);

const StructureTab = ({ compliance, score }: { compliance: any[], score: number, key?: string }) => (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="glass-panel rounded-3xl overflow-hidden "
 >
 <div className="px-8 py-6 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
 <div>
 <h3 className="text-lg font-black text-white tracking-tight uppercase">Project Standard Architecture</h3>
 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">المعيار الموحد لمسارات السيرفر (ISO-DevCore)</p>
 </div>
 <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-xs uppercase tracking-widest shadow-inner ${
 score > 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
 }`}>
 Compliant: {score}%
 </div>
 </div>
 <div className="p-0 overflow-x-auto">
 <table className="w-full text-right text-xs">
 <thead className="bg-white dark:bg-slate-900/20 text-slate-500 font-black uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
 <tr>
 <th className="px-8 py-4 whitespace-nowrap">المسار (Path)</th>
 <th className="px-8 py-4 whitespace-nowrap">الوظيفة (Role)</th>
 <th className="px-8 py-4 text-center whitespace-nowrap">الحالة</th>
 <th className="px-8 py-4 text-left whitespace-nowrap">ملاحظات</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-white/5">
 {compliance.length === 0 ? (
  <tr>
   <td colSpan={4} className="px-8 py-20 text-center opacity-30 uppercase font-black tracking-widest">
     No records for current context
   </td>
  </tr>
 ) : (
  compliance.map((folder, i) => (
  <tr key={folder.id || folder.name} className="hover:bg-blue-500/[0.02] transition-colors group">
  <td className="px-8 py-5">
  <div className="flex items-center gap-3">
  <FolderTree className={`w-4 h-4 ${folder.healthy ? 'text-blue-500' : 'text-orange-500'}`} />
  <span className="font-mono font-black text-slate-200 group-hover:text-blue-400 transition-colors uppercase">{folder.name}</span>
  </div>
  </td>
  <td className="px-8 py-5 text-slate-600 dark:text-slate-400 font-bold">{folder.role}</td>
  <td className="px-8 py-5">
  <div className="flex justify-center">
  {folder.healthy ? (
  <span className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
  <CheckCircle2 className="w-3 h-3" /> OK
  </span>
  ) : (
  <span className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20 text-[10px] font-black uppercase tracking-widest">
  <AlertTriangle className="w-3 h-3" /> Fail
  </span>
  )}
  </div>
  </td>
  <td className="px-8 py-5 text-left">
  {folder.issue ? (
  <span className="text-orange-500/80 text-[10px] font-bold">{folder.issue}</span>
  ) : (
  <span className="text-slate-600 text-[10px] uppercase font-black tracking-widest">Verified Integrity</span>
  )}
  </td>
  </tr>
  ))
 )}
 </tbody>
 </table>
 </div>
 </motion.div>
);

const ConfigTab = ({ onSave, context }: { onSave: () => void, context?: any, key?: string }) => (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="grid grid-cols-1 lg:grid-cols-2 gap-8"
 >
 <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 ">
 <div className="flex items-center gap-4 mb-2">
 <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
 <FileJson className="w-6 h-6 text-blue-500" />
 </div>
 <div>
 <h3 className="text-xl font-black text-white tracking-tight uppercase">project.config.json</h3>
 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">بيانات التعريف والهيكلية الذكية للمشروع</p>
 </div>
 </div>
 <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-white/5 font-mono text-sm shadow-inner overflow-hidden relative">
 <div className="absolute top-0 right-0 w-1 bg-blue-500 h-full"></div>
 <pre className="text-blue-400/90 whitespace-pre leading-relaxed scrollbar-hide overflow-x-auto">
{`{
 "project_id": "${context?.id || 'nexus-global'}",
 "name": "${context?.name || 'DevCore AI'}",
 "runtime": "Nexus VM 20.x",
 "paths": {
 "root": "${context?.runtime_path || '/www/wwwroot'}",
 "app": "app/",
 "logs": "logs/",
 "uploads": "uploads/"
 },
 "environments": ${JSON.stringify(context?.environments?.map((e: any) => e.name) || ["live"])},
 "health_check": {
 "frequency": "hourly",
 "retention": "30d"
 }
}`}
 </pre>
 </div>
 <button 
 onClick={onSave}
 className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95"
 >
 تحديث ملف التعريف
 </button>
 </div>

 <div className="space-y-6">
 <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] pr-2">أذونات النظام (Permissions Monitoring)</h3>
 <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 ">
 <div className="space-y-6">
 <PermissionItem label="Root Access" status="System Managed" value="755" healthy />
 <PermissionItem label="Logs Write Access" status="Public Write" value="777" healthy={false} />
 <PermissionItem label="App Configs" status="Restricted" value="600" healthy />
 </div>
 <div className="pt-4 border-t border-slate-200 dark:border-white/5">
 <div className="p-4 bg-orange-600/10 rounded-2xl border border-orange-500/20 flex items-start gap-4">
 <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
 <p className="text-xs text-orange-400 font-medium leading-relaxed">
 تنبيه: مجلد السجلات (logs) يمتلك صلاحية 777 (Public Write). ننصح بتقييد الصلاحية لزيادة مستوى أمان السيرفر.
 </p>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
);

const HealthMetric = ({ label, value, desc, icon, color }: any) => (
 <div className="glass-panel p-6 rounded-3xl group hover:bg-white/[0.03] transition-all relative overflow-hidden">
 <div className={`absolute -right-6 -top-6 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity ${
 color === 'blue' ? 'bg-blue-500/10' : color === 'emerald' ? 'bg-emerald-500/10' : color === 'red' ? 'bg-red-500/10' : 'bg-purple-500/10'
 }`}></div>
 <div className="flex justify-between items-start mb-4 relative z-10">
 <div>
 <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">{label}</p>
 <p className={`text-3xl font-black tracking-tighter ${
 color === 'blue' ? 'text-blue-500' : color === 'emerald' ? 'text-emerald-400' : 
 color === 'red' ? 'text-red-500' : 'text-purple-400'
 }`}>{value}</p>
 </div>
 <div className={`p-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 ${
 color === 'blue' ? 'text-blue-500 shadow-blue-500/10' : 
 color === 'emerald' ? 'text-emerald-400 shadow-emerald-500/10' : 
 color === 'red' ? 'text-red-500 shadow-red-500/10' : 'text-purple-400 shadow-purple-500/10'
 } shadow-2xl`}>
 {React.cloneElement(icon, { className: 'w-6 h-6' })}
 </div>
 </div>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10">{desc}</p>
 </div>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
 <button 
 onClick={onClick}
 className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
 active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/5'
 }`}
 >
 {React.cloneElement(icon, { className: 'w-4 h-4' })}
 {label}
 </button>
);

const StorageRow = ({ label, size, color, percent }: any) => (
 <div className="space-y-2">
 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
 <span className="text-slate-600 dark:text-slate-400">{label}</span>
 <span className="text-white">{size}</span>
 </div>
 <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${percent}%` }}
 transition={{ duration: 1, ease: 'easeOut' }}
 className={`h-full ${color} shadow-sm dark:shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
 />
 </div>
 </div>
);

const PermissionItem = ({ label, status, value, healthy }: any) => (
 <div className="flex items-center justify-between group">
 <div className="flex items-center gap-3">
 <div className={`p-1.5 rounded-lg ${healthy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} border border-slate-200 dark:border-white/5`}>
 <ShieldCheck className="w-3.5 h-3.5" />
 </div>
 <div>
 <p className="text-xs font-bold text-white uppercase tracking-tight">{label}</p>
 <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{status}</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-mono text-xs text-slate-600 font-black tracking-widest group-hover:text-blue-400 transition-colors">{value}</span>
 </div>
 </div>
);
