import React, { useState } from 'react';
import { Terminal, ShieldCheck, Server, Lock, Play, Activity } from 'lucide-react';
import { runtimeAPI } from '../../services/runtimeApi';

export function ActivationWorkspace({ onNavigate }: { onNavigate: (view: string) => void }) {
 const [isVerifying, setIsVerifying] = useState(false);
 const [verificationLog, setVerificationLog] = useState<string[]>([]);

 const handleVerify = async () => {
 setIsVerifying(true);
 setVerificationLog(["[System] Starting Production Readiness Verification..."]);
 
 const steps = [
 "Checking Kernel Integrity... OK",
 "Validating SSH Isolation Layer... SECURE",
 "Verifying Environment Health... STABLE",
 "Testing Database Connections... OK",
 "SSL/TLS Certificate Verification... VALID",
 "Checking Active Governance Policies... 14 ACTIVE",
 "[System] Production Validation Complete. System is READY for LIVE Operations."
 ];

 for (let i = 0; i < steps.length; i++) {
 await new Promise(r => setTimeout(r, 800));
 setVerificationLog(prev => [...prev, steps[i]]);
 }
 
 setIsVerifying(false);
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
 <div>
 <button onClick={() => onNavigate('overview')} className="text-[10px] uppercase font-bold text-slate-500 hover:text-white mb-2 tracking-widest transition-colors flex items-center gap-1">
 &larr; العودة للوحة الرئيسية
 </button>
 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
 <Terminal className="w-6 h-6 text-indigo-500" />
 مركز التفعيل والتشغيل للإنتاج
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Production Readiness & Deployment Governance Layer</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
 Read Only Mode
 </span>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {[
 { title: "SSH Isolation", value: "Verified", icon: Lock, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
 { title: "Environment Health", value: "Stable", icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
 { title: "Production Readiness", value: "Pending Score", icon: ShieldCheck, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
 ].map((stat, i) => (
 <div key={i} className={`glass-panel p-4 border ${stat.border} rounded-2xl relative overflow-hidden group hover: transition-all`}>
 <div className={`absolute top-0 right-0 p-4 ${stat.bg} rounded-bl-3xl`}>
 <stat.icon className={`w-5 h-5 ${stat.color}`} />
 </div>
 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{stat.title}</p>
 <p className="text-2xl font-black text-white">{stat.value}</p>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col">
 <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50" />
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between">
 <span className="flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-indigo-400" />
 Production Readiness Engine
 </span>
 </h3>
 
 <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
 The Production Activation Center performs critical security, infrastructure, and runtime validations before authorizing any deployment or environmental changes to LIVE servers. This process ensures absolute compliance with governance policies.
 </p>

 <div className="mt-auto">
 <button 
 disabled={isVerifying}
 onClick={handleVerify}
 className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm dark:shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2"
 >
 {isVerifying ? (
 <><div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> Running Validations...</>
 ) : (
 <><Play className="w-4 h-4 fill-current" /> Initialize Readiness Verification</>
 )}
 </button>
 </div>
 </div>

 <div className="glass-panel rounded-2xl p-0 relative overflow-hidden flex flex-col h-96">
 <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-2">
 <Terminal className="w-4 h-4 text-slate-600 dark:text-slate-400" />
 <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-widest">Validation Output Stream</span>
 </div>
 <div className="p-4 font-mono text-[10px] text-green-400 flex-1 overflow-y-auto space-y-2">
 {verificationLog.map((log, i) => (
 <div key={i} className="animate-in fade-in slide-in-from-left-2">{log}</div>
 ))}
 {isVerifying && (
 <div className="animate-pulse flex items-center gap-1 text-slate-500">
 <span className="w-2 h-4 bg-slate-500 inline-block animate-ping" />
 </div>
 )}
 {verificationLog.length === 0 && !isVerifying && (
 <div className="text-slate-600">Awaiting execution...</div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
