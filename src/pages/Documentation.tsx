import React, { useState } from 'react';
import { Book, Shield, Cpu, Zap, Activity, Info, FileText, Lock, CheckCircle, AlertTriangle, BarChart, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Documentation = () => {
 const [activeTab, setActiveTab] = useState<'docs' | 'report'>('docs');

 const readinessMetrics = [
 { label: 'System Health Score', value: '98%', status: 'Optimal', icon: Activity, color: 'text-emerald-500' },
 { label: 'Stability Index', value: '96.4%', status: 'Stable', icon: Server, color: 'text-blue-500' },
 { label: 'Security Enforcement', value: '100%', status: 'Hardened', icon: Shield, color: 'text-red-500' },
 { label: 'Runtime Readiness', value: 'Ready', status: 'Enterprise', icon: Cpu, color: 'text-purple-500' },
 { label: 'Recovery Readiness', value: 'Verified', status: 'Active', icon: Zap, color: 'text-yellow-500' },
 { label: 'Deployment Reliability', value: '99.9%', status: 'Stable', icon: CheckCircle, color: 'text-emerald-500' },
 ];

 return (
 <div className="space-y-8 animate-in fade-in duration-700">
 <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
 <div>
 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
 <Book className="w-6 h-6 text-blue-500" />
 مركز التوثيق والتدقيق
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 uppercase font-bold tracking-tighter text-right">دليل تشغيل منصة NEXUS وتقرير الجاهزية التشغيلية</p>
 </div>
 
 <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-end md:self-auto">
 <button 
 onClick={() => setActiveTab('docs')}
 className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'docs' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
 >
 التوثيق الفني
 </button>
 <button 
 onClick={() => setActiveTab('report')}
 className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'report' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
 >
 تقرير الجاهزية (Audit)
 </button>
 </div>
 </div>

 <AnimatePresence mode="wait">
 {activeTab === 'docs' ? (
 <motion.div 
 key="docs"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="grid grid-cols-1 md:grid-cols-3 gap-6"
 >
 <div className="md:col-span-2 space-y-6">
 {/* System Architecture */}
 <section className="glass-panel rounded-2xl p-8 text-right">
 <h3 className="text-lg font-black text-white mb-6 flex items-center justify-end gap-3">
 هيكلية النظام الجوهرية
 <Cpu className="w-5 h-5 text-blue-400" />
 </h3>
 <div className="prose prose-invert max-w-none">
 <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
 تعتمد منصة **NEXUS** على بنية تحتية موزعة تدار بواسطة الذكاء الاصطناعي الجوهري (Neural Core). يتكون النظام من ثلاث طبقات رئيسية تعمل في انسجام تام لضمان الاستقرار والأمان.
 </p>
 <ul className="space-y-4 text-slate-600 dark:text-slate-400 marker:text-blue-500 font-bold">
 <li>
 <strong className="text-blue-400 ml-2">طبقة النواة (Kernel Layer):</strong> 
 تتحكم في الموارد الأساسية، إدارة العمليات، ومزامنة العقد عبر المناطق المختلفة.
 </li>
 <li>
 <strong className="text-purple-400 ml-2">طبقة الحوكمة (Governance Layer):</strong>
 تطبق سياسات الوصول (RBAC)، تدقق في الأوامر المنفذة، وتدير حدود الاستخدام.
 </li>
 <li>
 <strong className="text-emerald-400 ml-2">طبقة الاستخبارات (Intelligence Layer):</strong>
 تراقب الشذوذ في الأداء، تتنبأ بالفشل، وتقترح إجراءات التحسين التلقائية.
 </li>
 </ul>
 </div>
 </section>

 {/* Operational Protocols */}
 <section className="glass-panel rounded-2xl p-8 text-right">
 <h3 className="text-lg font-black text-white mb-6 flex items-center justify-end gap-3">
 بروتوكولات التشغيل القياسية (SOPs)
 <FileText className="w-5 h-5 text-emerald-400" />
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
 <h4 className="text-sm font-bold text-white mb-2">النشر والانتشار</h4>
 <p className="text-[11px] text-slate-500 leading-relaxed">
 يجب أن تمر جميع عمليات النشر بدورة التحقق الآلي (Automated Validation) بنسبة نجاح 100% قبل الانتقال لبيئة الإنتاج.
 </p>
 </div>
 <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
 <h4 className="text-sm font-bold text-white mb-2">الاستجابة للحوادث</h4>
 <p className="text-[11px] text-slate-500 leading-relaxed">
 في حال تراجع مؤشر الاستقرار تحت 80%، يتم تفعيل بروتوكول الاسترداد الذاتي (Self-Healing) تلقائياً.
 </p>
 </div>
 </div>
 </section>
 </div>

 <div className="space-y-6">
 {/* Security Policy */}
 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 سياسات الأمن السيبراني
 <Shield className="w-4 h-4 text-red-500" />
 </h3>
 <div className="space-y-4">
 {[
 "تشفير البيانات في حالة السكون والعبور.",
 "المصادقة الثنائية (MFA) إلزامية لجميع المسؤولين.",
 "تدقيق سجلات الوصول دورياً بواسطة AI.",
 "عزل موارد الإنتاج عن بيئات التطوير تماماً."
 ].map((policy, i) => (
 <div key={i} className="flex items-start gap-3 justify-end">
 <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">{policy}</span>
 <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500" />
 </div>
 ))}
 </div>
 </div>

 {/* Quick References */}
 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 روابط سريعة
 <Zap className="w-4 h-4 text-yellow-400" />
 </h3>
 <div className="space-y-2">
 <button className="w-full text-right p-3 hover:bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-end gap-2">
 دليل الأكواد والأنماط
 <Info className="w-3 h-3" />
 </button>
 <button className="w-full text-right p-3 hover:bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-end gap-2">
 خريطة طريق التوسعة
 <Info className="w-3 h-3" />
 </button>
 <button className="w-full text-right p-3 hover:bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-end gap-2">
 نماذج التقارير الإدارية
 <Info className="w-3 h-3" />
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 ) : (
 <motion.div 
 key="report"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="space-y-8"
 >
 <div className="glass-panel rounded-2xl p-10 text-right bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/10">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
 <div className="order-2 md:order-1 flex gap-4">
 <div className="px-5 py-2 bg-emerald-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest">Production Ready</div>
 <div className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-300 dark:border-slate-700">Ver 2.4.0-Enterprise</div>
 </div>
 <div className="order-1 md:order-2">
 <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">تقرير الجاهزية التشغيلية النهائي</h3>
 <p className="text-slate-600 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Final Enterprise Operational Readiness Report</p>
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
 {readinessMetrics.map((m, i) => (
 <div key={i} className="p-6 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl text-center group hover:border-emerald-500/30 transition-all">
 <m.icon className={`w-8 h-8 ${m.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
 <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{m.label}</p>
 <p className="text-xl font-black text-white">{m.value}</p>
 <p className={`text-[9px] font-bold uppercase mt-1 ${m.color}`}>{m.status}</p>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right">
 <div className="space-y-6">
 <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center justify-end gap-2">
 نقاط القوة التشغيلية
 <CheckCircle className="w-4 h-4 text-emerald-500" />
 </h4>
 <ul className="space-y-3">
 {[
 'حوكمة كاملة لجميع الأوامر المنفذة (Zero-Trust Logic).',
 'مراقبة لحظية لنبضات العقد والمزامنة الموزعة.',
 'نظام تنبؤ بالفشل يعتمد على سجلات الأداء التاريخية.',
 'بروتوكولات استعادة آلية (Self-Healing) مثبتة الفعالية.',
 'عزل كامل لبيئات الإنتاج عن التطوير.'
 ].map((item, i) => (
 <li key={i} className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800/50 flex items-center justify-end gap-3 font-bold">
 <span>{item}</span>
 <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
 </li>
 ))}
 </ul>
 </div>

 <div className="space-y-6">
 <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center justify-end gap-2">
 توصيات التحسين (Optimization Roadmap)
 <BarChart className="w-4 h-4 text-blue-500" />
 </h4>
 <ul className="space-y-3">
 {[
 'توسيع نطاق المزامنة ليشمل مناطق جغرافية أوسع (Multi-Region Rollout).',
 'تحسين خوارزمية التنبؤ لتقليل نسبة الإنذارات الكاذبة (Anomaly Refinement).',
 'أتمتة عملية تدوير المفاتيح الأمنية بشكل ربع سنوي.',
 'زيادة كثافة عقد المراقبة في الشبكات عالية الحمل.'
 ].map((item, i) => (
 <li key={i} className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800/50 flex items-center justify-end gap-3 font-bold">
 <span>{item}</span>
 <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
 </li>
 ))}
 </ul>
 </div>
 </div>

 <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
 <div className="flex items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
 <span>Audit ID: NEXUS-AUD-2026-005</span>
 <span>|</span>
 <span>Certified by: Neural AI Auditor</span>
 </div>
 <button className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2">
 <FileText className="w-4 h-4" />
 تصدير التقرير الفني (PDF/JSON)
 </button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};
