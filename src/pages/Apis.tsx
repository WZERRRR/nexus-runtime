import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
 Webhook, Activity, Globe, AlertCircle, CheckCircle2, 
 Box, Clock, ArrowUpRight, RefreshCw, BarChart2,
 Zap, ShieldCheck, Cpu, Database, Network, Key,
 Lock, Settings2, History, Search, Filter, Download,
 ExternalLink, Code2, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ProjectHeader } from '../components/common/ProjectHeader';

const TRAFFIC_DATA = [
 { time: '00:00', requests: 4500, errors: 45 },
 { time: '04:00', requests: 5200, errors: 52 },
 { time: '08:00', requests: 12000, errors: 120 },
 { time: '12:00', requests: 18000, errors: 210 },
 { time: '16:00', requests: 15500, errors: 155 },
 { time: '20:00', requests: 19200, errors: 192 },
 { time: '23:59', requests: 8500, errors: 85 },
];

const EXTERNAL_APIS = [
 { 
 id: 'gemini', 
 name: 'Gemini 1.5 Pro', 
 provider: 'Google Cloud',
 status: 'online', 
 latency: '840ms', 
 usage: '4.2K rpd', 
 cost: '$12.45',
 health: 99.9
 },
 { 
 id: 'stripe', 
 name: 'Stripe API v3', 
 provider: 'Stripe',
 status: 'online', 
 latency: '154ms', 
 usage: '8.5K rpd', 
 cost: '$420.00',
 health: 99.8
 },
 { 
 id: 'maps', 
 name: 'Maps Platform', 
 provider: 'Google Cloud',
 status: 'online', 
 latency: '45ms', 
 usage: '1.2K rpd', 
 cost: '$15.20',
 health: 100
 },
 { 
 id: 'resend', 
 name: 'Resend Mailing', 
 provider: 'Resend',
 status: 'warning', 
 latency: '1.2s', 
 usage: '12.5K rpd', 
 cost: '$5.00',
 health: 92.4
 },
];

type WebhookLog = {
 id: string;
 source: string;
 event: string;
 timestamp: string;
 status: number;
 latency: string;
};

const INITIAL_WEBHOOKS: WebhookLog[] = [
 { id: 'wh_1', source: 'STRIPE', event: 'checkout.session.completed', timestamp: '20:55:01', status: 200, latency: '42ms' },
 { id: 'wh_2', source: 'GITHUB', event: 'push', timestamp: '20:54:12', status: 200, latency: '124ms' },
 { id: 'wh_3', source: 'TWILIO', event: 'sms.delivered', timestamp: '20:53:45', status: 200, latency: '85ms' },
 { id: 'wh_4', source: 'MOYASAR', event: 'payment.failed', timestamp: '20:50:30', status: 400, latency: '210ms' },
 { id: 'wh_5', source: 'RESEND', event: 'email.opened', timestamp: '20:45:00', status: 200, latency: '15ms' },
];

