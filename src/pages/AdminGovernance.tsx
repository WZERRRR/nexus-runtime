import React, { useState, useEffect } from 'react';
import { 
 Users, Shield, Brain, CreditCard, Network, Settings, Terminal, Activity, FileText, Lock, AlertTriangle, ChevronRight, Zap
} from 'lucide-react';
import { IdentityWorkspace } from './governance/IdentityWorkspace';
import { SecurityWorkspace } from './governance/SecurityWorkspace';
import { KernelWorkspace } from './governance/KernelWorkspace';
import { AIWorkspace } from './governance/AIWorkspace';
import { ApiWorkspace } from './governance/ApiWorkspace';
import { FinancialWorkspace } from './governance/FinancialWorkspace';
import { ActivationWorkspace } from './governance/ActivationWorkspace';
import { IntelligenceWorkspace } from './governance/IntelligenceWorkspace';
import { OperationsWorkshop } from './governance/OperationsWorkshop';
import { runtimeAPI, RuntimeLog } from '../services/runtimeApi';

const GovernanceBanner = () => (
 <div className="bg-gradient-to-r from-purple-900/40 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between mb-2">
 <div className="flex items-center gap-3">
 <div className="animate-pulse w-2 h-2 rounded-full bg-green-400" />
 <span className="text-white font-black uppercase tracking-widest text-[10px]">وضع حوكمة Nexus مفعل</span>
 </div>
 <div className="flex items-center gap-4">
 <span className="text-purple-300 font-bold text-[10px] uppercase border-r border-purple-500/30 pr-4">وضع صلاحيات النظام</span>
 <span className="text-green-400 font-bold text-[10px] uppercase">✓ مزامنة كاملة</span>
 </div>
 </div>
);

const GovernanceStatusBar = () => (
 <div className="flex flex-wrap gap-2 mb-8 text-[9px] font-black uppercase tracking-widest text-slate-500">
 <span className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">جلسة المدير الفائق</span>
 <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400">كتابة Kernel مفعلة</span>
 <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">حماية وقت التشغيل نشطة</span>
 <span className="px-2 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center gap-1">
 <Terminal className="w-3 h-3" /> البيئة الحية
 </span>
 </div>
);

