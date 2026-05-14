import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
 Bot, Brain, Cpu, Zap, Activity, Eye, 
 Terminal, RefreshCw, Sparkles, MessageSquare, 
 Workflow, Database, Network, ShieldCheck, 
 AlertTriangle, CheckCircle2, Binary, Search,
 Filter, Settings2, MoreVertical, Layers,
 Lightbulb, ZapOff, Fingerprint, Waves
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { ProjectHeader } from '../components/common/ProjectHeader';

const NEURAL_TRAFFIC = [
 { time: '00:00', load: 12, precision: 99.8, events: 45 },
 { time: '04:00', load: 8, precision: 99.9, events: 32 },
 { time: '08:00', load: 45, precision: 98.5, events: 156 },
 { time: '12:00', load: 88, precision: 97.2, events: 480 },
 { time: '16:00', load: 65, precision: 98.8, events: 320 },
 { time: '20:00', load: 74, precision: 99.1, events: 210 },
 { time: '23:59', load: 45, precision: 99.5, events: 95 },
];

const AI_INSIGHTS = [
 { 
 id: 1, 
 type: 'optimization', 
 title: 'تحسين استعلامات SQL', 
 description: 'اكتشف المراقب الذكي بطء في استعلامات "orders_search". تم اقتراح إضافة Index مركب لتقليل زمن الاستجابة بنسبة 40%.',
 priority: 'high',
 status: 'READY'
 },
 { 
 id: 2, 
 type: 'security', 
 title: 'كشف سلوك غير معتاد', 
 description: 'تم حجب 150 طلب متكرر من نطاق IP في سنغافورة يحاول استكشاف ثغرات API. تم تفعيل جدار الحماية التلقائي.',
 priority: 'critical',
 status: 'ENFORCED'
 },
 { 
 id: 3, 
 type: 'resource', 
 title: 'توقع زيادة الحمل', 
 description: 'بناءً على الأنماط التاريخية، من المتوقع زيادة الحمل بنسبة 300% في الساعة 8 مساءً. يوصى بزيادة عدد الحاويات.',
 priority: 'medium',
 status: 'SUGGESTED'
 }
];

const LIVE_EVENTS = [
 { time: '14:25:01', source: 'Logic Engine', msg: 'Neural pattern matched for "DDoS Attempt"', type: 'success' },
 { time: '14:24:45', source: 'Database', msg: 'Slow query detected in "reports_v2"', type: 'warning' },
 { time: '14:22:10', source: 'System', msg: 'Auto-scaled cluster to 5 nodes', type: 'info' },
 { time: '14:20:05', source: 'Security', msg: 'WAF Rule #402 updated automatically', type: 'success' },
 { time: '14:18:30', source: 'Cache', msg: 'Redis eviction rate increased', type: 'warning' },
];

