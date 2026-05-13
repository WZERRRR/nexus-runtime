import React, { useEffect, useState } from 'react';
import { 
 Brain, TrendingUp, AlertTriangle, Zap, Activity, ShieldCheck, 
 BarChart3, RefreshCw, Layers, LayoutDashboard, Target, 
 FileWarning, Cpu, History, Rocket, Lightbulb, Lock, Unlock, Eye, Radar
} from 'lucide-react';
import { 
 AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
 BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { runtimeAPI } from '../../services/runtimeApi';

export function IntelligenceWorkspace({ onNavigate }: { onNavigate: (view: string) => void }) {
 const [forecast, setForecast] = useState<any[]>([]);
 const [recommendations, setRecommendations] = useState<any[]>([]);
 const [anomalies, setAnomalies] = useState<any[]>([]);
 const [optimizations, setOptimizations] = useState<any[]>([]);
 const [riskIndicators, setRiskIndicators] = useState<any>(null);
 const [deployRisk, setDeployRisk] = useState<any>(null);
 const [isLoading, setIsLoading] = useState(true);

 const fetchData = async () => {
 try {
 const [
 forecastData, 
 recData, 
 anomalyData, 
 optData, 
 riskData,
 depRisk
 ] = await Promise.all([
 runtimeAPI.getFailureForecast(),
 runtimeAPI.getRecommendations(),
 runtimeAPI.getAnomalyForecasting(),
 runtimeAPI.getOptimizationStrategy(),
 runtimeAPI.getRiskIndicators(),
 runtimeAPI.getDeploymentRiskScore("Kernel Hotpatch")
 ]);

 setForecast(forecastData);
 setRecommendations(recData);
 setAnomalies(anomalyData);
 setOptimizations(optData);
 setRiskIndicators(riskData);
 setDeployRisk(depRisk);
 } catch (err) {
 console.error("Intelligence sync failed", err);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 const interval = setInterval(fetchData, 15000);
 return () => clearInterval(interval);
 }, []);

 const getRiskColor = (score: number) => {
 if (score < 10) return 'text-emerald-500';
 if (score < 30) return 'text-yellow-500';
 return 'text-red-500';
 };

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
 <div>
 <button onClick={() => onNavigate('overview')} className="text-[10px] uppercase font-black text-slate-500 hover:text-white mb-2 tracking-widest transition-colors flex items-center gap-1">
 &larr; العودة للوحة Nexus الرئيسية
 </button>
 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
 <Brain className="w-6 h-6 text-emerald-400" />
 مركز استخبارات العمليات
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 uppercase tracking-tighter font-bold font-mono text-right">التحليلات التنبؤية والحوكمة المعززة بالذكاء الاصطناعي</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-inner">
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
 مركز الذكاء: محسن
 </span>
 <button 
 onClick={fetchData}
 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
 تحديث البيانات
 </button>
 </div>
 </div>

 {/* Main Indicators */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {[
 { title: "معدل مخاطر النظام", value: `${riskIndicators?.system_risk || 0}%`, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
 { title: "سلامة البيانات", value: `${riskIndicators?.data_integrity || 0}%`, icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10" },
 { title: "توقعات التهديدات", value: riskIndicators?.threat_forecast === 'Stable' ? "مستقر" : riskIndicators?.threat_forecast || "مستقر", icon: Radar, color: "text-purple-500", bg: "bg-purple-500/10" },
 { title: "مخاطر النشر", value: `${deployRisk?.risk_score || 0}%`, icon: Rocket, color: "text-orange-500", bg: "bg-orange-500/10" },
 ].map((stat, i) => (
 <div key={i} className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-slate-600 transition-all ">
 <div className={`absolute top-0 right-0 p-4 \${stat.bg} rounded-bl-3xl opacity-40 group-hover:opacity-100 transition-opacity`}>
 <stat.icon className={`w-5 h-5 \${stat.color}`} />
 </div>
 <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest leading-none mb-3">{stat.title}</p>
 <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Predictive Failure Timeline */}
 <div className="lg:col-span-2 space-y-6">
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden ">
 <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/40" />
 <div className="flex items-center justify-between mb-8">
 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
 <TrendingUp className="w-5 h-5 text-emerald-400" />
 توقعات احتمالية الفشل
 </h3>
 <div className="text-[9px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black tracking-widest">
 نافذة 12 ساعة
 </div>
 </div>

 <div className="h-[250px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={forecast}>
 <defs>
 <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <XAxis 
 dataKey="timestamp" 
 stroke="#475569" 
 fontSize={10} 
 tickFormatter={(str) => new Date(str).getHours() + ":00"}
 />
 <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
 <Tooltip 
 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
 itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
 labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
 />
 <Area 
 type="monotone" 
 dataKey="failure_probability" 
 stroke="#10b981" 
 fillOpacity={1} 
 fill="url(#colorProb)" 
 name="احتمالية الفشل (%)"
 />
 <Area 
 type="monotone" 
 dataKey="node_drift" 
 stroke="#3b82f6" 
 fillOpacity={0} 
 strokeDasharray="5 5"
 name="مؤشر انحراف العقدة"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
 {[
 { label: "تدهور الاستقرار", value: "ضئيل", trendColor: "text-emerald-400" },
 { label: "الانقطاعات المتوقعة", value: "لا يوجد", trendColor: "text-emerald-400" },
 { label: "استنزاف الموارد", value: "خلال 18 ساعة", trendColor: "text-yellow-400" }
 ].map((idx, i) => (
 <div key={i}>
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{idx.label}</p>
 <p className={`text-sm font-black uppercase \${idx.trendColor}`}>{idx.value}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Governed Intelligence Advisor */}
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden ">
 <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none" />
 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
 <Lightbulb className="w-5 h-5 text-yellow-400" />
 مستشار العمليات الذكي
 </h3>

 <div className="space-y-4">
 {recommendations.length === 0 ? (
 <div className="text-center py-12">
 <p className="text-slate-600 text-xs italic">بانتظار ردود الفعل العصبية...</p>
 </div>
 ) : recommendations.map((rec, i) => (
 <div key={i} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl group hover:border-slate-600 transition-all">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border \${
 rec.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
 }`}>{rec.severity === 'Critical' ? 'حرج' : 'تحذير'}</span>
 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono text-right">منطقة التأثير: {rec.impact_area}</span>
 </div>
 <h4 className="text-sm font-black text-white mb-2">{rec.title}</h4>
 <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{rec.description}</p>
 
 <div className="flex items-center gap-2">
 <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
 موافقة وتنفيذ
 </button>
 <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
 تجاهل
 </button>
 </div>
 </div>
 <div className="hidden md:flex flex-col items-center justify-center border-l border-slate-200 dark:border-slate-800 pl-4 w-24">
 <p className="text-[9px] text-slate-600 font-black uppercase mb-1">الثقة</p>
 <p className="text-xl font-black text-white">92%</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Sidebar Intelligence */}
 <div className="space-y-6">
 {/* Deployment Risk Intelligence */}
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-3xl pointer-events-none" />
 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
 <Rocket className="w-5 h-5 text-orange-400" />
 تحليل مخاطر النشر
 </h3>

 <div className="flex flex-col items-center justify-center py-6">
 <div className="relative w-32 h-32 mb-4">
 <svg className="w-full h-full transform -rotate-90">
 <circle 
 cx="64" cy="64" r="58" 
 className="fill-none stroke-slate-800 stroke-[8]" 
 />
 <circle 
 cx="64" cy="64" r="58" 
 className={`fill-none stroke-[8] transition-all duration-1000 \${
 (deployRisk?.risk_score || 0) < 20 ? 'stroke-emerald-500' :
 (deployRisk?.risk_score || 0) < 50 ? 'stroke-yellow-500' : 'stroke-red-500'
 }`}
 style={{ 
 strokeDasharray: '364.4', 
 strokeDashoffset: (364.4 - (364.4 * (deployRisk?.risk_score || 0)) / 100).toString() 
 }}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-3xl font-black text-white">{deployRisk?.risk_score || 0}%</span>
 <span className="text-[8px] text-slate-500 uppercase font-black">معدل المخاطر</span>
 </div>
 </div>
 <p className={`text-[10px] font-black uppercase tracking-widest \${
 deployRisk?.safety_status === 'Optimal' ? 'text-emerald-400' : 
 deployRisk?.safety_status === 'Caution' ? 'text-yellow-400' : 'text-red-400'
 }`}>حالة السلامة: {deployRisk?.safety_status === 'Optimal' ? 'مثالية' : deployRisk?.safety_status === 'Caution' ? 'حذر' : 'غير آمن'}</p>
 </div>

 <div className="space-y-3 mt-4">
 {[
 { label: "احتمالية التراجع", value: `\${deployRisk?.rollback_probability || 0}%` },
 { label: "احتمالية الاستقرار", value: `\${100 - (deployRisk?.risk_score || 0)}%` },
 ].map((item, i) => (
 <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800/50">
 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{item.label}</span>
 <span className="text-[10px] font-black text-white">{item.value}</span>
 </div>
 ))}
 </div>

 <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/50">
 <p className="text-[9px] text-slate-600 uppercase font-black mb-3 text-right">العوامل المقيدة</p>
 <div className="flex flex-wrap gap-2 justify-end">
 {deployRisk?.limiting_factors?.map((f: string, i: number) => (
 <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded text-[8px] font-bold uppercase">{f}</span>
 ))}
 </div>
 </div>
 </div>

 {/* Runtime Optimization Section */}
 <div className="glass-panel rounded-2xl p-6 ">
 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
 <Zap className="w-5 h-5 text-blue-400" />
 تحسين بيئة التشغيل
 </h3>

 <div className="space-y-4">
 {optimizations.map((opt, i) => (
 <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl group hover:border-blue-500/30 transition-all">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{opt.type === 'Resource' ? 'موارد' : opt.type === 'Performance' ? 'أداء' : 'تكلفة'}</span>
 <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded \${
 opt.impact === 'High' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
 }`}>التأثير: {opt.impact === 'High' ? 'عالي' : opt.impact === 'Medium' ? 'متوسط' : 'منخفض'}</span>
 </div>
 <p className="text-[11px] font-black text-slate-200 mb-1">{opt.title}</p>
 <p className="text-[10px] text-slate-500 leading-tight mb-2">{opt.description}</p>
 <button className="text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors">تطبيق الاستراتيجية &larr;</button>
 </div>
 ))}
 </div>
 </div>

 {/* Anomaly Forecasting Heatmap (Simplified) */}
 <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl pointer-events-none" />
 <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
 <Radar className="w-5 h-5 text-red-500" />
 استخبارات الانحرافات
 </h3>
 <div className="space-y-3">
 {anomalies.map((anom, i) => (
 <div key={i} className="flex gap-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl group hover:bg-red-500/10 transition-all">
 <div className="flex flex-col items-center border-r border-red-500/20 pr-3">
 <span className="text-[8px] text-red-500 font-black uppercase mb-1">{anom.severity === 'Medium' ? 'متوسط' : 'منخفض'}</span>
 <Eye className="w-4 h-4 text-red-500" />
 </div>
 <div className="flex-1">
 <p className="text-[10px] font-black text-white mb-1 uppercase tracking-tight">انحراف {anom.type === 'Behavioral' ? 'سلوكي' : 'هيكلي'}</p>
 <p className="text-[10px] text-red-400 opacity-80 leading-tight">{anom.details}</p>
 <p className="text-[8px] text-slate-600 mt-2 font-mono uppercase">{new Date(anom.time).toLocaleTimeString()}</p>
 </div>
 </div>
 ))}
 </div>
 <button className="w-full mt-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase rounded-lg border border-slate-300 dark:border-slate-700 transition-all">
 الدخول لخريطة الانحرافات
 </button>
 </div>

 {/* Core Health Persistence */}
 <div className="glass-panel rounded-2xl p-6 bg-emerald-500/5 border-emerald-500/20">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-[spin_4s_linear_infinite] flex items-center justify-center">
 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,1)]" />
 </div>
 <div>
 <p className="text-xs font-black text-white uppercase tracking-widest">سلامة بيئة التشغيل</p>
 <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">المرونة التشغيلية: مثالية</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
