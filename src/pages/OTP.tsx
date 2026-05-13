import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
 KeyRound, ShieldCheck, ShieldAlert, MessageSquare, 
 Smartphone, Bell, Activity, RefreshCw, BarChart2,
 Lock, Send, Mail, CheckCircle2, AlertTriangle,
 History, Settings2, Globe, Cpu, Zap,
 ChevronRight, Smartphone as MobileIcon, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ProjectHeader } from '../components/common/ProjectHeader';

const trafficData = [
 { time: '00:00', success: 120, failed: 2, total: 122 },
 { time: '04:00', success: 80, failed: 1, total: 81 },
 { time: '08:00', success: 450, failed: 12, total: 462 },
 { time: '12:00', success: 850, failed: 35, total: 885 },
 { time: '16:00', success: 1200, failed: 45, total: 1245 },
 { time: '20:00', success: 950, failed: 18, total: 968 },
 { time: '23:59', success: 400, failed: 5, total: 405 },
];

const PROVIDERS = [
 { 
 id: 'twilio', 
 name: 'Twilio Cloud', 
 type: 'SMS Gateway', 
 status: 'online', 
 latency: '142ms', 
 successRate: '99.8%',
 cost: '$0.007/msg',
 region: 'Global/US'
 },
 { 
 id: 'ultramsg', 
 name: 'UltraMsg Pro', 
 type: 'WhatsApp API', 
 status: 'online', 
 latency: '310ms', 
 successRate: '99.2%',
 cost: '$0.002/msg',
 region: 'Global/RTL'
 },
 { 
 id: 'fcm', 
 name: 'Firebase FCM', 
 type: 'Push Engine', 
 status: 'online', 
 latency: '24ms', 
 successRate: '99.9%',
 cost: 'Free/Tier',
 region: 'Global'
 },
 { 
 id: 'resend', 
 name: 'Resend Mail', 
 type: 'Transactional Email', 
 status: 'online', 
 latency: '85ms', 
 successRate: '99.5%',
 cost: '$0.001/mail',
 region: 'Global/EU'
 },
];

type LogEntry = {
 id: string;
 timestamp: string;
 provider: string;
 event: string;
 status: 'success' | 'failed' | 'processing';
 details: string;
};

const INITIAL_LOGS: LogEntry[] = [
 { id: '1', timestamp: '20:45:12', provider: 'TWILIO', event: 'OTP_SENT', status: 'success', details: '+9665*****43' },
 { id: '2', timestamp: '20:45:15', provider: 'WHATSAPP', event: 'DOC_SENT', status: 'success', details: 'Invoice_882.pdf' },
 { id: '3', timestamp: '20:45:22', provider: 'FCM', event: 'PUSH_NOTIFICATION', status: 'success', details: 'New Order Received' },
 { id: '4', timestamp: '20:45:30', provider: 'TWILIO', event: 'OTP_VERIFIED', status: 'success', details: 'User verified in 12s' },
 { id: '5', timestamp: '20:45:45', provider: 'SYSTEM', event: 'IP_BLOCKED', status: 'failed', details: 'Bot detected from 192.168.1.1' },
];

