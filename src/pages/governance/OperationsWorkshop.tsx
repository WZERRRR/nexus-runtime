import React, { useState, useEffect } from 'react';
import { Zap, Activity, ShieldAlert, Cpu, Network, RotateCcw, Play, StopCircle, Sliders, AlertTriangle } from 'lucide-react';
import { runtimeAPI } from '../../services/runtimeApi';
import { motion, AnimatePresence } from 'motion/react';
import { 
 AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export const OperationsWorkshop = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
 const [simState, setSimState] = useState<any>(null);
 const [chaosLevel, setChaosLevel] = useState(0);
 const [isUpdating, setIsUpdating] = useState(false);
 const [stabilityData, setStabilityData] = useState<any[]>([]);
 const [forecastData, setForecastData] = useState<any[]>([]);

 useEffect(() => {
 fetchData();
 const interval = setInterval(fetchData, 3000);
 return () => clearInterval(interval);
 }, []);

 const fetchData = async () => {
 const [state, stability, forecast] = await Promise.all([
 runtimeAPI.getSimulationState(),
 runtimeAPI.getStabilityIndex(),
 runtimeAPI.getFailureForecast()
 ]);
 setSimState(state);
 setStabilityData(stability.reverse());
 setForecastData(forecast);
 };

 const handleToggleStress = async () => {
 setIsUpdating(true);
 await runtimeAPI.toggleStressMode(!simState?.is_stress_mode, chaosLevel);
 await fetchData();
 setIsUpdating(false);
 };

 const handleToggleDrill = async () => {
 setIsUpdating(true);
 await runtimeAPI.toggleRecoveryDrill(!simState?.is_drill_active);
 await fetchData();
 setIsUpdating(false);
 };

 return (
 <div className="space-y-8 animate-in fade-in duration-700">
 <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
 <div>
 <button onClick={() => onNavigate('overview')} className="text-[10px] uppercase font-bold text-slate-500 hover:text-white mb-2 tracking-widest transition-colors flex items-center gap-1">
 &rarr; العودة للوحة الرئيسية
 </button>
 <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
 <Zap className="w-6 h-6 text-yellow-500" />
 ورشة العمليات والجهد
 </h2>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 uppercase font-bold tracking-tighter text-right">محاكاة البيئة الواقعية، اختبارات الجهد، وتدريبات التعافي</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Control Panel */}
 <div className="lg:col-span-1 space-y-6">
 <div className="glass-panel rounded-2xl p-6 text-right relative overflow-hidden">
 <div className={`absolute top-0 right-0 w-full h-1 ${simState?.is_stress_mode ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 وحدة تحكم المحاكاة
 <Sliders className="w-4 h-4 text-slate-600 dark:text-slate-400" />
 </h3>
 
 <div className="space-y-6">
 <div>
 <label className="text-[10px] font-bold text-slate-500 uppercase block mb-3">مستوى الفوضى (Chaos Level)</label>
 <input 
 type="range" 
 min="0" 
 max="100" 
 value={chaosLevel}
 onChange={(e) => setChaosLevel(parseInt(e.target.value))}
 className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
 />
 <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-600 dark:text-slate-400">
 <span>100% Extreme</span>
 <span>{chaosLevel}%</span>
 <span>0% Normal</span>
 </div>
 </div>

 <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
 <button 
 onClick={handleToggleStress}
 disabled={isUpdating}
 className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
 simState?.is_stress_mode 
 ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm dark:shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
 : 'bg-yellow-500 hover:bg-yellow-400 text-black'
 }`}
 >
 {simState?.is_stress_mode ? <StopCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
 {simState?.is_stress_mode ? 'وقف اختبار الجهد' : 'بدء اختبار الجهد'}
 </button>

 <button 
 onClick={handleToggleDrill}
 disabled={isUpdating}
 className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${
 simState?.is_drill_active 
 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
 : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-700'
 }`}
 >
 <RotateCcw className={`w-4 h-4 ${simState?.is_drill_active ? 'animate-spin' : ''}`} />
 {simState?.is_drill_active ? 'جاري تدريب التعافي...' : 'إطلاق تدريب استعادة'}
 </button>
 </div>
 </div>
 </div>

 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">مؤشرات المخاطر الحالية</h3>
 <div className="space-y-4">
 <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
 <div className="flex justify-between mb-1">
 <span className="text-[10px] font-black text-red-400 uppercase">{simState?.is_stress_mode ? 'Critical' : 'Safe'}</span>
 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">مستوى التهديد المحاكي</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
 <motion.div 
 className={`h-full ${simState?.is_stress_mode ? 'bg-red-500' : 'bg-emerald-500'}`}
 initial={{ width: 0 }}
 animate={{ width: simState?.is_stress_mode ? `${40 + chaosLevel/2}%` : '5%' }}
 />
 </div>
 </div>
 <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
 <div className="flex justify-between mb-1">
 <span className="text-[10px] font-black text-purple-400 uppercase">{simState?.is_drill_active ? 'In Progress' : 'Pending'}</span>
 <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">جاهزية التعافي</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
 <motion.div 
 className="bg-purple-500 h-full"
 initial={{ width: 0 }}
 animate={{ width: simState?.is_drill_active ? '65%' : '100%' }}
 />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Live Visualization */}
 <div className="lg:col-span-2 space-y-6">
 {/* Stability Chart */}
 <div className="glass-panel rounded-2xl p-6 h-[400px] text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 مخطط ثبات البنية التحتية
 <Activity className="w-4 h-4 text-emerald-400" />
 </h3>
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={stabilityData}>
 <defs>
 <linearGradient id="colorStability" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
 <XAxis dataKey="timestamp" hide />
 <YAxis domain={[0, 100]} hide />
 <Tooltip 
 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
 itemStyle={{ color: '#10b981' }}
 />
 <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorStability)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Prediction Stream */}
 <div className="glass-panel rounded-2xl p-6 text-right">
 <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center justify-end gap-2">
 توقعات الفشل التنبؤية (Simulation Feed)
 <ShieldAlert className="w-4 h-4 text-orange-400" />
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {forecastData.slice(0, 4).map((f, i) => (
 <div key={i} className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
 <div className="flex justify-between items-center mb-2">
 <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
 f.failure_probability > 10 ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
 }`}>
 احتمالية: {f.failure_probability}%
 </span>
 <span className="text-[10px] text-slate-500">{new Date(f.timestamp).toLocaleTimeString()}</span>
 </div>
 <div className="space-y-2">
 <div className="flex justify-between text-[8px] uppercase text-slate-600 font-bold">
 <span>{f.resource_exhaustion}%</span>
 <span>استنزاف الموارد</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full"><div className="bg-orange-500 h-1 rounded-full" style={{ width: `${f.resource_exhaustion}%` }} /></div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 
 <AnimatePresence>
 {simState?.is_stress_mode && (
 <motion.div 
 initial={{ opacity: 0, y: 50 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 50 }}
 className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
 >
 <div className="bg-red-600 text-white p-4 rounded-2xl shadow-sm dark:shadow-[0_0_40px_rgba(220,38,38,0.5)] flex items-center justify-between border border-red-500">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-slate-200 dark:bg-white/20 rounded-full flex items-center justify-center animate-pulse">
 <AlertTriangle className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-black uppercase tracking-tight">وضع الإجهاد نشط</p>
 <p className="text-[10px] opacity-80 font-bold uppercase">يتم محاكاة حمل عمل إنتاجي مكثف...</p>
 </div>
 </div>
 <button onClick={handleToggleStress} className="bg-white text-red-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase">وقف</button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
};