const KPICard = ({ title, value, icon: Icon, detail, color }: any) => (
 <div className={`glass-panel rounded-2xl p-4 flex items-center justify-between hover:border-${color || 'purple'}-500/30 transition-all hover: group`}>
 <div>
 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
 <p className="text-white text-lg font-black group-hover:scale-105 transition-transform origin-left">{value === 'Stable' ? 'مستقر' : value === 'Critical' ? 'حرج' : value === 'Verified' ? 'موثق' : value}</p>
 {detail && <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">{detail}</p>}
 </div>
 <div className={`p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-${color || 'purple'}-400 group-hover:bg-${color || 'purple'}-500/10 transition-colors`}>
 <Icon className="w-4 h-4" />
 </div>
 </div>
);

const GovernanceCard = ({ title, description, icon: Icon, colorClass, status, count, lastActivity, policies, securityLevel, onClick }: any) => {
 const isSecurity = title.includes("الأمنية") || title.includes("Security") || title.includes("أمن");
 const isKernel = title.includes("نواة") || title.includes("Kernel");
 const isIdentity = title.includes("الهوية");
 
 const highPriority = isSecurity || isKernel || isIdentity;

 return (
 <div 
 onClick={onClick}
 className={`glass-panel rounded-2xl p-6 transition-all group relative overflow-hidden cursor-pointer
 ${highPriority ? 'border-slate-600 hover:border-purple-500 hover:shadow-sm dark:shadow-[0_0_20px_rgba(168,85,247,0.15)] ' : 'border-slate-200 dark:border-slate-800 hover:border-slate-500'}
 `}
 >
 <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-black/80 -z-10" />
 
 {highPriority && (
 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-10 group-hover:bg-purple-500/10 transition-colors" />
 )}

 <div className="flex justify-between items-start mb-6">
 <div className={`p-3 rounded-lg bg-white dark:bg-slate-900 border w-fit ${colorClass.split(' ')[0].replace('from', 'text')} 
 ${highPriority ? 'border-slate-300 dark:border-slate-700 shadow-inner' : 'border-slate-200 dark:border-slate-800'}
 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}
 >
 <Icon className="w-6 h-6" />
 </div>
 
 <div className="flex flex-col items-end gap-2">
 <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded 
 ${status === 'مستقر' || status === 'نشط' || status === 'Optimized' || status === 'مؤمن' ? 'text-green-400 bg-green-400/10 border border-green-400/20' : 'text-blue-400 bg-blue-400/10 border border-blue-400/20'}
 `}>
 {status}
 </span>
 <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded border
 ${securityLevel === 'Critical' ? 'text-red-400 bg-red-400/10 border-red-400/20' : 
 securityLevel === 'High' ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' : 
 'text-blue-400 bg-blue-400/10 border-blue-400/20'}
 `}>
 المستوى: {securityLevel === 'Critical' ? 'حرج' : securityLevel === 'High' ? 'عالي' : securityLevel === 'Optimized' ? 'محسن' : securityLevel}
 </span>
 </div>
 </div>

 <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{title}</h3>
 <p className="text-slate-600 dark:text-slate-400 text-xs mb-4 h-10 leading-relaxed text-right">{description}</p>
 
 <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50 group-hover:border-slate-300 dark:border-slate-700 transition-colors">
 <div className="flex items-center gap-1"><span className="text-white">{count}</span> عملية</div>
 <div className="flex items-center gap-1"><span className="text-white">{policies}</span> سياسة</div>
 <div className="col-span-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/30 flex items-center justify-between">
 <span>النشاط: <span className="text-white font-mono">{lastActivity}</span></span>
 <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
 </div>
 </div>
 </div>
 );
};

export function AdminGovernance() {
 const [activeWorkspace, setActiveWorkspace] = useState('overview');
 const [liveLogs, setLiveLogs] = useState<RuntimeLog[]>([]);

 useEffect(() => {
 if (activeWorkspace === 'overview') {
 const eventSource = new EventSource('/api/runtime/stream/logs');
 
 eventSource.onmessage = (event) => {
 try {
 const logs = JSON.parse(event.data);
 setLiveLogs(logs);
 } catch (err) {
 console.error("Failed to parse log stream", err);
 }
 };

 eventSource.onerror = () => {
 console.warn("Log stream error or connection lost");
 eventSource.close();
 };

 return () => eventSource.close();
 }
 }, [activeWorkspace]);

 const sections = [
 { id: "identity", title: "إدارة الهوية والصلاحيات", description: "إدارة المستخدمين، الأدوار، والأذونات (RBAC).", icon: Users, colorClass: "from-blue-500 to-cyan-500", status: "نشط", count: "1,240", lastActivity: "2 دقيقة", policies: "14", securityLevel: "High" },
 { id: "security", title: "مركز العمليات الأمنية", description: "رصد التهديدات، سجلات التدقيق، وسياسات الأمن.", icon: Shield, colorClass: "from-red-500 to-rose-500", status: "مؤمن", count: "48", lastActivity: "5 دقائق", policies: "9", securityLevel: "Critical" },
 { id: "ai", title: "مركز الذكاء الاصطناعي (AI)", description: "إعدادات Gemini، Runtime، وسياسات الـ AI.", icon: Brain, colorClass: "from-purple-500 to-violet-500", status: "نشط", count: "12", lastActivity: "1 دقيقة", policies: "5", securityLevel: "High" },
 { id: "financial", title: "العمليات المالية والفوترة", description: "إدارة الفواتير، الإيرادات، الاشتراكات.", icon: CreditCard, colorClass: "from-green-500 to-emerald-500", status: "مستقر", count: "892", lastActivity: "10 دقائق", policies: "6", securityLevel: "Medium" },
 { id: "api", title: "إدارة واجهات الربط (API)", description: "مفاتيح الـ API، Webhooks، وحدود الطلبات.", icon: Network, colorClass: "from-yellow-500 to-orange-500", status: "نشط", count: "45", lastActivity: "3 دقائق", policies: "3", securityLevel: "High" },
 { id: "kernel", title: "إعدادات نواة المنصة", description: "إعدادات المنصة العالمية وسياسات التشغيل.", icon: Settings, colorClass: "from-slate-400 to-slate-200", status: "مستقر", count: "18", lastActivity: "15 دقيقة", policies: "22", securityLevel: "Critical" },
 { id: "activation", title: "مركز التفعيل والتشغيل", description: "validation، SSH، وتفعيل الإنتاج.", icon: Terminal, colorClass: "from-indigo-500 to-purple-500", status: "نشط", count: "12", lastActivity: "1 دقيقة", policies: "4", securityLevel: "High" },
 { id: "intelligence", title: "استخبارات العمليات التشغيلية", description: "التحليل التنبؤي، كشف الانحرافات، وتقييم المخاطر.", icon: Brain, colorClass: "from-emerald-500 to-cyan-500", status: "نشط", count: "34", lastActivity: "لحظي", policies: "12", securityLevel: "Optimized" },
 { id: "operations", title: "ورشة العمليات والجهد", description: "اختبارات الجهد، محاكاة الإنتاج، وتدريبات التعافي.", icon: Zap, colorClass: "from-yellow-400 to-yellow-600", status: "مستعد", count: "0", lastActivity: "N/A", policies: "8", securityLevel: "Safe" },
 ];

 if (activeWorkspace !== 'overview') {
 return (
 <div className="space-y-4">
 <GovernanceBanner />
 <GovernanceStatusBar />
 {activeWorkspace === 'identity' && <IdentityWorkspace onNavigate={setActiveWorkspace} />}
 {activeWorkspace === 'security' && <SecurityWorkspace onNavigate={setActiveWorkspace} />}
 {activeWorkspace === 'kernel' && <KernelWorkspace onNavigate={setActiveWorkspace} />}
 {activeWorkspace === 'ai' && <AIWorkspace onNavigate={setActiveWorkspace} />}
 {activeWorkspace === 'api' && <ApiWorkspace onNavigate={setActiveWorkspace} />}
 {activeWorkspace === 'financial' && <FinancialWorkspace onNavigate={setActiveWorkspace} />}
 {activeWorkspace === 'activation' && <ActivationWorkspace onNavigate={setActiveWorkspace} />}
 {activeWorkspace === 'intelligence' && <IntelligenceWorkspace onNavigate={setActiveWorkspace} />}
 {activeWorkspace === 'operations' && <OperationsWorkshop onNavigate={setActiveWorkspace} />}
 {activeWorkspace !== 'identity' && activeWorkspace !== 'security' && activeWorkspace !== 'kernel' && activeWorkspace !== 'ai' && activeWorkspace !== 'api' && activeWorkspace !== 'financial' && activeWorkspace !== 'activation' && activeWorkspace !== 'intelligence' && activeWorkspace !== 'operations' && (
 <div className="glass-panel p-6 md:p-8 text-center rounded-3xl h-[60vh] flex flex-col items-center justify-center">
 <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-6 animate-pulse">
 <Settings className="w-8 h-8 text-slate-500" />
 </div>
 <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Workspace Initialization</h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">Deep layer integration is pending for this sector. Core policies are still enforcing.</p>
 <button onClick={() => setActiveWorkspace('overview')} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg text-xs uppercase font-bold tracking-widest transition-colors">
 &larr; العودة للرئيسية
 </button>
 </div>
 )}
 </div>
 );
 }

 return (
 <div className="space-y-4 animate-in fade-in duration-500">
 <GovernanceBanner />
 <GovernanceStatusBar />
 
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
 <div>
 <h1 className="text-3xl font-black text-white uppercase tracking-tight">Enterprise Platform Governance</h1>
 <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-sm">Core Operating Workspace</p>
 </div>
 <div className="flex items-center gap-2">
 <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest shadow-inner">
 Audit Engine: ON
 </span>
 <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border border-slate-300 dark:border-slate-700">
 <FileText className="w-3 h-3" /> تصدير السجلات
 </button>
 </div>
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <KPICard title="حالة المنصة" value="Stable" icon={Activity} color="green" detail="Kernel Sync: 100%" />
 <KPICard title="مستوى الأمان" value="Critical" icon={Lock} color="red" detail="0 Active Threats" />
 <KPICard title="الجلسات الإدارية" value="8" icon={Users} color="blue" detail="5 Super, 3 Standard" />
 <KPICard title="سلامة الـ Kernel" value="Verified" icon={Shield} color="purple" detail="Policy Hash: 0x4A2" />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
 <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
 {sections.map((section, index) => (
 <GovernanceCard 
 key={index} 
 {...section} 
 onClick={() => setActiveWorkspace(section.id)} 
 />
 ))}
 </div>
 
 <div className="space-y-4">
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
 <h3 className="font-black text-white mb-6 uppercase tracking-widest text-xs flex items-center justify-between">
 <div className="flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
 التهديدات الأمنية الحالية
 </div>
 <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded text-[9px]">LIVE</span>
 </h3>
 <div className="space-y-4">
 {[
 { text: "محاولة دخول مشبوهة من IP: 192.168.1.1", time: "2 دقيقة", level: "Critical" },
 { text: "فشل تحديث سياسة في Kernel", time: "15 دقيقة", level: "High" },
 { text: "API Rate Limit مكثف", time: "1 ساعة", level: "Medium" }
 ].map((act, i) => (
 <div key={i} className="flex flex-col gap-1 text-sm border-b border-slate-200 dark:border-slate-800/50 pb-3 last:border-0 last:pb-0">
 <div className="flex items-start justify-between gap-3">
 <span className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{act.text}</span>
 <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 whitespace-nowrap">{act.time}</span>
 </div>
 <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded w-fit
 ${act.level === 'Critical' ? 'text-red-400 bg-red-500/10' : 
 act.level === 'High' ? 'text-orange-400 bg-orange-500/10' : 
 'text-yellow-400 bg-yellow-500/10'}
 `}>{act.level}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="glass-panel rounded-2xl p-6 relative">
 <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/30" />
 <h3 className="font-black text-white mb-6 uppercase tracking-widest text-xs flex items-center justify-between">
 <span>محرك سجل الأنشطة الإدارية</span>
 <Activity className="w-3 h-3 text-blue-400" />
 </h3>
 <div className="space-y-4">
 {liveLogs.length > 0 ? liveLogs.map((log) => (
 <div key={log.id} className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800/50 pb-3 last:border-0 last:pb-0">
 <div className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
 <div className={`mt-1 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]
 ${log.type === 'error' ? 'bg-red-500 text-red-500' : 
 log.type === 'warning' ? 'bg-orange-500 text-orange-500' : 
 log.type === 'success' ? 'bg-green-500 text-green-500' : 
 'bg-blue-500 text-blue-500'}
 `} />
 <span className="flex-1 leading-relaxed">{log.message}</span>
 </div>
 <div className="flex items-center justify-between pl-4 text-[9px] uppercase font-bold tracking-widest">
 <span className="text-slate-500">By: <span className={log.type === 'error' ? 'text-red-400' : 'text-blue-400'}>System</span></span>
 <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
 </div>
 </div>
 )) : (
 <div className="text-center py-4 text-xs text-slate-500">جاري الاتصال بمحرك السجلات...</div>
 )}
 </div>
 <button className="w-full mt-4 text-[9px] uppercase font-bold tracking-widest text-slate-500 hover:text-white transition-colors border border-slate-200 dark:border-slate-800 rounded py-2 hover:bg-slate-100 dark:bg-slate-800">
 عرض السجل الكامل
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
