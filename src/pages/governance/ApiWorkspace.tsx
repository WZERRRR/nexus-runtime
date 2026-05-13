import React, { useState, useEffect } from 'react';
import { Network, Activity, Globe, Link2, ShieldAlert, Key } from 'lucide-react';
import { runtimeAPI, RuntimeLog } from '../../services/runtimeApi';

export function ApiWorkspace({ onNavigate }: { onNavigate: (view: string) => void }) {
 const [logs, setLogs] = useState<RuntimeLog[]>([]);

 useEffect(() => {
 runtimeAPI.getLogs().then(setLogs).catch(console.error);
 }, []);

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
 <div>
 <button onClick={() => onNavigate('overview')} className="text-[10px] uppercase font-bold text-slate-500 hover:text-white mb-2 tracking-widest transition-colors flex items-center gap-1">
 &larr; العودة للوحة الرئيسية
 </button>
 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
 <Network className="w-6 h-6 text-yellow-500" />
 إدارة واجهات الربط (API & Integrations)
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Platform Integration Control Layer</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
 API Gateway: LIVE
 </span>
 <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
 تحديث مفاتيح API
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {[
 { title: "الطلبات (24h)", value: "1.2M", icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
 { title: "Webhooks", value: "24 Active", icon: Link2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
 { title: "محاولات مرفوضة", value: "3,402", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
 { title: "مفاتيح (Active)", value: "48", icon: Key, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
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

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/50" />
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between">
 <span className="flex items-center gap-2">
 <Activity className="w-4 h-4 text-yellow-400" />
 Live Gateway Traffic
 </span>
 <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">Realtime</span>
 </h3>
 
 <div className="space-y-4">
 {[
 { endpoint: "/api/v1/auth/verify", method: "POST", status: 200, time: "42ms", ip: "192.168.1.5" },
 { endpoint: "/api/v1/users/profile", method: "GET", status: 200, time: "18ms", ip: "10.0.0.12" },
 { endpoint: "/api/v1/payments/process", method: "POST", status: 429, time: "10ms", ip: "172.16.x.x" },
 { endpoint: "/api/v1/system/health", method: "GET", status: 200, time: "5ms", ip: "Internal" },
 ].map((req, idx) => (
 <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
 <div className="flex items-center gap-4">
 <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded
 ${req.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}
 `}>{req.method}</span>
 <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">{req.endpoint}</span>
 </div>
 <div className="flex items-center gap-4">
 <span className="text-[10px] text-slate-500">{req.ip}</span>
 <span className={`text-[10px] font-bold px-2 py-1 rounded
 ${req.status === 200 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
 `}>{req.status}</span>
 <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">{req.time}</span>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="space-y-6">
 <div className="glass-panel rounded-2xl p-6">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between">
 <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-purple-400" /> Active Webhooks</span>
 </h3>
 <div className="space-y-4">
 {[
 { name: "Stripe Events", dest: "api.stripe.com/hooks", state: "Healthy" },
 { name: "GitHub Deploy", dest: "api.github.com/events", state: "Healthy" },
 { name: "Slack Alerts", dest: "hooks.slack.com/...", state: "Failing" },
 ].map((hook, i) => (
 <div key={i} className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800/50">
 <div className="flex justify-between items-center text-xs">
 <span className="text-slate-700 dark:text-slate-300 font-bold">{hook.name}</span>
 <span className={`text-[9px] uppercase font-bold ${hook.state === 'Healthy' ? 'text-green-400' : 'text-red-400'}`}>{hook.state}</span>
 </div>
 <span className="text-[10px] text-slate-500 font-mono truncate">{hook.dest}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
