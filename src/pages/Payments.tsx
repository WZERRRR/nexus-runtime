import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
 CreditCard, DollarSign, TrendingUp, AlertCircle, RefreshCw, 
 BarChart2, Activity, CheckCircle2, ArrowUpRight, ArrowDownRight,
 ShieldCheck, Globe, Zap, History, Search, Filter, 
 Download, Wallet, Landmark, Receipt, PieChart,
 Lock, AlertTriangle, ChevronRight, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ProjectHeader } from '../components/common/ProjectHeader';

const REVENUE_DATA = [
 { day: 'السبت', stripe: 4200, local: 8500, total: 12700 },
 { day: 'الأحد', stripe: 3800, local: 9200, total: 13000 },
 { day: 'الاثنين', stripe: 5500, local: 11000, total: 16500 },
 { day: 'الثلاثاء', stripe: 4900, local: 9800, total: 14700 },
 { day: 'الأربعاء', stripe: 6200, local: 12500, total: 18700 },
 { day: 'الخميس', stripe: 5800, local: 14000, total: 19800 },
 { day: 'الجمعة', stripe: 7500, local: 15500, total: 23000 },
];

const PROVIDERS = [
 { 
 id: 'stripe', 
 name: 'Stripe International', 
 type: 'المدفوعات الدولية', 
 status: 'online', 
 volume: '$42,500', 
 fee: '2.9% + 0.30$',
 health: 99.8
 },
 { 
 id: 'moyasar', 
 name: 'Moyasar (Mada)', 
 type: 'مدى و Apple Pay', 
 status: 'online', 
 volume: '154,200 SAR', 
 fee: '1.75% + 1.00 SAR',
 health: 99.2
 },
 { 
 id: 'tabby', 
 name: 'Tabby (BNPL)', 
 type: 'اشتر الآن وادفع لاحقاً', 
 status: 'maintenance', 
 volume: '22,400 SAR', 
 fee: '5.9% Fixed',
 health: 85.0
 },
];

type Transaction = {
 id: string;
 user: string;
 amount: string;
 gateway: string;
 method: 'Visa' | 'Mastercard' | 'Mada' | 'ApplePay' | 'PayPal';
 status: 'success' | 'failed' | 'pending';
 timestamp: string;
 riskScore: number;
};

const INITIAL_TRANSACTIONS: Transaction[] = [
 { id: 'TX-9901', user: 'saleh_m@domain.com', amount: '850.00 SAR', gateway: 'Moyasar', method: 'Mada', status: 'success', timestamp: '14:20:05', riskScore: 2 },
 { id: 'TX-9902', user: 'khalid@global.com', amount: '$425.00', gateway: 'Stripe', method: 'Visa', status: 'success', timestamp: '14:18:12', riskScore: 5 },
 { id: 'TX-9903', user: 'unknown_bot', amount: '2.00 SAR', gateway: 'Moyasar', method: 'ApplePay', status: 'failed', timestamp: '14:15:30', riskScore: 98 },
 { id: 'TX-9904', user: 'fatima.a@mail.sa', amount: '1,200 SAR', gateway: 'Tabby', method: 'Mastercard', status: 'pending', timestamp: '14:10:45', riskScore: 12 },
 { id: 'TX-9905', user: 'mohamed_88@test.com', amount: '45.00 SAR', gateway: 'Moyasar', method: 'Mada', status: 'success', timestamp: '14:05:00', riskScore: 1 },
];