export function AIMonitor() {
 const { state } = useLocation();
 const navigate = useNavigate();
 const context = state?.project;
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [neuralHealth, setNeuralHealth] = useState(99.4);
 const [toast, setToast] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);

 const showToast = (message: string, type: 'success' | 'alert' = 'success') => {
 setToast({ message, type });
 window.setTimeout(() => setToast(null), 3000);
 };

 const handleRunAnalysis = () => {
 setIsAnalyzing(true);
 setTimeout(() => {
 setIsAnalyzing(false);
 setNeuralHealth(prev => Math.min(100, prev + 0.1));
 }, 2000);
 };

 return (
 <div className="space-y-8 flex flex-col h-[calc(100vh-6rem)] overflow-hidden text-right font-sans" dir="rtl">
 <AnimatePresence>
 {toast && (
 <motion.div
 initial={{ opacity: 0, y: -20, x: '-50%' }}
 animate={{ opacity: 1, y: 20, x: '-50%' }}
 exit={{ opacity: 0, y: -20, x: '-50%' }}
 className={`fixed top-4 left-1/2 z-[150] px-5 py-3 rounded-xl border shadow-2xl flex items-center gap-2 text-xs font-bold backdrop-blur-md ${
 toast.type === 'success' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-300'
 }`}
 >
 <ShieldCheck className="w-4 h-4" />
 {toast.message}
 </motion.div>
 )}
 </AnimatePresence>

 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "المحرك العصبي الذكي: مراقبة الأداء عبر الذكاء الاصطناعي، الكشف الاستباقي عن المشاكل، والتحسين التلقائي للموارد."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="المراقب الذكي (Neural Core)"
 actions={
 <div className="flex gap-3 text-right">
 <button 
 onClick={handleRunAnalysis}
 className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 text-blue-400 rounded-xl border border-blue-500/10 transition-all text-[10px] font-black uppercase tracking-widest group"
 >
 <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-700 ${isAnalyzing ? 'animate-spin' : ''}`} />
 {isAnalyzing ? 'جاري التحليل العصبي...' : 'بدء فحص شامل'}
 </button>
 <button 
 onClick={() => showToast('تم تفعيل أتمتة القرارات عبر طبقة Governance')}
 className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-[10px] font-black shadow-lg shadow-blue-500/20 active:scale-95 uppercase tracking-widest"
 >
 <Workflow className="w-4 h-4" />
 أتمتة القرارات
 </button>
 </div>
 }
 />

 {/* AI Metrics */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
 <InsightCard 
 icon={<Brain className="w-4 h-4 text-purple-400" />}
 title="صحة النظام العصبية"
 value={`${neuralHealth}%`}
 sub="دقة التنبؤ: 99.8%"
 status="مثالي"
 type="purple"
 />
 <InsightCard 
 icon={<Zap className="w-4 h-4 text-blue-400" />}
 title="إجراءات تلقائية"
 value="1,245"
 sub="معالجة ذاتية بالكامل"
 trend="+15.2%"
 type="blue"
 />
 <InsightCard 
 icon={<Lightbulb className="w-4 h-4 text-amber-400" />}
 title="توصيات نشطة"
 value="03"
 sub="تحتاج تدخل بشري"
 status="انتظار"
 type="amber"
 />
 <InsightCard 
 icon={<Binary className="w-4 h-4 text-emerald-400" />}
 title="كفاءة الكود"
 value="94.2%"
 sub="تغطية التحليل الذكي"
 status="محسن"
 type="emerald"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
 {/* Neural Analysis Chart */}
 <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
 <div className="glass-panel p-4 md:p-5 rounded-xl relative overflow-hidden flex flex-col ">
 <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[100px] -mr-48 -mt-24 rounded-full"></div>
 
 <div className="flex items-center justify-between mb-10 relative z-10 font-sans">
 <div>
 <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
 <Waves className="w-4 h-4 text-purple-500" /> مراقبة النبض العصبي (Neural Pulse)
 </h3>
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">REALTIME MODEL INFERENCE & SYSTEM LOAD</p>
 </div>
 <div className="flex gap-4">
 <div className="flex items-center gap-2 text-[10px] font-black text-blue-400">
 <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm dark:shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> ضغط النظام
 </div>
 <div className="flex items-center gap-2 text-[10px] font-black text-purple-400">
 <div className="w-2 h-2 rounded-full bg-purple-500"></div> دقة التنبؤ
 </div>
 </div>
 </div>

 <div className="flex-1 w-full font-mono" dir="ltr">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={NEURAL_TRAFFIC}>
 <defs>
 <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorPrecision" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1}/>
 <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
 <XAxis dataKey="time" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
 <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
 <Tooltip 
 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
 itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
 />
 <Area type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" />
 <Line type="monotone" dataKey="precision" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="5 5" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* AI Action Logs */}
 <div className="glass-panel rounded-xl overflow-hidden flex flex-col flex-1">
 <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between px-5 shrink-0">
 <div className="flex items-center gap-3">
 <Binary className="w-4 h-4 text-blue-500" />
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] font-sans">سجل القرارات الذكية (Neural Logs)</h3>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-sans">معالجة لحظية</span>
 </div>
 </div>
 </div>
 <div className="flex-1 overflow-auto custom-scrollbar">
 <table className="w-full text-right text-xs">
 <thead className="bg-white dark:bg-slate-900/20 text-slate-500 sticky top-0 z-20 backdrop-blur-md font-sans">
 <tr>
 <th className="px-8 py-4 font-black uppercase tracking-widest text-[9px]">الوقت</th>
 <th className="px-8 py-4 font-black uppercase tracking-widest text-[9px]">المحرك (Source)</th>
 <th className="px-8 py-4 font-black uppercase tracking-widest text-[9px]">الإجراء / الرسالة</th>
 <th className="px-8 py-4 font-black uppercase tracking-widest text-[9px]">الحالة</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono">
 {LIVE_EVENTS.map((event, idx) => (
 <tr key={idx} className="hover:bg-white/[0.02] transition-all group">
 <td className="px-8 py-4 text-slate-600 dark:text-slate-400 font-bold whitespace-nowrap">{event.time}</td>
 <td className="px-8 py-4">
 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded-md">{event.source}</span>
 </td>
 <td className="px-8 py-4 font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{event.msg}</td>
 <td className="px-8 py-4">
 <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${
 event.type === 'success' ? 'text-emerald-400' : 
 event.type === 'warning' ? 'text-amber-400' : 'text-blue-400'
 }`}>
 <div className={`w-1 h-1 rounded-full ${
 event.type === 'success' ? 'bg-emerald-500' : 
 event.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
 }`}></div>
 {event.type}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* AI Insights Sidebar */}
 <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
 <div className="glass-panel p-4 md:p-5 rounded-xl relative overflow-hidden group shrink-0">
 <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] -ml-16 -mt-16 rounded-full"></div>
 
 <div className="flex items-center justify-between mb-8 relative z-10 font-sans">
 <Sparkles className="w-6 h-6 text-purple-400" />
 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">توصيات الذكاء الاصطناعي</span>
 </div>

 <div className="space-y-4 relative z-10">
 {AI_INSIGHTS.map((insight) => (
 <motion.div 
 key={insight.id}
 whileHover={{ scale: 1.02 }}
 className={`p-3 rounded-xl border transition-all cursor-pointer ${
 insight.priority === 'critical' ? 'bg-red-500/5 border-red-500/20' : 
 insight.priority === 'high' ? 'bg-blue-500/5 border-blue-500/20' : 
 'bg-slate-200 dark:bg-white/5 border-slate-200 dark:border-white/5'
 }`}
 >
 <div className="flex justify-between items-start mb-2">
 <h4 className="text-[11px] font-black text-white uppercase tracking-tight text-right">{insight.title}</h4>
 <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
 insight.status === 'ENFORCED' ? 'bg-emerald-500/20 text-emerald-400' : 
 insight.status === 'READY' ? 'bg-blue-500/20 text-blue-400' : 
 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
 }`}>
 {insight.status}
 </span>
 </div>
 <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed text-right font-sans">{insight.description}</p>
 <div className="flex justify-end mt-4">
 <button onClick={() => showToast('تم تحويل التوصية إلى إجراء تشغيل فعلي')} className="text-[10px] font-black text-blue-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2 font-sans">
 تنفيذ الآن <Zap className="w-3 h-3" />
 </button>
 </div>
 </motion.div>
 ))}
 </div>
 </div>

 {/* Neural Learning Progress */}
 <div className="glass-panel p-4 md:p-5 rounded-xl flex-1 flex flex-col font-sans">
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
 <Fingerprint className="w-4 h-4 text-blue-400" /> تقدم التعلم الذاتي
 </h3>
 
 <div className="space-y-8">
 <LearningItem label="فهم أنماط الهجوم" progress={98} type="blue" />
 <LearningItem label="تحسين استهلاك الموارد" progress={85} type="purple" />
 <LearningItem label="توقع أعطال الهاردوير" progress={62} type="emerald" />
 <LearningItem label="دقة تصنيف المحتوى" progress={94} type="blue" />
 </div>

 <div className="mt-auto pt-8 flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest border-t border-slate-200 dark:border-white/5">
 <div className="flex items-center gap-2">
 <Database className="w-3.5 h-3.5" />
 TRAINED ON 4.2TB DATA
 </div>
 <div className="text-blue-400">ENGINE v2.4</div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

function LearningItem({ label, progress, type }: any) {
 const colorClass = type === 'purple' ? 'bg-purple-500' : type === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';
 const shadowClass = type === 'purple' ? 'shadow-sm dark:shadow-[0_0_10px_rgba(168,85,247,0.5)]' : type === 'emerald' ? 'shadow-sm dark:shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'shadow-sm dark:shadow-[0_0_10px_rgba(59,130,246,0.5)]';

 return (
 <div>
 <div className="flex justify-between items-center mb-2">
 <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 text-right">{label}</span>
 <span className="text-[10px] font-black text-white">{progress}%</span>
 </div>
 <div className="h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${progress}%` }}
 transition={{ duration: 1.5, ease: "easeOut" }}
 className={`h-full ${colorClass} ${shadowClass}`}
 />
 </div>
 </div>
 );
}

