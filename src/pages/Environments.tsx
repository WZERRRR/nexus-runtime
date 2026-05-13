import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
 Layers, Database, Globe, Play, Square, Activity, Settings2, RefreshCw, GitBranch, Cloud, CheckCircle2, 
 AlertTriangle, ArrowRight, Server, Clock, Cpu, HardDrive, Terminal, FileText, Bot, Bell, X, 
 ChevronRight, Lock, Save, Shield, ShieldCheck, Zap, Laptop, LayoutGrid, Search, Filter,
 Box, History, Power, Gauge, Radio, Waves
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { RuntimeErrorAlert } from '../components/common/RuntimeErrorAlert';

const INITIAL_ENVIRONMENTS = [
 { 
 id: 'prod', 
 name: 'LIVE', 
 type: 'Production', 
 url: 'api.devcore.com', 
 branch: 'main', 
 status: 'online', 
 version: 'v2.5.0-dev', 
 lastUpdate: '15 mins ago',
 runtime: 'Node.js 20',
 pm2Process: 'devcore-api-live',
 path: '/var/www/api-live',
 health: { pm2: true, db: true, ssl: true, api: true, queue: true },
 resources: { cpu: '12%', ram: '420MB', responseTime: '120ms', errorRate: '0.2%' },
 deploy: { lastRun: 'Ahmed • 2h ago', status: 'Success', duration: '1m 20s' },
 git: { lastCommit: 'feat: improve dashboard', author: 'Abdullah' },
 ai: { status: 'Stable', suggestion: 'نظام مستقر بالكامل. ننصح بتفعيل التخزين المؤقت للبيانات (Redis Cache) لتسريع الاستجابة بنسبة 40%.' },
 alerts: 0,
 healthScore: 98
 },
 { 
 id: 'staging', 
 name: 'STAGING', 
 type: 'Staging', 
 url: 'staging.devcore.com', 
 branch: 'staging', 
 status: 'online', 
 version: 'v2.5.0-rc1', 
 lastUpdate: '2 hours ago',
 runtime: 'Node.js 20',
 pm2Process: 'devcore-api-staging',
 path: '/var/www/api-staging',
 health: { pm2: true, db: true, ssl: false, api: true, queue: true },
 resources: { cpu: '45%', ram: '800MB', responseTime: '300ms', errorRate: '1.5%' },
 deploy: { lastRun: 'System • 5h ago', status: 'Success', duration: '2m 10s' },
 git: { lastCommit: 'fix: payment webhook issue', author: 'Sara' },
 ai: { status: 'Warning', suggestion: 'استهلاك الـ RAM مرتفع قليلاً، ننصح برفع حد الذاكرة الخاص بـ PM2 لتجنب الانهيار المفاجئ.' },
 alerts: 2,
 sslWarning: 'SSL expires in 7 days',
 healthScore: 85
 },
 { 
 id: 'dev', 
 name: 'DEV', 
 type: 'Development', 
 url: 'dev.devcore.internal', 
 branch: 'develop', 
 status: 'offline', 
 version: 'v2.6.x-alpha', 
 lastUpdate: '1 day ago',
 runtime: 'Node.js 20',
 pm2Process: 'devcore-api-dev',
 path: '/var/www/api-dev',
 health: { pm2: false, db: true, ssl: true, api: false, queue: false },
 resources: { cpu: '0%', ram: '0MB', responseTime: 'N/A', errorRate: 'N/A' },
 deploy: { lastRun: 'Ali • 1d ago', status: 'Failed', duration: '45s' },
 git: { lastCommit: 'wip: new settings module', author: 'Ali' },
 ai: { status: 'Error', suggestion: 'الخدمة متوقفة حالياً. يوجد خطأ يمنع البناء (Build Error) - تحقق من سجلات التيرمينال.' },
 alerts: 3,
 healthScore: 40
 }
];