export function OTPCenter() {
 const { state } = useLocation();
 const context = state?.project;
 const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
 const [isLive, setIsLive] = useState(true);

 useEffect(() => {
 if (!isLive) return;
 const interval = setInterval(() => {
 const providers = ['TWILIO', 'WHATSAPP', 'FCM', 'RESEND'];
 const events = ['OTP_SENT', 'OTP_VERIFIED', 'ALERT_SENT', 'MAIL_SENT'];
 const statuses: ('success' | 'failed')[] = ['success', 'success', 'success', 'failed'];
 
 const newLog: LogEntry = {
 id: Math.random().toString(36).substr(2, 9),
 timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
 provider: providers[Math.floor(Math.random() * providers.length)],
 event: events[Math.floor(Math.random() * events.length)],
 status: statuses[Math.floor(Math.random() * statuses.length)],
 details: 'عملية تلقائية لنظام التنبيهات'
 };
 
 setLogs(prev => [newLog, ...prev].slice(0, 50));
 }, 4000);
 return () => clearInterval(interval);
 }, [isLive]);

 return (
 <div className="space-y-8 flex flex-col h-[calc(100vh-6rem)] overflow-hidden text-right" dir="rtl">
 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "مركز إدارة رسائل التحقق (OTP)، التنبيهات الذكية، وحالة بوابات الرسائل الدولية."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="بوابة OTP والإشعارات"
 actions={
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-[10px] font-black uppercase tracking-widest group">
 <Settings2 className="w-4 h-4 group-hover:rotate-45 transition-transform" />
 الإعدادات
 </button>
 <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-[10px] font-black shadow-lg shadow-blue-500/20 active:scale-95 uppercase tracking-widest">
 <Zap className="w-4 h-4" />
 اختبار الإرسال
 </button>
 </div>
 }
 />

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
 <InsightCard 
 icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
 title="طلبات اليوم"
 value="18,420"
 sub="دقة تسليم 99.1%"
 trend="+12%"
 type="emerald"
 />
 <InsightCard 
 icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
 title="محاولات مرفوضة"
 value="142"
 sub="هجمات Brute Force محظورة"
 trend="-5%"
 type="red"
 />
 <InsightCard 
 icon={<Lock className="w-4 h-4 text-blue-400" />}
 title="متوسط التحقق"
 value="14.2s"
 sub="سرعة استجابة المستخدمين"
 status="مثالي"
 type="blue"
 />
 <InsightCard 
 icon={<Globe className="w-4 h-4 text-orange-400" />}
 title="المزود الرئيسي"
 value="Twilio"
 sub="أفضل أداء في المنطقة"
 status="متصل"
 type="orange"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
 {/* Left column: Providers & Activity */}
 <div className="lg:col-span-1 space-y-6 overflow-y-auto custom-scrollbar px-1">
 <div className="flex items-center justify-between mb-2">
 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">مزودي الخدمة</h3>
 <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
 </div>

 <div className="space-y-4">
 {PROVIDERS.map((provider) => (
 <motion.div 
 key={provider.id}
 whileHover={{ y: -2 }}
 className="glass-panel p-5 rounded-3xl relative overflow-hidden group"
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] -mr-16 -mt-16 rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
 
 <div className="flex justify-between items-start relative z-10">
 <div className="flex items-center gap-3">
 <div className={`p-2 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-white/5 transition-transform group-hover:scale-110 ${provider.status === 'online' ? 'text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
 {provider.type.includes('SMS') ? <Smartphone className="w-4 h-4" /> : 
 provider.type.includes('Push') ? <Bell className="w-4 h-4" /> :
 provider.type.includes('Email') ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
 </div>
 <div>
 <h4 className="text-sm font-black text-white uppercase tracking-tight">{provider.name}</h4>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{provider.type}</p>
 </div>
 </div>
 <div className="flex flex-col items-end">
 <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">{provider.latency}</span>
 </div>
 </div>

 <div className="mt-5 grid grid-cols-2 gap-4 relative z-10">
 <div className="space-y-1">
 <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">معدل النجاح</p>
 <p className="text-xs font-mono font-bold text-slate-200">{provider.successRate}</p>
 </div>
 <div className="space-y-1 text-left">
 <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">التكلفة / الوحدة</p>
 <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">{provider.cost}</p>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </div>

 {/* Right column: Charts & Live Stream */}
 <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
 {/* Chart Section */}
 <div className="glass-panel p-6 rounded-3xl relative overflow-hidden h-[45%]">
 <div className="flex items-center justify-between mb-8">
 <div className="flex items-center gap-3">
 <BarChart2 className="w-5 h-5 text-blue-500" />
 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">تحليل حركة البيانات (Daily Traffic)</h3>
 </div>
 <div className="flex items-center gap-4 text-[10px] font-black">
 <div className="flex items-center gap-2 text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-500"></div> SUCCESS</div>
 <div className="flex items-center gap-2 text-red-500"><div className="w-2 h-2 rounded-full bg-red-500"></div> FAILED</div>
 </div>
 </div>

 <div className="h-[calc(100%-4rem)] w-full" dir="ltr">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={trafficData}>
 <defs>
 <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
 <XAxis 
 dataKey="time" 
 stroke="#475569" 
 fontSize={10} 
 axisLine={false} 
 tickLine={false}
 tickMargin={10}
 />
 <YAxis 
 stroke="#475569" 
 fontSize={10} 
 axisLine={false} 
 tickLine={false}
 />
 <Tooltip 
 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
 itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
 />
 <Area type="monotone" dataKey="success" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSuccess)" />
 <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorFailed)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Live Console Container */}
 <div className="glass-panel flex-1 rounded-3xl overflow-hidden flex flex-col relative">
 <div className="absolute inset-0 bg-blue-500/[0.01] pointer-events-none"></div>
 
 <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between px-8 relative z-10">
 <div className="flex items-center gap-3">
 <History className="w-4 h-4 text-emerald-500" />
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">آخر العمليات اللحظية</h3>
 </div>
 <div className="flex items-center gap-4">
 <button 
 onClick={() => setIsLive(!isLive)}
 className="flex items-center gap-2 px-3 py-1 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-full border border-slate-200 dark:border-white/5 text-[9px] font-black text-slate-600 dark:text-slate-400 hover:text-white transition-all uppercase tracking-widest"
 >
 <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
 {isLive ? 'Live Stream' : 'Paused'}
 </button>
 <button 
 onClick={() => setLogs([])}
 className="text-[9px] font-black text-slate-500 hover:text-red-400 transition-colors uppercase tracking-[0.15em]"
 >
 Clear Console
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 font-mono text-[10px] space-y-1.5 bg-[#0a0f1c]/50 relative z-10" dir="ltr">
 <AnimatePresence mode="popLayout">
 {logs.map((log) => (
 <motion.div 
 key={log.id}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="flex items-center gap-4 p-2 hover:bg-white/[0.02] rounded-lg group border-l border-transparent hover:border-blue-500/30 transition-all"
 >
 <span className="text-slate-600 font-bold shrink-0">{log.timestamp}</span>
 <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shrink-0 ${
 log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
 }`}>
 {log.provider}
 </span>
 <span className="text-blue-400/80 font-black shrink-0 tracking-widest uppercase">{log.event}</span>
 <span className="text-slate-600 dark:text-slate-400 truncate group-hover:text-slate-200 transition-colors uppercase">{log.details}</span>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>

 <div className="p-3 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 flex items-center justify-between px-8 text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <Lock className="w-3.5 h-3.5 text-blue-500 opacity-70" />
 AES-256 ENCRYPTED
 </div>
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 opacity-70" />
 COMPLIANT (SOC2)
 </div>
 </div>
 <div className="text-slate-700">
 System v4.2.1-stable
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

function InsightCard({ icon, title, value, sub, trend, status, type = 'blue' }: any) {
 const getColors = () => {
 switch (type) {
 case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
 case 'red': return 'text-red-400 bg-red-500/10 border-red-500/20';
 case 'orange': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
 default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
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
