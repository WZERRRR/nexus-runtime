import React from 'react';
import { CreditCard, DollarSign, TrendingUp, AlertCircle, Activity, Lock } from 'lucide-react';

export function FinancialWorkspace({ onNavigate }: { onNavigate: (view: string) => void }) {
 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
 <div>
 <button onClick={() => onNavigate('overview')} className="text-[10px] uppercase font-bold text-slate-500 hover:text-white mb-2 tracking-widest transition-colors flex items-center gap-1">
 &larr; العودة للوحة الرئيسية
 </button>
 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
 <CreditCard className="w-6 h-6 text-green-500" />
 العمليات المالية والفوترة
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Operational Financial Layer & Revenue Monitoring</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
 Gateway: HEALTHY
 </span>
 <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
 تصدير التقارير
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {[
 { title: "إيرادات اليوم", value: "$4,250", icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
 { title: "اشتراكات نشطة", value: "892", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
 { title: "دفعات مرفوضة", value: "12", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
 { title: "طلبات احتيال (Fraud)", value: "3", icon: Lock, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
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
 <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50" />
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between">
 <span className="flex items-center gap-2">
 <Activity className="w-4 h-4 text-green-400" />
 سجل المعاملات المباشر (Live Transactions)
 </span>
 </h3>
 
 <div className="space-y-4">
 {[
 { id: "TX-9942", amount: "$150.00", user: "ahmed@example.com", status: "Success", time: "منذ دقيقة", type: "Subscription" },
 { id: "TX-9943", amount: "$89.99", user: "sara@example.com", status: "Failed", time: "منذ 5 دقائق", type: "One-Time" },
 { id: "TX-9944", amount: "$450.00", user: "corp@nexus.io", status: "Success", time: "منذ 12 دقيقة", type: "Enterprise" },
 { id: "TX-9945", amount: "$15.00", user: "dev@test.com", status: "Refunded", time: "منذ 1 ساعة", type: "Refund" },
 ].map((tx, idx) => (
 <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
 <div className="flex items-center gap-4">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center
 ${tx.status === 'Success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
 tx.status === 'Failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}
 `}>
 <DollarSign className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm font-bold text-white">{tx.amount}</p>
 <p className="text-[10px] text-slate-500">{tx.user} • <span className="uppercase tracking-widest font-mono">{tx.id}</span></p>
 </div>
 </div>
 <div className="text-right">
 <p className={`text-[10px] uppercase font-bold tracking-widest mb-1
 ${tx.status === 'Success' ? 'text-green-400' : 
 tx.status === 'Failed' ? 'text-red-400' : 'text-orange-400'}
 `}>{tx.status}</p>
 <p className="text-[10px] text-slate-500">{tx.time}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="space-y-6">
 <div className="glass-panel rounded-2xl p-6">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-between">
 <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-purple-400" /> Payment Gateways</span>
 </h3>
 <div className="space-y-4">
 {[
 { name: "Stripe Main", status: "Operational", latency: "42ms" },
 { name: "Moyasar (KSA)", status: "Operational", latency: "65ms" },
 { name: "PayPal Backup", status: "Degraded", latency: "450ms" },
 ].map((gw, i) => (
 <div key={i} className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800/50">
 <div className="flex justify-between items-center text-xs">
 <span className="text-slate-700 dark:text-slate-300 font-bold">{gw.name}</span>
 <span className={`text-[9px] uppercase font-bold ${gw.status === 'Operational' ? 'text-green-400' : 'text-orange-400'}`}>{gw.status}</span>
 </div>
 <span className="text-[10px] text-slate-500 font-mono">Latency: {gw.latency}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