export function PaymentsCenter() {
 const { state } = useLocation();
 const context = state?.project;
 const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
 const [isLive, setIsLive] = useState(true);

 useEffect(() => {
 if (!isLive) return;
 const interval = setInterval(() => {
 const newTx: Transaction = {
 id: `TX-${Math.floor(Math.random() * 9000 + 1000)}`,
 user: 'user_' + Math.random().toString(36).substr(7),
 amount: `${(Math.random() * 500 + 50).toFixed(2)} SAR`,
 gateway: Math.random() > 0.5 ? 'Moyasar' : 'Stripe',
 method: ['Visa', 'Mada', 'ApplePay'][Math.floor(Math.random() * 3)] as any,
 status: Math.random() > 0.1 ? 'success' : 'failed',
 timestamp: new Date().toLocaleTimeString('en-GB'),
 riskScore: Math.floor(Math.random() * 30)
 };
 setTransactions(prev => [newTx, ...prev].slice(0, 50));
 }, 5000);
 return () => clearInterval(interval);
 }, [isLive]);

 return (
 <div className="space-y-8 flex flex-col h-[calc(100vh-6rem)] overflow-hidden text-right" dir="rtl">
 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "تحليل التدفقات المالية، مراقبة بوابات الدفع، واكتشاف محاولات الاحتيال آلياً."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="مركز المدفوعات والسيولة"
 actions={
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900/50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-[10px] font-black uppercase tracking-widest group">
 <Receipt className="w-4 h-4 group-hover:scale-110 transition-transform" />
 الفواتير
 </button>
 <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-[10px] font-black shadow-lg shadow-emerald-500/20 active:scale-95 uppercase tracking-widest">
 <Download className="w-4 h-4" />
 تصدير التقرير
 </button>
 </div>
 }
 />

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
 <InsightCard 
 icon={<Wallet className="w-4 h-4 text-emerald-400" />}
 title="إيرادات اليوم"
 value="45,210 SAR"
 sub="326 عملية دفع ناجحة"
 trend="+18%"
 type="emerald"
 />
 <InsightCard 
 icon={<PieChart className="w-4 h-4 text-blue-400" />}
 title="متوسط السلة"
 value="138 SAR"
 sub="نمو في القيمة الشرائية"
 trend="+4.2%"
 type="blue"
 />
 <InsightCard 
 icon={<ShieldCheck className="w-4 h-4 text-purple-400" />}
 title="معدل النجاح"
 value="99.4%"
 sub="استقرار بوابات الدفع"
 status="مثالي"
 type="purple"
 />
 <InsightCard 
 icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
 title="مخاطر عالية"
 value="02"
 sub="محاولات دفع مشبوهة"
 status="مراقب"
 type="red"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
 <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
 {/* Revenue Chart Section */}
 <div className="glass-panel p-6 rounded-3xl relative overflow-hidden h-[45%]">
 <div className="flex items-center justify-between mb-8">
 <div className="flex items-center gap-3">
 <TrendingUp className="w-5 h-5 text-emerald-400" />
 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">تحليل السيولة الأسبوعي</h3>
 </div>
 <div className="flex items-center gap-4 text-[10px] font-black">
 <div className="flex items-center gap-2 text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> إجمالي المبلغ</div>
 <div className="flex items-center gap-2 text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Stripe</div>
 </div>
 </div>

 <div className="h-[calc(100%-4rem)] w-full" dir="ltr">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={REVENUE_DATA}>
 <defs>
 <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorStripe" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
 <XAxis dataKey="day" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickMargin={10} />
 <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
 <Tooltip 
 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
 itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
 />
 <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
 <Area type="monotone" dataKey="stripe" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorStripe)" strokeDasharray="5 5" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Transactions Table */}
 <div className="glass-panel flex-1 rounded-3xl overflow-hidden flex flex-col relative">
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between px-8 relative z-10">
 <div className="flex items-center gap-3">
 <History className="w-4 h-4 text-blue-500" />
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">العمليات المالية اللحظية</h3>
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
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">الهوية</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">المستخدم</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">المبلغ</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">البوابة / الطريقة</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">المخاطر</th>
 <th className="px-6 py-4 font-black uppercase tracking-widest text-[9px]">الحالة</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono">
 <AnimatePresence mode="popLayout">
 {transactions.map((tx) => (
 <motion.tr 
 key={tx.id}
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, x: -20 }}
 className="hover:bg-white/[0.02] transition-all group"
 >
 <td className="px-6 py-4 text-slate-600 font-bold group-hover:text-blue-400 transition-colors">{tx.id}</td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/5 text-[9px] text-slate-600 dark:text-slate-400">
 {tx.user[0].toUpperCase()}
 </div>
 <span className="text-slate-700 dark:text-slate-300 font-medium">{tx.user}</span>
 </div>
 </td>
 <td className="px-6 py-4 font-black text-white">{tx.amount}</td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className={`text-[9px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest group-hover:border-blue-500/30 transition-all`}>
 {tx.gateway}
 </span>
 <span className="text-[10px] text-slate-500 font-black">{tx.method}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="flex-1 h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden w-12">
 <div className={`h-full ${tx.riskScore > 50 ? 'bg-red-500' : tx.riskScore > 20 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${tx.riskScore}%` }}></div>
 </div>
 <span className={`text-[9px] font-black ${tx.riskScore > 50 ? 'text-red-500' : 'text-slate-500'}`}>{tx.riskScore}%</span>
 </div>
 </td>
 <td className="px-6 py-4">
 {tx.status === 'success' && <span className="flex items-center gap-1.5 text-emerald-400 font-black text-[10px] uppercase tracking-widest"><div className="w-1 h-1 rounded-full bg-emerald-500"></div> SUCCESS</span>}
 {tx.status === 'failed' && <span className="flex items-center gap-1.5 text-red-500 font-black text-[10px] uppercase tracking-widest"><div className="w-1 h-1 rounded-full bg-red-500"></div> FAILED</span>}
 {tx.status === 'pending' && <span className="flex items-center gap-1.5 text-orange-400 font-black text-[10px] uppercase tracking-widest"><div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse"></div> WAIT</span>}
 </td>
 </motion.tr>
 ))}
 </AnimatePresence>
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Status Side Panel */}
 <div className="lg:col-span-1 space-y-6 overflow-y-auto custom-scrollbar px-1">
 <div className="flex items-center justify-between mb-2 px-2">
 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">حالة البوابات</h3>
 <Zap className="w-4 h-4 text-emerald-400" />
 </div>

 <div className="space-y-4">
 {PROVIDERS.map((provider) => (
 <motion.div 
 key={provider.id}
 whileHover={{ y: -4 }}
 className="glass-panel p-6 rounded-[2rem] relative overflow-hidden group "
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] -mr-16 -mt-16 rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
 
 <div className="flex justify-between items-start relative z-10 mb-6">
 <div className="flex items-center gap-3">
 <div className={`p-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-white/5 group-hover:scale-110 transition-transform ${provider.status === 'online' ? 'text-emerald-400' : 'text-orange-400'}`}>
 {provider.id === 'stripe' ? <Globe className="w-5 h-5" /> : 
 provider.id === 'moyasar' ? <Landmark className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
 </div>
 <div>
 <h4 className="text-xs font-black text-white uppercase tracking-tight">{provider.name}</h4>
 <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">{provider.type}</p>
 </div>
 </div>
 <div className="flex flex-col items-end gap-1.5">
 <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${
 provider.status === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
 }`}>
 <div className={`w-1 h-1 rounded-full ${provider.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`}></div>
 {provider.status}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6 relative z-10">
 <div>
 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">المبلغ المحصل</p>
 <p className="text-sm font-black text-white tracking-tight">{provider.volume}</p>
 </div>
 <div className="text-left">
 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">رسوم البوابة</p>
 <p className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">{provider.fee}</p>
 </div>
 </div>

 <div className="mt-6 h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${provider.health}%` }}
 className={`h-full ${provider.health > 95 ? 'bg-emerald-500' : 'bg-orange-500'}`}
 />
 </div>
 <div className="flex justify-between items-center mt-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
 <span>HEALTH INDEX</span>
 <span>{provider.health}%</span>
 </div>
 </motion.div>
 ))}

 {/* AI Fraud Analysis */}
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="glass-panel p-6 rounded-[2rem] border border-red-500/10 bg-red-500/5 relative overflow-hidden group "
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-[30px] -mr-12 -mt-12 rounded-full"></div>
 <div className="flex items-center gap-3 mb-4 relative z-10">
 <div className="p-2 bg-red-500/20 text-red-500 rounded-xl">
 <ShieldCheck className="w-4 h-4" />
 </div>
 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">تحليل مخاطر AI</h4>
 </div>
 <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold relative z-10">
 تم اكتشاف نمط "Card Testing" من عناوين IP متعددة. تم تفعيل الحماية المشددة لبوابة Stripe مؤقتاً.
 </p>
 <button className="w-full mt-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95">
 اتخاذ إجراء أمني
 </button>
 </motion.div>
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
 case 'purple': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
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
