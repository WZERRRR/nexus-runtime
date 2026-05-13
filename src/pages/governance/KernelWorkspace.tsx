import React, { useEffect, useState } from 'react';
import { Settings, Shield, HardDrive, Cpu, Activity, Server, AlertTriangle, Terminal, ShieldAlert, Network, Fingerprint, Globe, BrainCircuit, Waves, GitPullRequest, Package, History, Rocket, HeartPulse, RotateCcw, Lightbulb, TrendingUp, Lock, Unlock, KeyRound } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { runtimeAPI, SystemStatus, ProcessStatus } from '../../services/runtimeApi';

export function KernelWorkspace({ onNavigate }: { onNavigate: (view: string) => void }) {
 const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
 const [procStatus, setProcStatus] = useState<ProcessStatus | null>(null);
 const [envStatus, setEnvStatus] = useState<any | null>(null);
 const [execHistory, setExecHistory] = useState<any[]>([]);
 const [violations, setViolations] = useState<any[]>([]);
 const [nodes, setNodes] = useState<any[]>([]);
 const [agents, setAgents] = useState<any[]>([]);
 const [signals, setSignals] = useState<any[]>([]);
 const [pipelines, setPipelines] = useState<any[]>([]);
 const [artifacts, setArtifacts] = useState<any[]>([]);
 const [restorePoints, setRestorePoints] = useState<any[]>([]);
 const [stabilityIndex, setStabilityIndex] = useState<any[]>([]);
 const [recommendations, setRecommendations] = useState<any[]>([]);
 const [locks, setLocks] = useState<any[]>([]);
 const [coordination, setCoordination] = useState<any[]>([]);
 const [isExecuting, setIsExecuting] = useState<string | null>(null);
 const [isDeploying, setIsDeploying] = useState<boolean>(false);
 const [isRecovering, setIsRecovering] = useState<boolean>(false);
 const [isLocking, setIsLocking] = useState<string | null>(null);

 const fetchStatus = async () => {
 try {
 const [sys, proc, env, history, viol, nodeData, agentData, signalData, pipeData, artData, restoreData, stabilityData, recData, lockData, coordData] = await Promise.all([
 runtimeAPI.getSystemStatus(),
 runtimeAPI.getProcessStatus(),
 runtimeAPI.getEnvStatus(),
 runtimeAPI.getExecutionHistory(),
 runtimeAPI.getPolicyViolations(),
 runtimeAPI.getNodes(),
 runtimeAPI.getAgents(),
 runtimeAPI.getIntelligenceSignals(),
 runtimeAPI.getPipelines(),
 runtimeAPI.getArtifacts(),
 runtimeAPI.getRestorePoints(),
 runtimeAPI.getStabilityIndex(),
 runtimeAPI.getRecommendations(),
 runtimeAPI.getProtectionLocks(),
 runtimeAPI.getCoordinationStates()
 ]);
 
 setSysStatus(sys);
 setProcStatus(proc);
 setEnvStatus(env);
 setExecHistory(history);
 setViolations(viol);
 setNodes(nodeData);
 setAgents(agentData);
 setSignals(signalData);
 setPipelines(pipeData);
 setArtifacts(artData);
 setRestorePoints(restoreData);
 setStabilityIndex(stabilityData);
 setRecommendations(recData);
 setLocks(lockData);
 setCoordination(coordData);
 } catch (err) {
 console.error("Runtime connection failed", err);
 }
 };

 useEffect(() => {
 fetchStatus();
 const interval = setInterval(fetchStatus, 30000);
 return () => clearInterval(interval);
 }, []);

 const handleRestore = async (id: string) => {
 if (isRecovering) return;
 setIsRecovering(true);
 try {
 await runtimeAPI.executeRestore(id);
 fetchStatus();
 } catch (e) {
 console.error(e);
 } finally {
 setTimeout(() => setIsRecovering(false), 5000);
 }
 };

 const handleToggleLock = async (id: string, current: string) => {
 const next = current === 'LOCKED' ? 'UNLOCKED' : 'LOCKED';
 setIsLocking(id);
 try {
 await runtimeAPI.toggleLock(id, next);
 fetchStatus();
 } catch (e) {
 console.error(e);
 } finally {
 setIsLocking(null);
 }
 };

 const handleTriggerPipeline = async () => {
 if (isDeploying) return;
 setIsDeploying(true);
 try {
 const res = await runtimeAPI.triggerPipeline("Kernel Hotpatch", "STAGING");
 if (res.success) {
 fetchStatus();
 }
 } catch (e) {
 console.error(e);
 } finally {
 setTimeout(() => setIsDeploying(false), 2000);
 }
 };

 const handleExecute = async (commandId: string) => {
 if (isExecuting) return;
 setIsExecuting(commandId);
 try {
 const res = await runtimeAPI.executeCommand(commandId, "{}", "U-12A4", "Super Admin");
 if (res.success) {
 fetchStatus();
 } else {
 alert(`GOVERNANCE BLOCK: ${res.message}`);
 }
 } catch (e) {
 console.error(e);
 } finally {
 setTimeout(() => setIsExecuting(null), 1000);
 }
 };

 const formatUptime = (seconds: number) => {
 const h = Math.floor(seconds / 3600);
 const m = Math.floor((seconds % 3600) / 60);
 return `${h}h ${m}m`;
 };

 const getMemMB = (bytes: number) => Math.round(bytes / 1024 / 1024);

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
 <div>
 <button onClick={() => onNavigate('overview')} className="text-[10px] uppercase font-black text-slate-500 hover:text-white mb-2 tracking-widest transition-colors flex items-center gap-1">
 &rarr; العودة إلى نظرة NEXUS العامة
 </button>
 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
 <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
 حوكمة نواة Nexus
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 uppercase tracking-tighter font-bold">طبقة سلامة النواة واستمرارية الأمن</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-green-500/10 text-emerald-400 border border-green-500/20 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-inner">
 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
 وقت التشغيل متصل
 </span>
 <button 
 onClick={async () => {
 await runtimeAPI.clearCache();
 alert("تدقيق أمني: نفذ المدير عملية مسح التخزين المؤقت. البيئة آمنة.");
 }}
 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">
 مسح الكاش
 </button>
 <button 
 onClick={async () => {
 await runtimeAPI.reloadEnv();
 alert("تدقيق أمني: نفذ المدير إعادة تحميل البيئة. حالة النظام قيد الاستعادة.");
 }}
 className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm dark:shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-400/20 group">
 <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition-transform inline-block mr-2" />
 مزامنة سياسات النواة
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
 <div className="lg:col-span-3 glass-panel rounded-2xl p-6 relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
 <div className="flex items-center justify-between relative z-10">
 <div className="flex items-center gap-8">
 <div className="flex items-center gap-3">
 <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
 <TrendingUp className="w-6 h-6 text-emerald-400" />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">مؤشر الاستقرار</p>
 <p className="text-3xl font-black text-white tracking-tighter">{stabilityIndex[0]?.score || 100}%</p>
 </div>
 </div>
 <div className="h-10 w-px bg-slate-100 dark:bg-slate-800" />
 <div className="flex items-center gap-3">
 <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
 <HeartPulse className="w-6 h-6 text-blue-400" />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">الصحة الجوهرية</p>
 <p className="text-sm font-black text-emerald-400 uppercase tracking-tighter">حالة مثالية</p>
 </div>
 </div>
 </div>
 
 <div className="flex-1 max-w-[300px] h-12 ml-8 opacity-40 group-hover:opacity-100 transition-opacity">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={stabilityIndex.length > 0 ? stabilityIndex : [{score: 100}, {score: 98}, {score: 99}, {score: 100}]}>
 <Area type="monotone" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all cursor-pointer">
 <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-3xl pointer-events-none" />
 <div className="flex items-center justify-between mb-2">
 <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none">هوية النواة</p>
 <Shield className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
 </div>
 <p className="text-xl font-black text-white mt-1 tracking-tight">PLATFORM_SEC_V4</p>
 <p className="text-[9px] text-slate-500 mt-2 uppercase font-mono tracking-tighter bg-slate-50 dark:bg-slate-950 p-1.5 rounded border border-slate-200 dark:border-slate-800/50">HASH: 0x4A2-99B-7F</p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { title: "حالة وقت التشغيل", value: sysStatus ? "تحت الحوكمة" : "جاري المزامنة...", icon: Activity, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
 { title: "وقت تشغيل المؤسسة", value: procStatus ? formatUptime(procStatus.uptime) : "...", icon: Terminal, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
 { title: "سجل الذكرة", value: sysStatus ? `${getMemMB(sysStatus.totalmem - sysStatus.freemem)} MB` : "...", icon: Server, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
 { title: "تضاريس الحوسبة", value: sysStatus ? `${sysStatus.cpus} عقد منطقية` : "...", icon: Cpu, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
 ].map((stat, i) => (
 <div key={i} className={`glass-panel p-5 border ${stat.border} rounded-2xl relative overflow-hidden group hover: transition-all shadow-lg`}>
 <div className={`absolute top-0 right-0 p-4 ${stat.bg} rounded-bl-3xl opacity-40 group-hover:opacity-100 transition-opacity`}>
 <stat.icon className={`w-5 h-5 ${stat.color}`} />
 </div>
 <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest leading-none mb-3">{stat.title}</p>
 <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
 <div className="lg:col-span-2 space-y-6">
 {/* Execution Engine Console */}
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/30" />
 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center justify-between text-right">
 <span className="flex items-center gap-2">
 <Terminal className="w-5 h-5 text-blue-400" />
 محرك التنفيذ العمالي
 </span>
 <span className="text-[9px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg border border-blue-500/20 font-black tracking-widest uppercase">نشط</span>
 </h3>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
 {[
 { id: 'refresh-runtime', name: 'تحديث وقت التشغيل', desc: 'إعادة تهيئة كاملة للسياق', icon: Server, color: 'text-blue-400' },
 { id: 'flush-ai-memory', name: 'مسح ذاكرة AI', desc: 'تطهير المسار العصبي', icon: BrainCircuit, color: 'text-purple-400' },
 { id: 'rotate-keys', name: 'تدوير مفاتيح الأمن', desc: 'تحديث محيط الهوية', icon: KeyRound, color: 'text-orange-400' },
 { id: 'health-check-deep', name: 'تدقيق عميق للنظام', desc: 'تحقق على مستوى البت', icon: Activity, color: 'text-emerald-400' },
 ].map((cmd) => (
 <button
 key={cmd.id}
 disabled={!!isExecuting}
 onClick={() => handleExecute(cmd.id)}
 className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-right group
 ${isExecuting === cmd.id ? 'bg-blue-600/20 border-blue-500 animate-pulse' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-600 hover:bg-white dark:bg-slate-900'}`}
 >
 <div className={`p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${isExecuting === cmd.id ? 'text-blue-400' : cmd.color} group-hover:scale-110 transition-transform`}>
 <cmd.icon className="w-5 h-5" />
 </div>
 <div className="flex-1">
 <p className="text-xs font-black text-white uppercase tracking-tight">{cmd.name}</p>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-70">{cmd.desc}</p>
 </div>
 <div className="text-[10px] text-slate-700 font-black group-hover:text-white transition-colors uppercase">تنفيذ</div>
 </button>
 ))}
 </div>

 <div className="pt-6 border-t border-slate-200 dark:border-slate-800/50">
 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">سجل الأوامر والتتبع العالمي</h4>
 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
 {execHistory.length === 0 ? (
 <p className="text-slate-600 text-[10px] text-center py-12 italic uppercase tracking-widest text-right">لا توجد بيانات تتبع في الجلسة الحالية.</p>
 ) : execHistory.map((exec, i) => (
 <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-lg group hover:bg-slate-100 dark:bg-slate-800/40 transition-all">
 <div className="flex items-center gap-3">
 <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
 exec.status === 'Completed' ? 'bg-emerald-500 text-emerald-500' : 
 exec.status === 'Running' ? 'bg-blue-500 text-blue-500 animate-pulse' : 
 'bg-red-500 text-red-500'
 }`} />
 <div>
 <p className="text-[11px] font-black text-slate-200 uppercase tracking-tight leading-none mb-1">{exec.command_name}</p>
 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
 {new Date(exec.started_at).toLocaleTimeString()} • SRC: {exec.triggered_by}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className={`text-[9px] px-2.5 py-1 rounded font-black uppercase tracking-widest border ${
 exec.status === 'Completed' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 
 exec.status === 'Running' ? 'bg-blue-500/5 border-blue-500/10 text-blue-400' : 
 'bg-red-500/5 border-red-500/10 text-red-500'
 }`}>
 {exec.status}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Deployment Governance Panel */}
 <div className="glass-panel rounded-2xl p-6">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between text-right">
 <span className="flex items-center gap-2">
 <Rocket className="w-4 h-4 text-orange-400" />
 أنابيب وقت التشغيل
 </span>
 <button 
 onClick={handleTriggerPipeline}
 disabled={isDeploying}
 className="text-[9px] bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-3 py-1 rounded font-black uppercase tracking-tighter transition-all"
 >
 {isDeploying ? 'جاري المزامنة...' : 'إطلاق إصدار عالمي'}
 </button>
 </h3>
 
 <div className="space-y-4">
 {pipelines.map((pipe, i) => (
 <div key={i} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded p-4">
 <div className="flex items-center justify-between mb-3">
 <div>
 <p className="text-[10px] font-bold text-white uppercase tracking-tighter">{pipe.name}</p>
 <p className="text-[8px] text-slate-500">{pipe.pipeline_id} • Env: {pipe.target_env}</p>
 </div>
 <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${
 pipe.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 
 pipe.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400 animate-pulse'
 }`}>
 {pipe.status}
 </span>
 </div>
 
 {/* Progress Bar Visualization */}
 <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
 <div 
 className={`h-full transition-all duration-1000 ${pipe.status === 'completed' ? 'bg-emerald-500 w-full' : 'bg-orange-500 w-2/3'}`}
 />
 </div>
 <div className="flex items-center justify-between">
 <span className="text-[8px] text-slate-600 font-mono italic">Released by {pipe.created_by}</span>
 <span className="text-[8px] text-slate-500 font-bold">{new Date(pipe.created_at).toLocaleDateString()}</span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Release Artifacts & Integrity */}
 <div className="glass-panel rounded-2xl p-6">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 text-right">
 <Package className="w-4 h-4 text-blue-400" />
 مخرجات وقت التشغيل
 </h3>
 <div className="grid grid-cols-1 gap-2">
 {artifacts.map((art, i) => (
 <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/30 rounded border border-slate-200 dark:border-slate-800/50 group hover:border-blue-500/30 transition-all">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
 <History className="w-4 h-4 text-blue-400" />
 </div>
 <div className="text-right">
 <p className="text-[10px] font-black text-white">{art.version}</p>
 <p className="text-[8px] text-slate-500 truncate w-32 uppercase tracking-tighter text-right">Ref: {art.artifact_id}</p>
 </div>
 </div>
 <div className="text-left">
 <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">موقع</span>
 <p className="text-[9px] text-blue-400 opacity-60 mt-1 font-mono uppercase">CRC-موثق</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Policy Enforcement Monitor */}
 <div className="glass-panel rounded-2xl p-6 mt-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 انتهاكات سياسة وقت التشغيل (وقت حقيقي)
 <ShieldAlert className="w-4 h-4 text-red-400" />
 </h3>
 <div className="space-y-3">
 {violations.length === 0 ? (
 <div className="text-center py-8 bg-white dark:bg-slate-900/20 rounded-lg border border-slate-200 dark:border-slate-800/50">
 <Shield className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-50" />
 <p className="text-slate-600 text-[10px] uppercase tracking-widest font-black">لم يتم اكتشاف أي انتهاكات للسياسة</p>
 </div>
 ) : (
 violations.map((v, i) => (
 <div key={i} className="flex flex-col p-4 bg-red-500/5 border border-red-500/20 rounded-lg animate-in fade-in zoom-in-95 duration-300">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-black uppercase">{v.violation_type}</span>
 <span className="text-[9px] text-slate-500">{new Date(v.timestamp).toLocaleTimeString()}</span>
 </div>
 <p className="text-[11px] font-bold text-white mb-1 text-right">أمر مقيد: {v.command_id}</p>
 <p className="text-[10px] text-red-400 font-mono leading-relaxed text-right">{v.details}</p>
 <p className="text-[9px] text-slate-600 mt-2 uppercase tracking-tighter text-right">الهوية: {v.uid} • البروتوكول: ENFORCE_DROP</p>
 </div>
 ))
 )}
 </div>
 </div>

 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between">
 <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded tracking-tighter uppercase">للقراءة فقط</span>
 <span className="flex items-center gap-2">
 تخطيط البيئة المباشر
 <Cpu className="w-4 h-4 text-slate-600 dark:text-slate-400" />
 </span>
 </h3>
 
 <div className="space-y-4">
 <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
 <span className="text-xs font-black text-blue-400">{sysStatus?.status ? sysStatus.platform + " " + sysStatus.release : "جاري التحميل..."}</span>
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">محرك Node.js</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
 <span className="text-xs font-black text-emerald-400">{sysStatus?.hostname || "جاري التحميل..."}</span>
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">اسم المضيف / معرف العقدة</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
 <span className="text-[10px] font-mono text-purple-400">{procStatus?.title || "جاري التحميل..."} (PID: {procStatus?.pid || "جاري التحميل..."})</span>
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tighter">سياق العملية</span>
 </div>

 <div className="pt-4 border-t border-slate-200 dark:border-slate-800/50">
 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">تخصيص الذاكرة</h4>
 <div className="space-y-2">
 <div className="flex justify-between text-[10px] uppercase font-black text-slate-600 dark:text-slate-400 tracking-tighter">
 <span>{procStatus ? getMemMB(procStatus.memoryUsage.heapUsed) : 0} MB / {procStatus ? getMemMB(procStatus.memoryUsage.heapTotal) : 0} MB</span>
 <span>استخدام الـ Heap</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
 <div className="bg-blue-500 h-full" style={{ width: procStatus ? `${(procStatus.memoryUsage.heapUsed / procStatus.memoryUsage.heapTotal) * 100}%` : '0%' }} />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-6">
 {/* Autonomous Recommendations */}
 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 مستشار استخبارات وقت التشغيل
 <Lightbulb className="w-4 h-4 text-yellow-400" />
 </h3>
 <div className="space-y-4">
 {recommendations.length === 0 ? (
 <p className="text-[10px] text-slate-600 italic">الاستخبارات الجوهرية: جميع معاملات وقت التشغيل مثالية.</p>
 ) : recommendations.map((rec, i) => (
 <div key={i} className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded group hover:bg-yellow-500/10 transition-all">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">التأثير: {rec.impact_area}</span>
 <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
 rec.severity === 'Critical' ? 'bg-red-500 text-white' : 'bg-yellow-500/20 text-yellow-500'
 }`}>توصية {rec.severity}</span>
 </div>
 <p className="text-[10px] font-bold text-slate-200 mb-1">{rec.title}</p>
 <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{rec.description}</p>
 <button className="w-full py-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black text-[9px] font-black uppercase rounded transition-all">
 تطبيق الإجراء الموصى به
 </button>
 </div>
 ))}
 </div>
 </div>

 {/* Recovery History & Baselines */}
 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 لوحة استعادة المؤسسة
 <RotateCcw className="w-4 h-4 text-emerald-400" />
 </h3>
 <div className="space-y-3">
 {restorePoints.map((rp, i) => (
 <div key={i} className="p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded">
 <div className="flex items-center justify-between mb-2">
 <button 
 onClick={() => handleRestore(rp.restore_id)}
 disabled={isRecovering}
 className="text-[8px] bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black px-2 py-1 rounded font-black uppercase transition-all"
 >
 {isRecovering ? 'جاري الاستعادة...' : 'استعادة'}
 </button>
 <div className="text-right">
 <p className="text-[10px] font-black text-white">{rp.name}</p>
 <p className="text-[8px] text-slate-500 uppercase tracking-tighter">النطاق: {rp.scope} • بواسطة {rp.created_by}</p>
 </div>
 </div>
 <div className="flex items-center gap-2 mt-2 justify-end">
 <span className="text-[8px] text-slate-500 uppercase font-bold">{new Date(rp.created_at).toLocaleDateString()}</span>
 <span className="text-[8px] text-slate-600 font-mono truncate bg-slate-50 dark:bg-slate-950 p-1 rounded">CRC: {rp.restore_id}</span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Runtime Infrastructure Awareness */}
 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 بنية وقت التشغيل التحتية
 <Network className="w-4 h-4 text-emerald-400" />
 </h3>
 <div className="space-y-6">
 {/* Operational Intelligence Signals */}
 <div>
 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-end gap-2">
 الذكاء العملياتي
 <BrainCircuit className="w-3 h-3 text-purple-400" />
 </h4>
 <div className="space-y-2">
 {signals.length === 0 ? (
 <p className="text-[10px] text-slate-600 italic text-right">لم يتم اكتشاف إشارات ذكاء.</p>
 ) : signals.map((sig, i) => (
 <div key={i} className="p-2.5 bg-purple-500/5 border border-purple-500/20 rounded group hover:bg-purple-500/10 transition-colors">
 <div className="flex items-center justify-between mb-1.5">
 <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
 sig.severity === 'High' ? 'bg-red-500 text-white' : 'bg-purple-500/20 text-purple-400'
 }`}>{sig.type}</span>
 <span className="text-[8px] text-slate-500">{new Date(sig.timestamp).toLocaleTimeString()}</span>
 </div>
 <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-tight mb-1">{sig.details}</p>
 <p className="text-[8px] text-slate-600 uppercase font-mono tracking-tighter">المصدر: {sig.source}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Phase 16: Enterprise Production Hardening */}
 <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-end gap-2">
 تحصين الإنتاج
 <ShieldAlert className="w-3 h-3 text-red-500" />
 </h4>
 <div className="space-y-2">
 {locks.map((lock, i) => (
 <div key={i} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
 <button 
 onClick={() => handleToggleLock(lock.lock_id, lock.status)}
 disabled={isLocking === lock.lock_id}
 className={`flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${
 lock.status === 'LOCKED' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
 }`}
 >
 {lock.status === 'LOCKED' ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
 {isLocking === lock.lock_id ? 'انتظر...' : lock.status === 'LOCKED' ? 'مقفل' : 'مفتح'}
 </button>
 <div className="text-right">
 <p className="text-[9px] font-black text-white">{lock.resource_type}</p>
 <p className="text-[8px] text-slate-600 uppercase tracking-tighter">المطلوب: {lock.authority_required}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Nodes and Topology Coordination */}
 <div>
 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-end gap-2">
 الطوبولوجيا: حالة التنسيق
 <Network className="w-3 h-3 text-blue-400" />
 </h4>
 <div className="grid grid-cols-2 gap-2">
 {coordination.map((coord, i) => (
 <div key={i} className="p-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded text-right">
 <p className="text-[8px] font-bold text-white mb-1">{coord.node_id}</p>
 <div className="flex items-center gap-1.5 mb-1 justify-end">
 <span className="text-[7px] text-emerald-500 font-black uppercase">{coord.sync_status === 'Synced' ? 'متزامن' : coord.sync_status}</span>
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
 </div>
 <p className="text-[7px] text-slate-600 font-mono">الانحراف: {coord.drift_value}ms</p>
 </div>
 ))}
 </div>
 </div>

 {/* Nodes */}
 <div>
 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">الطوبولوجيا: العقد النشطة</h4>
 <div className="space-y-2">
 {nodes.map((node, i) => (
 <div key={i} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800 text-right">
 <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-black">{node.status === 'Online' ? 'متصل' : node.status}</span>
 <div className="flex items-center gap-2">
 <div>
 <p className="text-[10px] font-bold text-white">{node.node_id}</p>
 <p className="text-[8px] text-slate-500 uppercase tracking-tighter">{node.region} • {node.role}</p>
 </div>
 <Globe className="w-3 h-3 text-slate-500" />
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Agents */}
 <div className="pt-4 border-t border-slate-200 dark:border-slate-800/50 text-right">
 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">العملاء العملياتيون</h4>
 <div className="space-y-2">
 {agents.map((agent, i) => (
 <div key={i} className="p-3 bg-white dark:bg-slate-900/30 rounded border border-slate-200 dark:border-slate-800/50">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-1.5">
 <span className="text-[8px] text-slate-500 font-bold uppercase">{agent.status === 'ONLINE' ? 'متصل' : 'غير متصل'}</span>
 <div className={`w-1 h-1 rounded-full ${agent.status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-bold text-slate-200">{agent.name}</span>
 <Fingerprint className="w-3 h-3 text-blue-400" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded">
 <p className="text-[8px] text-slate-500 uppercase mb-0.5 tracking-tighter">استهلاك الذاكرة</p>
 <p className="text-[10px] font-black text-purple-400">{agent.memory_usage || 0}MB</p>
 </div>
 <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded">
 <p className="text-[8px] text-slate-500 uppercase mb-0.5 tracking-tighter">حمل المعالج</p>
 <p className="text-[10px] font-black text-blue-400">{agent.cpu_usage || 0}%</p>
 </div>
 </div>
 <p className="text-[8px] text-slate-600 mt-2 uppercase tracking-tighter">الموقع: {agent.node_id} • النطاق: {agent.scope}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 بيئة وقت التشغيل
 <HardDrive className="w-4 h-4 text-purple-400" />
 </h3>
 <div className="space-y-4">
 <div>
 <div className="flex justify-between text-xs mb-1">
 <span className="text-green-400 font-bold uppercase">{envStatus?.environment === 'PROD' ? 'الإنتاج' : envStatus?.environment || "جاري التحميل"}</span>
 <span className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">الحالة النشطة</span>
 </div>
 </div>
 <div className="pt-4 border-t border-slate-200 dark:border-slate-800/50">
 <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest mb-3 block">المفاتيح العامة المعروضة</span>
 <div className="flex flex-wrap gap-2 text-[10px] font-mono justify-end">
 {envStatus?.exposedKeys?.length ? envStatus.exposedKeys.map((key: string, idx: number) => (
 <span key={idx} className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded">{key}</span>
 )) : (
 <span className="text-slate-500 text-xs text-center w-full block py-2 bg-white dark:bg-slate-900/50 rounded border border-dashed border-slate-300 dark:border-slate-700">لا توجد مفاتيح عامة معروضة</span>
 )}
 </div>
 </div>
 <div className="pt-4 border-t border-slate-200 dark:border-slate-800/50 flex justify-between items-center text-xs">
 <span className="text-green-400 font-bold uppercase tracking-widest flex items-center gap-1">آمن <Shield className="w-3 h-3" /></span>
 <span className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">الأمن</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
