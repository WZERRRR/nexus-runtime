import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
 Shield, ShieldAlert, ShieldCheck, Lock, Key, AlertTriangle, 
 Fingerprint, Activity, RefreshCw, EyeOff, Globe, Server, 
 UserX, Zap, Search, Filter, Cpu, Terminal, History,
 Settings2, MoreVertical, CreditCard, Box, ZapOff,
 UserCheck, Bell, HardDrive, CheckCircle2, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ProjectHeader } from '../components/common/ProjectHeader';

const SECURITY_EVENTS = [
 { id: 1, type: 'Failed Login Attempt', source: '185.244.1.12', region: 'Russia', target: 'Admin Panel', time: '12:45:02', severity: 'high', blockStatus: 'BLOCKED' },
 { id: 2, type: 'SQL Injection Guard', source: '103.55.22.4', region: 'China', target: 'API/v1/orders', time: '12:42:15', severity: 'critical', blockStatus: 'REJECTED' },
 { id: 3, type: 'Rate Limit Throttling', source: '82.114.5.18', region: 'Germany', target: 'Auth Engine', time: '12:38:55', severity: 'medium', blockStatus: 'THROTTLED' },
 { id: 4, type: 'XSS Payload Blocked', source: '110.22.88.5', region: 'Brazil', target: 'Dashboard/Stats', time: '12:35:10', severity: 'critical', blockStatus: 'FILTERED' },
 { id: 5, type: 'Unusual Geo-Login', source: '202.45.1.77', region: 'Australia', target: 'Account Root', time: '12:30:22', severity: 'high', blockStatus: 'PENDING_MFA' },
];

const THREAT_DATA = [
 { time: '00:00', blocked: 120, flagged: 45, ddos: 10 },
 { time: '04:00', blocked: 85, flagged: 30, ddos: 5 },
 { time: '08:00', blocked: 340, flagged: 110, ddos: 45 },
 { time: '12:00', blocked: 580, flagged: 180, ddos: 120 },
 { time: '16:00', blocked: 450, flagged: 150, ddos: 80 },
 { time: '20:00', blocked: 180, flagged: 60, ddos: 25 },
 { time: '23:59', blocked: 95, flagged: 40, ddos: 12 },
];

const WAF_RULES = [
 { id: 'rule-01', name: 'Global SQLi Guard', status: 'active', threat: 'High', coverage: '99.9%' },
 { id: 'rule-02', name: 'XSS Filter Layer', status: 'active', threat: 'Critical', coverage: '99.5%' },
 { id: 'rule-03', name: 'Botnet Detection', status: 'active', threat: 'Medium', coverage: '92.4%' },
 { id: 'rule-04', name: 'Geo-Block (Dark Web Proxies)', status: 'active', threat: 'Low', coverage: '88.0%' },
];

