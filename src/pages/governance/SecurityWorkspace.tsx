import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, AlertTriangle, Lock, Activity, Eye, ShieldCheck, FileText, Radar, Zap, Globe, Target, Fingerprint, LockKeyhole } from 'lucide-react';
import { runtimeAPI } from '../../services/runtimeApi';

export function SecurityWorkspace({ onNavigate }: { onNavigate: (view: string) => void }) {
 const [isLocking, setIsLocking] = useState(false);
 const [events, setEvents] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 const fetchEvents = async () => {
 try {
 const data = await runtimeAPI.getSecurityEvents();
 setEvents(data);
 } catch (e) {
 console.error(e);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchEvents();
 const intervalId = setInterval(fetchEvents, 5000);
 return () => clearInterval(intervalId);
 }, []);

 const enforceLockdown = async () => {
 setIsLocking(true);
 await new Promise(r => setTimeout(r, 1500));
 await runtimeAPI.clearCache();
 alert("تدقيق حرج: تم فرض إغلاق النظام. الدخول الخارجي مقيد بشدة.");
 await fetchEvents();
 setIsLocking(false);
 };

 const handleInspectThreat = (threatType: string) => {
 alert(`تم فتح وضع التحقيق للتهديد: ${threatType}`);
 };

 const handleOpenPolicies = () => {
 onNavigate('kernel');
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
 <div>
 <button onClick={() => onNavigate('overview')} className="text-[10px] uppercase font-black text-slate-500 hover:text-white mb-2 tracking-widest transition-colors flex items-center gap-1">
 &rarr; العودة إلى نظرة Nexus العامة
 </button>
 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
 <Shield className="w-6 h-6 text-red-500" />
 مركز العمليات الأمنية (SOC)
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 uppercase tracking-tighter font-bold font-mono">تحييد التهديدات والدفاع عن المحيط في الوقت الفعلي</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-inner">
 <Radar className="w-3 h-3 animate-spin duration-[3000ms]" />
 حالة DEFCON 4: حذر
 </span>
 <button 
 onClick={enforceLockdown}
 disabled={isLocking}
 className="bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-500 flex items-center gap-2 group">
 <Lock className="w-3 h-3 group-hover:scale-110 transition-transform" />
 {isLocking ? "جاري فرض الإغلاق..." : "فرض إغلاق المحيط الأمني"}
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {[
 { title: "التهديدات النشطة", value: "0", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
 { title: "طلبات L7/ثانية", value: "4,120", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
 { title: "المرشحات النشطة", value: "112", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
 { title: "الجلسات الآمنة", value: "1,240", icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
 ].map((stat, i) => (
 <div key={i} className={`glass-panel p-5 border ${stat.border} rounded-2xl relative overflow-hidden group hover: transition-all shadow-lg`}>
 <div className={`absolute top-0 right-0 p-4 ${stat.bg} rounded-bl-3xl opacity-50 group-hover:opacity-100 transition-opacity`}>
 <stat.icon className={`w-5 h-5 ${stat.color}`} />
 </div>
 <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest leading-none mb-3">{stat.title}</p>
 <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 {/* Live Threat Map & Events */}
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden ">
 <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
 <div className="flex items-center justify-between mb-8">
 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 text-right">
 <Activity className="w-5 h-5 text-red-400" />
 استخبارات مكافحة التهديدات التكيفية
 </h3>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
 <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">تتبع حي</span>
 </div>
 </div>

 {/* Mock Visual: Target Coordination */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
 {[
 { label: "فحص العقد الداخلية", status: "نظيف", icon: Target, color: "text-emerald-400" },
 { label: "سمعة الـ IP", status: "موثق", icon: Globe, color: "text-blue-400" },
 { label: "أنماط الوصول", status: "طبيعي", icon: Activity, color: "text-purple-400" }
 ].map((v, i) => (
 <div key={i} className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-4 group hover:border-slate-600 transition-all">
 <div className={`p-2 rounded-lg bg-white dark:bg-slate-900 ${v.color}`}>
 <v.icon className="w-4 h-4" />
 </div>
 <div className="text-right">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{v.label}</p>
 <p className={`text-xs font-black uppercase tracking-tight ${v.color}`}>{v.status}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="space-y-3">
 {isLoading ? (
 <p className="text-slate-500 text-xs text-center py-12 uppercase font-black tracking-widest animate-pulse">جاري إنشاء اتصال آمن...</p>
 ) : events.length === 0 ? (
 <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
 <ShieldCheck className="w-12 h-12 text-slate-700 mx-auto mb-3 opacity-30" />
 <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">لم يتم رصد أي انتهاكات للسياسات في المحيط الحالي</p>
 </div>
 ) : events.map((event, i) => (
 <div key={i} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all group hover:scale-[1.01]
 ${event.risk_level === 'Critical' ? 'bg-red-500/5 border-red-500/30 hover:border-red-500/60 shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 
 event.risk_level === 'High' ? 'bg-orange-500/5 border-orange-500/30 hover:border-orange-500/60' : 
 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-600'}`}
 >
 <div className="flex items-center gap-4 mb-3 md:mb-0">
 <div className={`w-3 h-3 rounded-full ${event.risk_level === 'Critical' ? 'bg-red-500 animate-pulse shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.8)]' : event.risk_level === 'High' ? 'bg-orange-500 shadow-sm dark:shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-yellow-500 shadow-sm dark:shadow-[0_0_8px_rgba(234,179,8,0.5)]'}`} />
 <div className="text-right">
 <div className="flex items-center gap-2 mb-1 justify-end">
 <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
 event.risk_level === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
 }`}>{event.risk_level === 'Critical' ? 'حرج' : event.risk_level === 'High' ? 'عالي' : 'متوسط'}</span>
 <p className="text-sm font-black text-white uppercase tracking-tight">{event.threat_type === 'Brute Force' ? 'محاولة اختراق' : event.threat_type}</p>
 </div>
 <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-3 font-mono justify-end">
 <span className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-slate-700" /> {event.source_ip}</span>
 <span className="text-slate-800">|</span>
 <span className={`font-bold ${event.risk_level === 'Critical' ? 'text-red-400/70' : 'text-slate-600 dark:text-slate-400/70'}`}>{event.action_taken === 'Blocked' ? 'تم الحظر' : event.action_taken}</span>
 </p>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <div className="text-right">
 <span className="text-[10px] text-slate-600 uppercase font-black font-mono">{new Date(event.timestamp).toLocaleTimeString()}</span>
 </div>
 <button onClick={() => handleInspectThreat(event.threat_type)} className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-xl group-hover:border-red-500/50">
 تحقيق
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="space-y-6">
 {/* Identity Perimeter */}
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden ">
 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl pointer-events-none" />
 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center justify-between">
 <span className="flex items-center gap-2"><Fingerprint className="w-5 h-5 text-purple-400" /> حوكمة IAM</span>
 <span className="text-[9px] text-purple-400 bg-purple-400/10 px-3 py-1 rounded-lg border border-purple-500/20 font-black tracking-widest">ZERO TRUST</span>
 </h3>
 <div className="space-y-4">
 {[
 { name: "تصعيد المستخدم الفائق", state: "طلبات MFA", icon: ShieldAlert },
 { name: "الأوامر ذات الصلاحيات", state: "تدقيق فقط", icon: LockKeyhole },
 { name: "سياق المنظمات المشترك", state: "رفض الكل", icon: AlertTriangle },
 ].map((pol, i) => (
 <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-xl group hover:border-slate-600 transition-all">
 <div className="flex items-center gap-3">
 <pol.icon className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
 <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-tight">{pol.name}</span>
 </div>
 <span className="text-[9px] font-black uppercase tracking-tighter text-purple-400 bg-purple-400/5 px-2 py-0.5 rounded border border-purple-500/10">{pol.state}</span>
 </div>
 ))}
 </div>
 <button onClick={handleOpenPolicies} className="w-full mt-8 bg-purple-600 hover:bg-purple-500 text-white rounded-xl py-3 text-[10px] uppercase font-black tracking-widest transition-all shadow-sm dark:shadow-[0_0_15px_rgba(147,51,234,0.3)] border border-purple-400/20">
 إدارة سياسات الأمن
 </button>
 </div>

 <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center py-12 relative overflow-hidden group">
 <div className="absolute inset-0 bg-gradient-to-t from-slate-100 dark:from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
 <div className="relative w-28 h-28 mb-6">
 <div className="absolute inset-0 border-4 border-emerald-500/10 rounded-full" />
 <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-[spin_6s_linear_infinite]" />
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-3xl font-black text-white drop-shadow-sm dark:shadow-[0_0_10px_rgba(16,185,129,0.5)]">98.2</span>
 <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">تصنيف A+</span>
 </div>
 </div>
 <h4 className="text-white font-black uppercase tracking-tight text-lg mb-1">معدل المرونة</h4>
 <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">مستوى التحصين التشغيلي</p>
 </div>
 </div>
 </div>
 </div>
 );
}