export function EnvironmentsCenter() {
 const { state } = useLocation();
 const navigate = useNavigate();
 const context = state?.project;
 const [environments, setEnvironments] = useState<typeof INITIAL_ENVIRONMENTS>([]);
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [selectedEnvSettings, setSelectedEnvSettings] = useState<typeof INITIAL_ENVIRONMENTS[0] | null>(null);
 const [activeActions, setActiveActions] = useState<Record<string, string | null>>({});
 const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
 const [confirmAction, setConfirmAction] = useState<{ env: typeof INITIAL_ENVIRONMENTS[0], type: 'restart' | 'deploy' } | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 let mounted = true;
 const fetchEnvironments = async () => {
 try {
 setIsLoading(true);
 setError(null);
 await new Promise(resolve => setTimeout(resolve, 800)); // Simulate async network
 if (mounted) setEnvironments(INITIAL_ENVIRONMENTS);
 } catch (err) {
 if (mounted) setError('فشل مزامنة بيئات العمل. يرجى التحقق من الخادم.');
 } finally {
 if (mounted) setIsLoading(false);
 }
 };
 fetchEnvironments();
 return () => { mounted = false; };
 }, []);

 const showToast = (message: string, type: 'success' | 'error' = 'success') => {
 setToast({ message, type });
 setTimeout(() => setToast(null), 3000);
 };

 const handleAction = async (envId: string, actionName: 'restart' | 'deploy') => {
 const env = environments.find(e => e.id === envId);
 if (!env) return;
 setConfirmAction({ env, type: actionName });
 };

 const executeConfirmedAction = async () => {
 if (!confirmAction) return;
 const { env, type } = confirmAction;
 const envId = env.id;
 
 setConfirmAction(null);
 setActiveActions(prev => ({ ...prev, [`${envId}-${type}`]: type }));
 
 if (envId === 'prod' && type === 'deploy') {
 showToast('جاري البدء.. نوصي دائماً بالتأكد من وجود نسخة احتياطية صالحة.', 'success');
 }

 await new Promise(resolve => setTimeout(resolve, 3000));
 
 setEnvironments(prev => prev.map(e => {
 if (e.id === envId) {
 return {
 ...e,
 status: 'online',
 lastUpdate: 'Just now'
 };
 }
 return e;
 }));

 setActiveActions(prev => ({ ...prev, [`${envId}-${type}`]: null }));
 showToast(
 type === 'restart' 
 ? `تم إعادة تشغيل بيئة ${envId.toUpperCase()} بنجاح` 
 : `تم تنفيذ عملية النشر بنجاح`,
 'success'
 );
 };

 const handleRefresh = async () => {
 setIsLoading(true);
 setError(null);
 try {
 await new Promise(resolve => setTimeout(resolve, 1500));
 showToast('تم تحديث بيئات العمل بنجاح');
 } catch (err) {
 setError('فريق العمل التقني يعمل على حل المشكلة، يرجى المحاولة لاحقاً.');
 showToast('تعذر تحديث بيئات العمل', 'error');
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="space-y-8 flex flex-col h-[calc(100vh-6rem)] overflow-hidden text-right font-sans" dir="rtl">
 <AnimatePresence>
 {toast && (
 <motion.div 
 initial={{ opacity: 0, y: -20, x: '-50%' }}
 animate={{ opacity: 1, y: 20, x: '-50%' }}
 exit={{ opacity: 0, y: -20, x: '-50%' }}
 className={`fixed top-8 left-1/2 z-[100] px-6 py-4 rounded-2xl border shadow-2xl flex items-center gap-3 font-black text-xs backdrop-blur-xl uppercase tracking-widest ${
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
 projectDescription={context ? undefined : "التحكم الكامل في دورة حياة التطبيق: من نسخة التطوير (DEV) إلى بيئة الإنتاج الحية (LIVE) بكل سهولة."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="إدارة بيئات العمل (Environments)"
 actions={
 <div className="flex gap-3">
 <button 
 onClick={handleRefresh}
 disabled={isLoading}
 className="px-5 py-2.5 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-[10px] font-black shadow-lg flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-widest"
 >
 <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
 تحديث 
 </button>
 <button 
 onClick={() => setIsAddModalOpen(true)}
 disabled={isLoading}
 className="flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl transition-all text-[10px] font-black shadow-lg shadow-pink-500/20 active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
 >
 <Layers className="w-4 h-4" />
 إنشاء بيئة جديدة
 </button>
 </div>
 }
 />

 <RuntimeErrorAlert 
 error={error} 
 onRetry={handleRefresh} 
 title="فشل مزامنة بيئات التشغيل"
 />

 <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 overflow-y-auto custom-scrollbar pb-8 px-1">
 <AnimatePresence mode="wait">
 {isLoading ? (
 Array.from({ length: 3 }).map((_, idx) => (
 <motion.div 
 key={`env-skeleton-${idx}`}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0 }}
 className="glass-panel rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col relative overflow-hidden"
 >
 <div className="p-8">
 <div className="flex justify-between items-start mb-8 flex-row-reverse">
 <div className="flex items-center gap-4 flex-row-reverse">
 <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse shrink-0"></div>
 <div>
 <div className="h-6 w-32 bg-slate-200 dark:bg-white/5 rounded-md animate-pulse mb-2"></div>
 <div className="h-4 w-20 bg-slate-200 dark:bg-white/5 rounded-md animate-pulse"></div>
 </div>
 </div>
 <div className="h-10 w-16 bg-slate-200 dark:bg-white/5 rounded-md animate-pulse"></div>
 </div>
 <div className="grid grid-cols-2 gap-4 mb-8">
 {Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="h-12 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
 ))}
 </div>
 <div className="space-y-4 mb-8">
 <div className="h-8 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
 <div className="h-8 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
 </div>
 </div>
 </motion.div>
 ))
 ) : environments.length === 0 ? (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="xl:col-span-3 w-full p-12 flex flex-col items-center justify-center text-center glass-panel rounded-2xl border-dashed border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/20"
 >
 <div className="w-16 h-16 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
 <Layers className="w-8 h-8 text-pink-400" />
 </div>
 <h3 className="text-xl font-black text-white mb-2 tracking-tight">لا توجد بيئات مهيأة حالياً</h3>
 <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mb-8 font-medium leading-relaxed text-center">قم بإنشاء بيئة جديدة لتتمكن من نشر الكود البرمجي ومتابعة حالة الخوادم.</p>
 <button 
 onClick={() => setIsAddModalOpen(true)}
 className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-[0_10px_20px_-5px_rgba(236,72,153,0.4)]"
 >
 <Layers className="w-4.5 h-4.5" /> إنشاء بيئة جديدة
 </button>
 </motion.div>
 ) : (
 environments.map((env) => (
 <motion.div 
 key={env.id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className={`glass-panel rounded-3xl border flex flex-col relative overflow-hidden group transition-all h-max ${
 env.status === 'online' ? 'border-slate-200 dark:border-white/5' : 'border-red-500/20'
 }`}
 >
 {/* Status Blur Background */}
 <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] -mr-32 -mt-32 rounded-full opacity-10 transition-all group-hover:opacity-20 ${
 env.id === 'prod' ? 'bg-red-500' : env.id === 'staging' ? 'bg-orange-500' : 'bg-blue-500'
 }`}></div>

 <div className="p-8 relative z-10">
 <div className="flex justify-between items-start mb-8 text-right">
 <div className="flex items-center gap-4 flex-row-reverse">
 <div className={`p-4 rounded-2xl border ${
 env.id === 'prod' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
 env.id === 'staging' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
 'bg-blue-500/10 text-blue-500 border-blue-500/20'
 }`}>
 {env.id === 'prod' ? <Globe className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
 </div>
 <div className="text-right">
 <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">{env.name}</h2>
 <div className="flex items-center gap-3 justify-end">
 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{env.type}</span>
 <div className={`w-1.5 h-1.5 rounded-full ${env.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
 </div>
 </div>
 </div>
 <div className="flex flex-col items-start gap-1">
 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">HEALTH SCORE</span>
 <span className={`text-xl font-black ${env.healthScore > 90 ? 'text-emerald-400' : env.healthScore > 70 ? 'text-orange-400' : 'text-red-400'}`}>
 {env.healthScore}%
 </span>
 </div>
 </div>

 {/* Main Info Blocks */}
 <div className="grid grid-cols-2 gap-4 mb-8">
 <EnvDetail label="BRANCH" value={env.branch} icon={<GitBranch className="w-3.5 h-3.5" />} />
 <EnvDetail label="VERSION" value={env.version} icon={<Cloud className="w-3.5 h-3.5" />} />
 <EnvDetail label="RUNTIME" value={env.runtime} icon={<Cpu className="w-3.5 h-3.5" />} />
 <EnvDetail label="UPTIME" value={env.lastUpdate} icon={<Clock className="w-3.5 h-3.5" />} />
 </div>

 {/* Resource Monitors */}
 <div className="space-y-4 mb-8">
 <ResourceLine label="CPU LOAD" value={env.resources.cpu} progress={parseInt(env.resources.cpu)} />
 <ResourceLine label="RAM USAGE" value={env.resources.ram} progress={env.id === 'prod' ? 12 : 45} />
 </div>

 {/* URL Access */}
 <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 mb-8 group/url cursor-pointer flex items-center justify-between hover:bg-slate-100 dark:bg-black/60 transition-all font-mono">
 <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-[4px] transition-all rotate-180" />
 <div className="flex items-center gap-3">
 <Globe className="w-4 h-4 text-blue-400" />
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight">{env.url}</span>
 </div>
 </div>

 {/* AI Insight Box */}
 <div className={`p-5 rounded-3xl border mb-8 relative overflow-hidden group/ai transition-all text-right ${
 env.ai.status === 'Stable' ? 'bg-blue-500/5 border-blue-500/10 text-blue-400' :
 env.ai.status === 'Warning' ? 'bg-orange-500/5 border-orange-500/10 text-orange-400' :
 'bg-red-500/5 border-red-500/10 text-red-400'
 }`}>
 <div className="flex items-center gap-3 mb-2 flex-row-reverse">
 <Bot className="w-4 h-4" />
 <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Recommendation</span>
 </div>
 <p className="text-[11px] leading-relaxed font-bold">{env.ai.suggestion}</p>
 {env.sslWarning && (
 <div className="mt-3 flex items-center gap-2 text-xs font-black text-orange-500 bg-orange-500/10 p-2 rounded-xl border border-orange-500/20 justify-end">
 <AlertTriangle className="w-4 h-4" /> {env.sslWarning}
 </div>
 )}
 </div>

 {/* Deploy History Quick Info */}
 <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-slate-200 dark:border-white/5 pt-6 group-hover:text-slate-600 dark:text-slate-400 transition-colors">
 <div>{env.deploy.lastRun.split(' • ')[0]}</div>
 <div className="flex items-center gap-2">
 LATEST DEPLOY: {env.deploy.status} ({env.deploy.duration})
 <span className="w-2 h-2 rounded-full bg-blue-500"></span>
 </div>
 </div>
 </div>

 {/* Actions Bar */}
 <div className="mt-auto p-4 bg-white dark:bg-slate-900/40 border-t border-slate-200 dark:border-white/5 flex gap-2">
 <button 
 onClick={() => setSelectedEnvSettings(env)}
 className="p-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white rounded-2xl border border-slate-200 dark:border-white/5 transition-all"
 >
 <Settings2 className="w-5 h-5" />
 </button>
 <button 
 onClick={() => handleAction(env.id, 'restart')}
 disabled={!!activeActions[`${env.id}-restart`]}
 className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-200 dark:bg-white/5 hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 hover:text-blue-400 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
 >
 <RefreshCw className={`w-4 h-4 ${activeActions[`${env.id}-restart`] ? 'animate-spin' : ''}`} />
 {activeActions[`${env.id}-restart`] ? 'REBOOTING' : 'RESTART'}
 </button>
 <button 
 onClick={() => handleAction(env.id, 'deploy')}
 disabled={!!activeActions[`${env.id}-deploy`]}
 className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-50"
 >
 <Play className={`w-4 h-4 ${activeActions[`${env.id}-deploy`] ? 'animate-pulse' : ''}`} />
 {activeActions[`${env.id}-deploy`] ? 'DEPLOYING' : 'DEPLOY'}
 </button>
 </div>
 </motion.div>
 ))
 )}
 </AnimatePresence>
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
 <div className={`h-2 w-full ${confirmAction.env.id === 'prod' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></div>
 <div className="p-8 text-right">
 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border shadow-2xl ${
 confirmAction.env.id === 'prod' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
 }`}>
 <Shield className="w-8 h-8" />
 </div>
 
 <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
 {confirmAction.env.id === 'prod' ? 'تأكيد الإجراء الحرج (Critical)' : 'تأكيد عملية التشغيل'}
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm font-bold leading-relaxed mb-8">
 أنت على وشك تنفيذ عملية <span className="text-white">({confirmAction.type.toUpperCase()})</span> على بيئة العمل <span className={confirmAction.env.id === 'prod' ? 'text-red-500' : 'text-orange-500'}>{confirmAction.env.name}</span>. 
 هذا الإجراء سيغير حالة النظام الحي في <span className="text-blue-400">Neural Infrastructure</span>.
 </p>

 <div className="bg-slate-200 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 mb-8 space-y-3">
 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
 <span>{confirmAction.env.id === 'prod' ? 'CRITICAL RISK DETECTED' : 'HIGH RISK LEVEL'}</span>
 <span className={confirmAction.env.id === 'prod' ? 'text-red-500' : 'text-orange-500'}>
 {confirmAction.env.id === 'prod' ? '9.9/10' : '7.5/10'}
 </span>
 </div>
 <div className="flex items-center gap-3">
 <div className={`flex-1 h-1.5 rounded-full ${confirmAction.env.id === 'prod' ? 'bg-red-500 shadow-sm dark:shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-orange-500'}`}></div>
 <div className={`flex-1 h-1.5 rounded-full ${confirmAction.env.id === 'prod' ? 'bg-red-500/40' : 'bg-slate-100 dark:bg-slate-800'}`}></div>
 <div className={`flex-1 h-1.5 rounded-full ${confirmAction.env.id === 'prod' ? 'bg-red-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}></div>
 </div>
 </div>

 <div className="flex gap-4">
 <button 
 onClick={() => setConfirmAction(null)}
 className="flex-1 py-4 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
 >
 إلغاء الأمر
 </button>
 <button 
 onClick={executeConfirmedAction}
 className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 ${
 confirmAction.env.id === 'prod' ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20'
 }`}
 >
 {confirmAction.env.id === 'prod' ? 'تأكيد التنفيذ الفوري' : 'تأكيد التنفيذ'}
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Add Environment Modal */}
 <AnimatePresence>
 {isAddModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
 onClick={() => setIsAddModalOpen(false)}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-2xl glass-panel rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
 >
 <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-white/5 shrink-0 flex items-center justify-between">
 <div className="text-right">
 <h2 className="text-xl font-black text-white uppercase tracking-tight">Provision New Environment</h2>
 <p className="text-slate-500 text-[10px] font-black uppercase mt-1 tracking-widest">تجهيز بنية تحتية جديدة بالكامل</p>
 </div>
 <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-2xl transition-all">
 <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
 </button>
 </div>

 <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
 <div className="space-y-6">
 <ModalInput label="ENVIRONMENT NAME" placeholder="e.g. STAGING-2" />
 <div className="grid grid-cols-2 gap-4">
 <ModalSelect label="ENVIRONMENT TYPE">
 <option>DEVELOPMENT</option>
 <option>STAGING</option>
 <option>PRODUCTION</option>
 </ModalSelect>
 <ModalInput label="GIT BRANCH" placeholder="main" />
 </div>
 <ModalInput label="CUSTOM DOMAIN" placeholder="api.new-env.devcore.com" />
 </div>

 <div className="pt-8 border-t border-slate-200 dark:border-white/5">
 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Infrastucture Options</h3>
 <div className="grid grid-cols-1 gap-3">
 <ModalCheck label="Create Isolation Layer / Docker Container" defaultChecked />
 <ModalCheck label="Auto-configure Nginx Proxy & SSL" defaultChecked />
 <ModalCheck label="Provision Dedicated Database Instance" />
 </div>
 </div>
 </div>

 <div className="p-8 border-t border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-white/5 flex gap-4">
 <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all">
 Cancel
 </button>
 <button 
 onClick={() => {
 setIsAddModalOpen(false);
 showToast('INITIATING INFRASTRUCTURE PROVISIONING...');
 }}
 className="flex-1 py-4 bg-pink-600 hover:bg-pink-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-pink-500/20 transition-all active:scale-95"
 >
 START PROVISIONING
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Settings Modal (Drawer style) */}
 <AnimatePresence>
 {selectedEnvSettings && (
 <div className="fixed inset-0 z-50 flex items-center justify-end">
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm"
 onClick={() => setSelectedEnvSettings(null)}
 />
 <motion.div 
 initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
 className="relative w-full max-w-xl h-full glass-panel border-l border-slate-200 dark:border-white/5 shadow-2xl flex flex-col"
 >
 <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-white/5 shrink-0 flex items-center justify-between">
 <div className="text-right">
 <h2 className="text-xl font-black text-white uppercase tracking-tight">Environment Config</h2>
 <p className="text-slate-500 text-[10px] font-black uppercase mt-1 tracking-widest">إعدادات {selectedEnvSettings.name}</p>
 </div>
 <button onClick={() => setSelectedEnvSettings(null)} className="p-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-2xl transition-all text-slate-600 dark:text-slate-400">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10">
 <section>
 <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-6">Runtime Configuration</h3>
 <div className="space-y-6">
 <ModalInput label="PM2 PROCESS NAME" defaultValue={selectedEnvSettings.pm2Process} />
 <ModalInput label="DEPLOYMENT PATH" defaultValue={selectedEnvSettings.path} />
 <ModalCheck label="Auto-restart on Failure" defaultChecked />
 </div>
 </section>

 <section>
 <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-6">Network & Security</h3>
 <div className="space-y-6">
 <ModalInput label="PUBLIC ENDPOINT" defaultValue={selectedEnvSettings.url} />
 <ModalCheck label="Enforce HTTPS / HSTS" defaultChecked />
 <ModalCheck label="Enable WAF Protection" />
 </div>
 </section>

 <section>
 <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6">Continuous Integration</h3>
 <div className="space-y-6">
 <ModalInput label="WEBHOOK SECRET" type="password" defaultValue="••••••••••••••••" />
 <ModalCheck label="Auto-deploy on Branch Push" defaultChecked />
 </div>
 </section>
 </div>

 <div className="p-8 border-t border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-white/5">
 <button 
 onClick={() => {
 setSelectedEnvSettings(null);
 showToast('CONFIGURATION UPDATED SUCCESSFULLY');
 }}
 className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
 >
 <Save className="w-4 h-4" />
 Apply & Synchronize
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}

// Internal Helper Components
function EnvDetail({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
 return (
 <div className="bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2 text-right">
 <div className="flex items-center gap-2 text-slate-500 font-black text-[9px] uppercase tracking-widest justify-end">
 {label}
 {icon}
 </div>
 <div className="text-xs font-bold text-slate-200 truncate">{value}</div>
 </div>
 );
}

function ResourceLine({ label, value, progress }: { label: string, value: string, progress: number }) {
 return (
 <div className="space-y-2 text-right">
 <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
 <span className={progress > 80 ? 'text-red-400' : 'text-slate-700 dark:text-slate-300'}>{value}</span>
 <span className="text-slate-500">{label}</span>
 </div>
 <div className="h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
 className={`h-full transition-all duration-1000 ${
 progress > 80 ? 'bg-red-500' : progress > 50 ? 'bg-orange-500' : 'bg-blue-500'
 }`}
 />
 </div>
 </div>
 );
}

function ModalInput({ label, ...props }: any) {
 return (
 <div className="space-y-2 text-right">
 <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</label>
 <input 
 {...props}
 className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-100 dark:bg-black/60 transition-all"
 />
 </div>
 );
}

function ModalSelect({ label, children }: any) {
 return (
 <div className="space-y-2 text-right">
 <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</label>
 <select className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 focus:bg-slate-100 dark:bg-black/60 transition-all appearance-none cursor-pointer">
 {children}
 </select>
 </div>
 );
}

function ModalCheck({ label, defaultChecked }: any) {
 return (
 <label className="flex items-center justify-between p-4 bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl cursor-pointer hover:bg-slate-200 dark:bg-white/10 transition-all">
 <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center transition-all bg-slate-100 dark:bg-black/40 group-peer-checked:bg-blue-600 group-peer-checked:border-blue-600">
 <input type="checkbox" defaultChecked={defaultChecked} className="w-4 h-4 accent-blue-600" />
 </div>
 <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{label}</span>
 </label>
 );
}
