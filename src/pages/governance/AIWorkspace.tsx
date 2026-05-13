import React, { useState } from 'react';
import { Brain, Sparkles, Activity, Shield, Code, Server, Zap } from 'lucide-react';
import { runtimeAPI } from '../../services/runtimeApi';

export function AIWorkspace({ onNavigate }: { onNavigate: (view: string) => void }) {
 const [isResetting, setIsResetting] = useState(false);

 const resetBrainContext = async () => {
 setIsResetting(true);
 await runtimeAPI.clearCache(); // Mimic Neural Engine Reset in logs
 alert("SYSTEM NOTIFICATION: Neural Engine Context has been flushed. AI will re-index platform state.");
 setIsResetting(false);
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
 <div>
 <button onClick={() => onNavigate('overview')} className="text-[10px] uppercase font-bold text-slate-500 hover:text-white mb-2 tracking-widest transition-colors flex items-center gap-1">
 &rarr; العودة للوحة الرئيسية
 </button>
 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
 <Brain className="w-6 h-6 text-purple-500" />
 حوكمة الذكاء الاصطناعي المركزي
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 uppercase font-bold tracking-tighter text-right">النواة العصبية للذكاء الاصطناعي، الحوكمة ومحرك القرار (متصل بـ Gemini Pro)</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
 المحرك العصبي: متزامن
 </span>
 <button 
 onClick={resetBrainContext}
 disabled={isResetting}
 className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 disabled:bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
 {isResetting ? "جاري المسح..." : "مسح سياق AI"}
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {[
 { title: "حالة المحرك", value: "نشط", icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
 { title: "القرارات التلقائية", value: "842", icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
 { title: "الاسترداد الذاتي", value: "استعداد", icon: Shield, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
 { title: "نشاط العصبية", value: "92%", icon: Brain, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
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

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-full h-1 bg-purple-500/50" />
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between text-right">
 <span className="text-[9px] text-purple-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded tracking-tighter uppercase">تدقيق مباشر</span>
 <span className="flex items-center gap-2">
 مخرجات قرارات الذكاء الاصطناعي
 <Activity className="w-4 h-4 text-purple-400" />
 </span>
 </h3>
 <div className="space-y-4">
 {[
 { decision: "استرداد ذاتي: تم حل تسرب الذاكرة", scope: "المشروع: NextJS-Core", confidence: "98%", time: "منذ 2 دقيقة", status: "Executed" },
 { decision: "تخفيف التهديد: حظر نطاق IP", scope: "أمن Nexus", confidence: "99%", time: "منذ 15 دقيقة", status: "Executed" },
 { decision: "تحديث سياسة مقترح: حد المعدل", scope: "بوابة API", confidence: "85%", time: "منذ 1 ساعة", status: "Pending Appr." },
 { decision: "إعادة توازن الموارد", scope: "العنقود العالمي", confidence: "94%", time: "منذ 3 ساعات", status: "Executed" },
 ].map((event, i) => (
 <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-purple-500/30 transition-colors text-right">
 <div className="flex items-center gap-3 order-2 md:order-1">
 <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold">{event.time}</span>
 <span className="text-[10px] uppercase font-bold text-blue-400 border border-blue-400/20 bg-blue-400/10 px-2 py-1 rounded">
 ثقة: {event.confidence}
 </span>
 </div>
 <div className="flex items-center gap-4 mb-2 md:mb-0 order-1 md:order-2">
 <div className="text-right">
 <p className="text-sm font-bold text-white mb-1">{event.decision}</p>
 <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2 justify-end">
 {event.scope}
 </p>
 </div>
 <div className={`w-2 h-2 rounded-full ${event.status === 'Executed' ? 'bg-green-500 shadow-sm dark:shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 animate-pulse'}`} />
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="space-y-6">
 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 سياق تشغيل Gemini
 <Code className="w-4 h-4 text-purple-400" />
 </h3>
 <div className="space-y-4">
 {[
 { name: "مزامنة سياق المنصة", state: "نشط", risk: "آمن" },
 { name: "فهرسة الكود", state: "مستمر", risk: "آمن" },
 { name: "سجل تدقيق المدير", state: "للقراءة فقط", risk: "آمن" },
 { name: "حارس سلامة النواة", state: "صارم", risk: "آمن" },
 ].map((pol, i) => (
 <div key={i} className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-slate-800/50 last:border-0 text-xs">
 <div className="flex items-center gap-2">
 <span className="text-[9px] uppercase text-slate-500 font-bold tracking-widest">{pol.risk === 'Safe' ? 'آمن' : pol.risk}</span>
 <span className="text-[9px] uppercase text-green-400 font-black tracking-widest">{pol.state}</span>
 </div>
 <span className="text-slate-700 dark:text-slate-300 font-bold">{pol.name}</span>
 </div>
 ))}
 </div>
 </div>
 <div className="glass-panel border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-slate-900 rounded-2xl p-6 relative overflow-hidden group">
 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPjwvc3ZnPg==')] opacity-50" />
 <div className="relative z-10 flex flex-col items-center text-center">
 <Zap className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 group-hover:drop-shadow-sm dark:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-500" />
 <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">سلطة عقل Nexus</h4>
 <p className="text-[10px] text-slate-600 dark:text-slate-400 uppercase font-bold leading-relaxed mb-4">
 يعمل محرك DevCore AI مع قيود Sandbox صارمة. الأوامر التدميرية محظورة تمامًا بواسطة طبقة حوكمة وقت التشغيل.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