export function ApisCenter() {
 const { state } = useLocation();
 const context = state?.project;
 const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(INITIAL_WEBHOOKS);
 const [isLive, setIsLive] = useState(true);

 useEffect(() => {
 if (!isLive) return;
 const interval = setInterval(() => {
 const sources = ['STRIPE', 'PAYPAL', 'SENDGRID', 'AWS', 'SLACK'];
 const events = ['data.sync', 'auth.login', 'file.upload', 'alert.triggered', 'member.joined'];
 const newWh: WebhookLog = {
 id: Math.random().toString(36).substr(2, 9),
 source: sources[Math.floor(Math.random() * sources.length)],
 event: events[Math.floor(Math.random() * events.length)],
 timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
 status: Math.random() > 0.05 ? 200 : 500,
 latency: Math.floor(Math.random() * 200 + 20) + 'ms'
 };
 setWebhookLogs(prev => [newWh, ...prev].slice(0, 50));
 }, 4000);
 return () => clearInterval(interval);
 }, [isLive]);

 return (
 <div className="space-y-8 flex flex-col h-[calc(100vh-6rem)] overflow-hidden text-right" dir="rtl">
 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "مركز بوابات الربط البرمجي (APIs)، مراقبة Webhooks، وتحليل استهلاك الخدمات الخارجية لحظياً."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="مدير واجهات البرمجيات"
 actions={
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-[10px] font-black uppercase tracking-widest group">
 <Key className="w-4 h-4 group-hover:rotate-12 transition-transform text-indigo-400" />
 إدارة المفاتيح
 </button>
 <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all text-[10px] font-black shadow-lg shadow-indigo-500/20 active:scale-95 uppercase tracking-widest">
 <Terminal className="w-4 h-4" />
 API Playground
 </button>
 </div>
 }
 />

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
 <InsightCard 
 icon={<Globe className="w-4 h-4 text-indigo-400" />}
 title="إجمالي الطلبات"
 value="1.2M"
 sub="خلال الـ 24 ساعة الماضية"
 trend="+15.2%"
 type="indigo"
 />
 <InsightCard 
 icon={<Clock className="w-4 h-4 text-emerald-400" />}
 title="متوسط الاستجابة"
 value="124ms"
 sub="لجميع بوابات الربط"
 status="مستقر"
 type="emerald"
 />
 <InsightCard 
 icon={<AlertCircle className="w-4 h-4 text-orange-400" />}
 title="أخطاء الربط"
 value="0.14%"
 sub="معدل منخفض جداً"
 trend="-2.1%"
 type="orange"
 />
 <InsightCard 
 icon={<Webhook className="w-4 h-4 text-blue-400" />}
 title="Webhooks حية"
 value="84"
 sub="نقاط ربط نشطة حالياً"
 status="مؤمنة"
 type="blue"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
 {/* Left: API Services Status */}
 <div className="lg:col-span-1 space-y-6 overflow-y-auto custom-scrollbar px-1">
 <div className="flex items-center justify-between mb-2 px-2">
 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">الخدمات الخارجية</h3>
 <Activity className="w-4 h-4 text-indigo-400" />
 </div>

 <div className="space-y-4 font-sans">
 {EXTERNAL_APIS.map((api) => (
 <motion.div 
 key={api.id}
 whileHover={{ y: -4 }}
 className="glass-panel p-6 rounded-[2rem] relative overflow-hidden group "
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] -mr-16 -mt-16 rounded-full group-hover:bg-indigo-500/10 transition-colors"></div>
 
 <div className="flex justify-between items-start relative z-10 mb-6">
 <div className="flex items-center gap-3">
 <div className={`p-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-white/5 group-hover:scale-110 transition-transform ${api.status === 'online' ? 'text-emerald-400' : 'text-orange-400'}`}>
 {api.id === 'gemini' ? <Cpu className="w-5 h-5" /> : 
 api.id === 'maps' ? <Globe className="w-5 h-5" /> : 
 api.id === 'resend' ? <Code2 className="w-5 h-5" /> : <Network className="w-5 h-5" />}
 </div>
 <div>
 <h4 className="text-xs font-black text-white uppercase tracking-tight">{api.name}</h4>
 <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">{api.provider}</p>
 </div>
 </div>
 <div className="flex flex-col items-end gap-1.5">
 <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${
 api.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
 }`}>
 <div className={`w-1 h-1 rounded-full ${api.status === 'online' ? 'bg-emerald-500 animate-pulse shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-orange-500'}`}></div>
 {api.status}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6 relative z-10">
 <div>
 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">الاستهلاك اللحظي</p>
 <p className="text-xs font-black text-white tracking-tight">{api.usage}</p>
 </div>
 <div className="text-left font-mono">
 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">زمن الاستجابة</p>
 <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{api.latency}</p>
 </div>
 </div>

 <div className="mt-6 flex items-center justify-between gap-4">
 <div className="flex-1 h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${api.health}%` }}
 className={`h-full ${api.health > 95 ? 'bg-emerald-500' : 'bg-orange-500'}`}
 />
 </div>
 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">{api.health}% Health</span>
 </div>
 </motion.div>
 ))}
 </div>
 </div>

 {/* Right: Charts & Webhooks Log */}
 <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
 {/* Traffic Chart */}
 <div className="glass-panel p-6 rounded-3xl relative overflow-hidden h-[45%]">
 <div className="flex items-center justify-between mb-8 text-right">
 <div className="flex items-center gap-3">
 <BarChart2 className="w-5 h-5 text-indigo-400" />
 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">تحليل حركة الـ APIs (Requests Log)</h3>
 </div>
 <div className="flex items-center gap-4 text-[10px] font-black">
 <div className="flex items-center gap-2 text-indigo-400"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> REQUESTS</div>
 <div className="flex items-center gap-2 text-orange-500"><div className="w-2 h-2 rounded-full bg-orange-500"></div> ERRORS</div>
 </div>
 </div>

 <div className="h-[calc(100%-4rem)] w-full" dir="ltr">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={TRAFFIC_DATA}>
 <defs>
 <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
 <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
 <XAxis dataKey="time" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickMargin={10} />
 <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
 <Tooltip 
 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
 itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
 />
 <Area type="monotone" dataKey="requests" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
 <Area type="monotone" dataKey="errors" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorErrors)" strokeDasharray="4 4" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Webhooks Real-time Console */}
 <div className="glass-panel flex-1 rounded-3xl overflow-hidden flex flex-col relative">
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between px-8 relative z-10 text-right">
 <div className="flex items-center gap-3">
 <History className="w-4 h-4 text-emerald-500" />
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">سجل الـ Webhooks اللحظي</h3>
 </div>
 <div className="flex items-center gap-4">
 <button onClick={() => setIsLive(!isLive)} className="flex items-center gap-2 px-3 py-1 bg-slate-200 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/5 text-[9px] font-black text-slate-600 dark:text-slate-400 hover:text-white transition-all uppercase">
 <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
 Live Stream
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-auto custom-scrollbar relative z-10">
 <table className="w-full text-right text-xs">
 <thead className="bg-white dark:bg-slate-900/20 text-slate-500 sticky top-0 z-20 backdrop-blur-md">
 <tr>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">المصدر</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">الحدث (Event)</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">التوقيت</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">الاستجابة</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">التأخير</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono">
 <AnimatePresence mode="popLayout">
 {webhookLogs.map((log) => (
 <motion.tr 
 key={log.id}
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, x: -20 }}
 className="hover:bg-white/[0.02] transition-all group"
 >
 <td className="px-6 py-4">
 <span className="text-indigo-400 font-black tracking-widest text-[10px]">{log.source}</span>
 </td>
 <td className="px-6 py-4">
 <span className="text-slate-700 dark:text-slate-300 font-medium break-all">{log.event}</span>
 </td>
 <td className="px-6 py-4 text-slate-500 font-bold">{log.timestamp}</td>
 <td className="px-6 py-4">
 <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-widest shadow-sm ${
 log.status === 200 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
 }`}>
 {log.status === 200 ? 'HTTP 200 OK' : `HTTP ${log.status}`}
 </span>
 </td>
 <td className="px-6 py-4 text-slate-600 font-bold">{log.latency}</td>
 </motion.tr>
 ))}
 </AnimatePresence>
 </tbody>
 </table>
 </div>

 <div className="p-3 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 flex items-center justify-between px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-3.5 h-3.5 text-blue-500 opacity-70" />
 WAF PROTECTED
 </div>
 <div className="flex items-center gap-2">
 <Database className="w-3.5 h-3.5 text-emerald-500 opacity-70" />
 REDIS CACHE ACTIVE
 </div>
 </div>
 <div className="text-slate-700">
 ENGINE: CORTEX-V5
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

function InsightCard({ icon, title, value, sub, trend, status, type = 'indigo' }: any) {
 const getColors = () => {
 switch (type) {
 case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
 case 'orange': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
 case 'blue': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
 default: return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
 }
 };

 return (
 <motion.div 
 whileHover={{ y: -4 }}
 className="glass-panel p-5 rounded-3xl relative overflow-hidden group "
 >
 <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 -mr-12 -mt-12 rounded-full transition-all group-hover:opacity-40 animate-pulse ${getColors().split(' ')[0]}`}></div>
 <div className="flex justify-between items-start relative z-10 mb-4">
 <div className={`p-2.5 rounded-2xl border transition-transform group-hover:scale-110 ${getColors()}`}>
 {icon}
 </div>
 {trend && (
 <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border ${trend.startsWith('+') ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-red-400 border-red-500/20 bg-red-500/5'}`}>
 <ArrowUpRight className={`w-3 h-3 ${trend.startsWith('-') ? 'rotate-90' : ''}`} />
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
 <div className="relative z-10">
 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</h3>
 <p className="text-2xl font-black text-white tracking-tight uppercase">{value}</p>
 <p className="text-[10px] text-slate-600 font-bold mt-1.5 uppercase tracking-wide">{sub}</p>
 </div>
 </motion.div>
 );
}
