import React, { useState, useEffect } from 'react';
import { Users, Shield, Lock, Fingerprint, Key, AlertTriangle, Monitor } from 'lucide-react';
import { runtimeAPI } from '../../services/runtimeApi';

export function IdentityWorkspace({ onNavigate }: { onNavigate: (view: string) => void }) {
 const [suspendModal, setSuspendModal] = useState<string | null>(null);
 const [sessions, setSessions] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(true);

 const fetchSessions = async () => {
 try {
 const data = await runtimeAPI.getSessions();
 setSessions(data);
 } catch (e) {
 console.error(e);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchSessions();
 const intervalId = setInterval(fetchSessions, 5000);
 return () => clearInterval(intervalId);
 }, []);

 const performSuspend = async (uid: string) => {
 const res = await runtimeAPI.suspendSession(uid);
 if (res.success) {
 alert(`Security Audit: Session for [${uid}] has been forcefully terminated.`);
 await fetchSessions();
 }
 setSuspendModal(null);
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
 <div>
 <button onClick={() => onNavigate('overview')} className="text-[10px] uppercase font-bold text-slate-500 hover:text-white mb-2 tracking-widest transition-colors flex items-center gap-1">
 &rarr; العودة للوحة الرئيسية
 </button>
 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
 <Users className="w-6 h-6 text-cyan-500" />
 إدارة الهوية والصلاحيات
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 uppercase font-bold tracking-tighter text-right">بيئة عمل إدارة الهوية والوصول (IAM)</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-cyan-500" />
 تطبيق سياسة RBAC
 </span>
 <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
 تحديث سياسات الوصول
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {[
 { title: "حسابات نشطة", value: "1,240", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
 { title: "الجلسات النشطة", value: "342", icon: Monitor, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
 { title: "أذونات مخصصة", value: "14", icon: Key, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
 { title: "محاولات فاشلة", value: "89", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
 ].map((stat, i) => (
 <div key={i} className={`glass-panel p-4 border ${stat.border} rounded-2xl relative overflow-hidden group hover: transition-all text-right`}>
 <div className={`absolute top-0 right-0 p-4 ${stat.bg} rounded-bl-3xl`}>
 <stat.icon className={`w-5 h-5 ${stat.color}`} />
 </div>
 <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{stat.title}</p>
 <p className="text-2xl font-black text-white">{stat.value}</p>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
 <div className="lg:col-span-2 space-y-6">
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-full h-1 bg-cyan-500/50" />
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 الجلسات المباشرة للمستخدمين
 <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
 </h3>
 <div className="space-y-4">
 {isLoading ? (
 <p className="text-slate-500 text-xs text-center py-4">جاري تحميل الجلسات...</p>
 ) : sessions.length === 0 ? (
 <p className="text-slate-500 text-xs text-center py-4">لا توجد جلسات نشطة حالياً.</p>
 ) : sessions.map((user, i) => (
 <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 transition-colors text-right">
 <div className="flex items-center gap-3 order-2 md:order-1">
 <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-cyan-400">
 {user.role}
 </span>
 <button 
 onClick={() => setSuspendModal(user.uid)}
 className="text-[10px] text-red-400 hover:bg-red-500/10 px-3 py-2 rounded transition-colors uppercase font-bold tracking-widest flex items-center gap-1 border border-transparent hover:border-red-500/20">
 <Lock className="w-3 h-3" /> تعليق
 </button>
 </div>
 <div className="flex items-center gap-4 order-1 md:order-2">
 <div>
 <p className="text-sm font-bold text-white mb-1">المعرف: {user.uid}</p>
 <p className="text-[10px] text-slate-500 uppercase tracking-widest">
 {user.device} • {user.ip} • الحالة: <span className="text-green-400">{user.status === 'Active' ? 'نشط' : user.status}</span>
 </p>
 </div>
 <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700">
 <Fingerprint className="w-6 h-6 text-slate-600 dark:text-slate-400" />
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">سياق الأمن</h3>
 <div className="space-y-4">
 <div className="p-4 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
 <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest mb-2 flex justify-between">
 <span className="text-green-400">95%</span>
 <span>تطبيق المصادقة الثنائية (MFA)</span>
 </p>
 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full w-[95%]" /></div>
 <p className="text-[10px] text-slate-500 mt-2">1,178 / 1,240 مستخدم</p>
 </div>
 <div className="p-4 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
 <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest mb-2 flex justify-between">
 <span className="text-purple-400">12</span>
 <span>حسابات المسؤولين</span>
 </p>
 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full w-[10%]" /></div>
 <p className="text-[10px] text-slate-500 mt-2">تتم مراقبتها بصرامة</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {suspendModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
 <div className="bg-white dark:bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-sm dark:shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in zoom-in-95 text-right">
 <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
 <h3 className="text-center text-lg font-black text-white uppercase tracking-tight mb-2">فرض تعليق الجلسة</h3>
 <p className="text-center text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
 هل أنت متأكد أنك تريد إنهاء الجلسة النشطة للمستخدم ذو المعرف: <span className="text-white font-mono">{suspendModal}</span>؟ سيتم تسجيل هذا الإجراء في سجل تدقيق وقت التشغيل.
 </p>
 <div className="flex gap-3">
 <button onClick={() => setSuspendModal(null)} className="flex-1 py-3 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:text-white transition-colors border border-slate-200 dark:border-slate-800 rounded-lg">إلغاء</button>
 <button onClick={() => performSuspend(suspendModal)} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.3)]">إنهاء</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