function InsightCard({ icon, title, value, sub, trend, status, type = 'blue' }: any) {
 const getColors = () => {
 switch (type) {
 case 'purple': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
 case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
 case 'amber': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
 default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
 }
 };

 return (
 <motion.div 
 whileHover={{ y: -4 }}
 className="glass-panel p-4 rounded-xl relative overflow-hidden group font-sans"
 >
 <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 -mr-12 -mt-12 rounded-full transition-all group-hover:opacity-40 animate-pulse ${getColors().split(' ')[0]}`}></div>
 <div className="flex justify-between items-start relative z-10 mb-4">
 <div className={`p-2.5 rounded-2xl border transition-transform group-hover:scale-110 ${getColors()}`}>
 {icon}
 </div>
 {trend && (
 <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border ${trend.startsWith('+') ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5'}`}>
 <Zap className={`w-3 h-3 ${trend.startsWith('-') ? 'opacity-50' : ''}`} />
 {trend}
 </div>
 )}
 {status && (
 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
 <div className="w-1 h-1 rounded-full bg-slate-500"></div>
 {status}
 </span>
 )}
 </div>
 <div className="relative z-10 text-right">
 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</h3>
 <p className="text-2xl font-black text-white tracking-tight uppercase">{value}</p>
 <p className="text-[10px] text-slate-600 font-bold mt-1.5 uppercase tracking-wide">{sub}</p>
 </div>
 </motion.div>
 );
}