export function SecurityCenter() {
 const { state } = useLocation();
 const navigate = useNavigate();
 const context = state?.project;
 const [activeTab, setActiveTab] = useState('overview');
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [securityScore, setSecurityScore] = useState(94);

 const handleRefresh = () => {
 setIsRefreshing(true);
 setTimeout(() => setIsRefreshing(false), 1500);
 };

 return (
 <div className="space-y-8 flex flex-col h-[calc(100vh-6rem)] overflow-hidden text-right font-sans" dir="rtl">
 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "الدرع الأمني الذكي: حماية من هجمات DDoS، جدار حماية تطبيقات الويب (WAF)، ومراقبة فورية للتهديدات."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="مركز الأمن والسيبرانية"
 actions={
 <div className="flex gap-3">
 <button 
 onClick={handleRefresh}
 className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-[10px] font-black uppercase tracking-widest group"
 >
 <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-700 ${isRefreshing ? 'animate-spin' : ''}`} />
 تحديث الحالة
 </button>
 <button 
 className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all text-[10px] font-black shadow-lg shadow-red-500/20 active:scale-95 uppercase tracking-widest"
 >
 <Zap className="w-4 h-4" />
 وضع الحماية القصوى
 </button>
 </div>
 }
 />

 {/* Security Insights */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
 <InsightCard 
 icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
 title="معدل الأمان العام"
 value={`${securityScore}%`}
 sub="نظام محمي بالكامل"
 status="ممتاز"
 type="emerald"
 />
 <InsightCard 
 icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
 title="هجمات محظورة"
 value="1,482"
 sub="خلال آخر 24 ساعة"
 trend="+12%"
 type="red"
 />
 <InsightCard 
 icon={<EyeOff className="w-4 h-4 text-orange-400" />}
 title="عناوين IP محظورة"
 value="452"
 sub="قائمة الحظر النشطة"
 status="متزايد"
 type="orange"
 />
 <InsightCard 
 icon={<Fingerprint className="w-4 h-4 text-blue-400" />}
 title="جلسات نشطة"
 value="08"
 sub="جميعها موثقة (MFA)"
 status="آمن"
 type="blue"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
 {/* Main Security Area */}
 <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
 {/* Threat Analysis Chart */}
 <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col">
 <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[100px] -mr-48 -mt-24 rounded-full"></div>
 
 <div className="flex items-center justify-between mb-10 relative z-10">
 <div>
 <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
 <Activity className="w-4 h-4 text-red-500" /> تحليل التهديدات الفوري
 </h3>
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">REALTIME CYBER-ATTACK MAP & METRICS</p>
 </div>
 <div className="flex gap-4">
 <div className="flex items-center gap-2 text-[10px] font-black text-red-400">
 <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm dark:shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div> محظور
 </div>
 <div className="flex items-center gap-2 text-[10px] font-black text-orange-400">
 <div className="w-2 h-2 rounded-full bg-orange-500"></div> مشبوه
 </div>
 <div className="flex items-center gap-2 text-[10px] font-black text-purple-400">
 <div className="w-2 h-2 rounded-full bg-purple-500"></div> هجوم DDoS
 </div>
 </div>
 </div>

 <div className="flex-1 w-full" dir="ltr">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={THREAT_DATA}>
 <defs>
 <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
 <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
 <XAxis dataKey="time" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
 <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
 <Tooltip 
 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
 itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
 />
 <Area type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorBlocked)" />
 <Area type="monotone" dataKey="flagged" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorFlagged)" strokeDasharray="4 4" />
 <Area type="monotone" dataKey="ddos" stroke="#a855f7" strokeWidth={3} fill="none" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Security Logs */}
 <div className="glass-panel rounded-3xl overflow-hidden flex flex-col flex-1">
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between px-8 shrink-0">
 <div className="flex items-center gap-3">
 <Terminal className="w-4 h-4 text-red-500" />
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">سجل الأحداث الأمنية اللحظي</h3>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">بث مباشر</span>
 </div>
 <Filter className="w-3.5 h-3.5 text-slate-600 hover:text-white cursor-pointer transition-colors" />
 </div>
 </div>
 <div className="flex-1 overflow-auto custom-scrollbar">
 <table className="w-full text-right text-xs">
 <thead className="bg-white dark:bg-slate-900/20 text-slate-500 sticky top-0 z-20 backdrop-blur-md">
 <tr>
 <th className="px-8 py-4 font-black uppercase tracking-widest text-[9px]">الحدث</th>
 <th className="px-8 py-4 font-black uppercase tracking-widest text-[9px]">المصدر / المنطقة</th>
 <th className="px-8 py-4 font-black uppercase tracking-widest text-[9px]">الهدف</th>
 <th className="px-8 py-4 font-black uppercase tracking-widest text-[9px]">الحالة</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono">
 {SECURITY_EVENTS.map((event) => (
 <tr key={event.id} className="hover:bg-white/[0.02] transition-all group">
 <td className="px-8 py-4">
 <div className="flex items-center gap-3">
 <div className={`w-1.5 h-1.5 rounded-full ${
 event.severity === 'critical' ? 'bg-red-500 shadow-sm dark:shadow-[0_0_8px_rgba(239,68,68,1)]' : 
 event.severity === 'high' ? 'bg-orange-500' : 'bg-blue-500'
 }`}></div>
 <div>
 <p className="text-slate-200 font-bold group-hover:text-red-400 transition-colors uppercase tracking-tight">{event.type}</p>
 <p className="text-[9px] text-slate-600 font-black mt-0.5">{event.time}</p>
 </div>
 </div>
 </td>
 <td className="px-8 py-4">
 <p className="text-slate-600 dark:text-slate-400 font-bold">{event.source}</p>
 <p className="text-[9px] text-slate-600 font-black flex items-center gap-1 uppercase">
 <Globe className="w-3 h-3" /> {event.region}
 </p>
 </td>
 <td className="px-8 py-4 text-slate-500 font-bold uppercase tracking-tighter">{event.target}</td>
 <td className="px-8 py-4">
 <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded border ${
 event.blockStatus === 'BLOCKED' || event.blockStatus === 'REJECTED' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 
 event.blockStatus === 'THROTTLED' ? 'text-orange-400 border-orange-500/20 bg-orange-500/5' :
 'text-blue-400 border-blue-500/20 bg-blue-500/5'
 }`}>
 {event.blockStatus}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Security Controls Sidebar */}
 <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
 {/* Security Compliance Card */}
 <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden group">
 <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-[50px] -ml-16 -mt-16 rounded-full group-hover:bg-blue-500/20 transition-all"></div>
 
 <div className="flex items-center justify-between mb-8 relative z-10">
 <Shield className="w-6 h-6 text-blue-400" />
 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">بروتوكولات الأمان</span>
 </div>

 <div className="space-y-6 relative z-10">
 <ProtocolItem label="SSL/TLS 1.3" status="نشط" type="emerald" />
 <ProtocolItem label="DDoS Protection" status="يعمل" type="blue" />
 <ProtocolItem label="WAF Ruleset v4.2" status="الأحدث" type="emerald" />
 <ProtocolItem label="Intrusion Detection" status="جاري الفحص" type="purple" />
 <ProtocolItem label="Database Encryption" status="AES-256" type="emerald" />
 </div>

 <button className="mt-10 w-full py-4 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-slate-200 dark:border-white/10 flex items-center justify-center gap-3 active:scale-95 group">
 <Settings2 className="w-4 h-4 group-hover:rotate-90 transition-transform" />
 إدارة البروتوكولات
 </button>
 </div>

 {/* WAF Policy Table */}
 <div className="glass-panel rounded-3xl overflow-hidden flex flex-col flex-1">
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between px-8">
 <div className="flex items-center gap-2">
 <Box className="w-4 h-4 text-orange-400" />
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">سياسات WAF</h3>
 </div>
 <Plus className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer transition-colors" />
 </div>
 <div className="p-4 space-y-3 overflow-auto custom-scrollbar">
 {WAF_RULES.map((rule) => (
 <div key={rule.id} className="p-4 rounded-3xl bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-slate-200 dark:border-white/10 transition-all group">
 <div className="flex justify-between items-start mb-3">
 <div>
 <h4 className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors text-right">{rule.name}</h4>
 <p className="text-[9px] text-slate-600 font-black mt-0.5 text-right">حماية 14 نقطة نهاية</p>
 </div>
 <div className={`w-2 h-2 rounded-full ${rule.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
 </div>
 <div className="flex items-center justify-between">
 <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
 rule.threat === 'Critical' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 
 rule.threat === 'High' ? 'text-orange-400 border-orange-500/20 bg-orange-500/5' :
 'text-blue-400 border-blue-500/20 bg-blue-500/5'
 }`}>
 مستوى التهديد: {rule.threat}
 </span>
 <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">{rule.coverage}</span>
 </div>
 </div>
 ))}
 </div>
 <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 text-center">
 <button className="text-[9px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-[0.2em]">عرض جميع السياسات (18)</button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

function ProtocolItem({ label, status, type }: any) {
 const getColors = () => {
 switch (type) {
 case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
 case 'red': return 'text-red-400 bg-red-500/10 border-red-500/20';
 case 'blue': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
 case 'purple': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
 default: return 'text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-white/5 border-slate-200 dark:border-white/10';
 }
 };

 return (
 <div className="flex items-center justify-between group">
 <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors">{label}</span>
 <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border ${getColors()}`}>
 {status}
 </span>
 </div>
 );
}

function InsightCard({ icon, title, value, sub, trend, status, type = 'blue' }: any) {
 const getColors = () => {
 switch (type) {
 case 'red': return 'text-red-400 bg-red-500/10 border-red-500/20';
 case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
 case 'orange': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
 default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
 }
 };

 return (
 <motion.div 
 whileHover={{ y: -4 }}
 className="glass-panel p-5 rounded-2xl relative overflow-hidden group"
 >
 <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 -mr-12 -mt-12 rounded-full transition-all group-hover:opacity-40 animate-pulse ${getColors().split(' ')[0]}`}></div>
 <div className="flex justify-between items-start relative z-10 mb-4">
 <div className={`p-2.5 rounded-2xl border transition-transform group-hover:scale-110 ${getColors()}`}>
 {icon}
 </div>
 {trend && (
 <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border ${trend.startsWith('+') ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'}`}>
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
 <div className="relative z-10">
 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</h3>
 <p className="text-2xl font-black text-white tracking-tight uppercase">{value}</p>
 <p className="text-[10px] text-slate-600 font-bold mt-1.5 uppercase tracking-wide">{sub}</p>
 </div>
 </motion.div>
 );
}
