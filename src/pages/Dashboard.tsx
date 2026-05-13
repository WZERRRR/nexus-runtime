import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { 
  Cpu, Server, Network, HardDrive, Zap, Waves, BrainCircuit, Globe, Shield, Activity, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Database, Layers
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { runtimeAPI, SystemStatus, ProcessStatus } from '../services/runtimeApi';
import { useRuntime } from '../client/context/runtimeContext';

const StatCard = ({ title, value, icon: Icon, trend, data, subtitle, highlightClass }: any) => (
  <div className={`glass-panel rounded-xl p-4 relative group border-[var(--border-subtle)] hover:border-${highlightClass || 'blue'}-500/30 transition-all bg-gradient-to-br from-white/5 to-transparent`}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">{title}</p>
        <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">{value}</h3>
        {subtitle && <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase tracking-tight">{subtitle}</p>}
      </div>
      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-black/10 text-slate-500 group-hover:bg-slate-200 dark:bg-white/5 transition-colors border border-[var(--border-subtle)]`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      {trend && (
        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${trend.startsWith('+') || trend === 'OK' ? 'text-emerald-500/80 bg-emerald-500/5 border-emerald-500/10' : 'text-rose-500/80 bg-rose-500/5 border-rose-500/10'}`}>
          {trend}
        </span>
      )}
    </div>
    {data && data.length > 0 && (
      <div className="h-10 mt-3 -mx-1 opacity-40 group-hover:opacity-80 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area type="monotone" dataKey="value" stroke={highlightClass === 'emerald' ? '#10b981' : highlightClass === 'purple' ? '#a855f7' : "#3b82f6"} strokeWidth={1.5} fill={highlightClass === 'emerald' ? '#10b981' : highlightClass === 'purple' ? '#a855f7' : "#3b82f6"} fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

export function Dashboard() {
  const location = useLocation();
  const projectContext = location.state?.project;
  const projectRuntimeId = projectContext?.id || projectContext?.runtimeId || 'rt-core';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
  const [procStatus, setProcessStatus] = useState<ProcessStatus | null>(null);
  const [stability, setStability] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [pm2Procs, setPm2Procs] = useState<any[]>([]);
  const [riskIndicators, setRiskIndicators] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  
  const lastFetchRef = useRef<number>(0);

  const fetchDashboardData = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 5000) return; // Prevent excessive polling
    lastFetchRef.current = now;

    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        runtimeAPI.getSystemStatus(),
        runtimeAPI.getProcessStatus(),
        runtimeAPI.getStabilityIndex(),
        runtimeAPI.getEvents(projectRuntimeId, 10),
        runtimeAPI.getPM2Processes(undefined, projectRuntimeId),
        runtimeAPI.getRiskIndicators(),
        runtimeAPI.getMetrics(projectRuntimeId),
        runtimeAPI.getNodes(),
        runtimeAPI.getPipelines()
      ]);

      if (results[0].status === 'fulfilled') setSysStatus(results[0].value);
      if (results[1].status === 'fulfilled') setProcessStatus(results[1].value);
      if (results[2].status === 'fulfilled') {
        const stab = results[2].value;
        setStability(stab[0] || { score: 100, trend: 'STABLE' });
      }
      if (results[3].status === 'fulfilled') setEvents(results[3].value || []);
      if (results[4].status === 'fulfilled') setPm2Procs(results[4].value || []);
      if (results[5].status === 'fulfilled') setRiskIndicators(results[5].value || { system_risk: 0 });
      if (results[6].status === 'fulfilled') setMetrics(results[6].value);
      if (results[7].status === 'fulfilled') setNodes(results[7].value || []);
      if (results[8].status === 'fulfilled') setPipelines(results[8].value || []);
      
    } catch (err) {
      console.error("Dashboard data sync encountered a critical error", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
    const interval = setInterval(() => fetchDashboardData(), 15000);
    return () => clearInterval(interval);
  }, [projectRuntimeId]);

  const formatMem = (bytes?: number) => bytes ? `${Math.round(bytes / 1024 / 1024)} MB` : '...';
  const formatUptime = (seconds?: number) => {
    if (!seconds) return '...';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    return `${d}d ${h}h`;
  };

  const getSystemHealth = () => {
    if (!sysStatus || !stability) return { text: 'تهيئة', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    const score = stability.score || 100;
    if (score > 90) return { text: 'مثالي', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (score > 70) return { text: 'منخفض', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { text: 'حرج', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const health = getSystemHealth();

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.15)] hidden sm:flex">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              لوحة العمليات 
              <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10 tracking-widest uppercase">
                {projectContext ? projectContext.name : 'الأنظمة الأساسية'}
              </span>
            </h1>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${health.bg.replace('/10', '')} animate-pulse`} />
              معرف النظام: {projectRuntimeId}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col items-end px-4 border-l border-[var(--border-subtle)] hidden sm:flex">
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">حالة النظام</p>
             <p className={`text-sm font-black ${health.color}`}>{health.text}</p>
          </div>
          <button 
            onClick={() => fetchDashboardData(true)}
            disabled={isRefreshing}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 glass-panel hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 rounded-xl transition-all text-xs font-bold active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : 'text-slate-500'}`} />
            {isRefreshing ? 'جاري المزامنة...' : 'مزامنة'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title="استهلاك المعالج" 
          value={sysStatus?.loadavg ? `${(sysStatus.loadavg[0] * 10).toFixed(1)}%` : '0.0%'} 
          subtitle={`${sysStatus?.cpus || 1} أنوية مفعلة`}
          icon={Cpu} 
          trend={metrics?.cpu_trend === 'OK' ? 'طبيعي' : metrics?.cpu_trend}
          data={metrics?.cpu_history || []}
        />
        <StatCard 
          title="استهلاك الذاكرة" 
          value={sysStatus ? formatMem(sysStatus.totalmem - sysStatus.freemem) : '0 MB'} 
          subtitle={`متاح: ${formatMem(sysStatus?.freemem)}`}
          icon={Server} 
          trend={metrics?.mem_trend === 'OK' ? 'طبيعي' : metrics?.mem_trend}
          highlightClass="purple"
        />
        <StatCard 
          title="مدة التشغيل" 
          value={formatUptime(sysStatus?.uptime)} 
          subtitle="عمر النظام"
          icon={Clock} 
          highlightClass="emerald"
        />
        <StatCard 
          title="مؤشر الخطر" 
          value={`${riskIndicators?.system_risk || 0}%`}
          subtitle="التهديدات الحية"
          icon={AlertTriangle}
          trend={riskIndicators?.system_risk > 50 ? "تحذير" : "آمن"}
          highlightClass={riskIndicators?.system_risk > 50 ? "rose" : "emerald"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 flex flex-col">
          <div className="glass-panel rounded-2xl p-4 sm:p-5 flex-1 max-h-[400px] overflow-hidden flex flex-col">
             <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  سجل الأحداث اللحظي
                </h3>
                <span className="text-[9px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-black tracking-widest uppercase">مباشر</span>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pl-2">
                {events.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-2">
                     <Database className="w-8 h-8 mb-2" />
                     <p className="text-xs font-bold uppercase tracking-widest">لا توجد أحداث حديثة</p>
                  </div>
                ) : events.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                     <div className={`mt-0.5 shrink-0 ${ev.type === 'error' ? 'text-red-500' : ev.type === 'warning' ? 'text-orange-500' : 'text-emerald-500'}`}>
                        {ev.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : ev.type === 'warning' ? <Shield className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-[var(--text-primary)] leading-tight">{ev.message || ev.event}</p>
                        <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase">{new Date(ev.timestamp).toLocaleString('ar-SA')}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 flex flex-col">
          <div className="glass-panel rounded-2xl flex flex-col flex-1 max-h-[400px]">
            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 rounded-t-2xl shrink-0">
              <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                العمليات النشطة
              </h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest">PM2</span>
              </div>
            </div>
            <div className="p-2 sm:p-3 space-y-1.5 overflow-y-auto custom-scrollbar flex-1">
              {pm2Procs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-10">
                     <Server className="w-6 h-6 mb-2" />
                     <p className="text-[10px] font-bold uppercase tracking-widest">لا توجد عمليات</p>
                  </div>
              ) : pm2Procs.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-[var(--border-subtle)] hover:border-purple-500/30 transition-all group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex h-2 w-2 shrink-0">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${p.status === 'online' ? 'bg-green-400 animate-ping' : 'bg-rose-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-full w-full ${p.status === 'online' ? 'bg-green-500' : 'bg-rose-500'}`}></span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate">{p.name || `عملية ${p.id}`}</p>
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mt-0.5">{p.memory || p.mem || '0MB'} • {p.cpu || '0%'} CPU</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 flex flex-col">
          <div className="glass-panel rounded-2xl flex flex-col flex-1 max-h-[400px]">
            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 rounded-t-2xl shrink-0">
              <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                البنية التحتية والنشر
              </h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest">مباشر</span>
              </div>
            </div>
            
            <div className="p-3 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div>
                 <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-[var(--border-subtle)] pb-1">عقد الخوادم (Nodes)</h4>
                 {nodes.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic py-2">لا توجد عقد نشطة.</p>
                 ) : nodes.slice(0, 3).map((node, i) => (
                    <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 border border-transparent transition-colors">
                       <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">{node.hostname || node.node_id || `Node-${i}`}</p>
                          <p className="text-[8px] text-slate-500 font-bold tracking-widest uppercase">{node.region || 'محلي'} {node.role ? `• ${node.role}` : ''}</p>
                       </div>
                       <span className="text-[8px] text-emerald-500 font-black uppercase px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                         {node.status || 'نشط'}
                       </span>
                    </div>
                 ))}
              </div>

              <div>
                 <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-[var(--border-subtle)] pb-1">عمليات النشر النشطة</h4>
                 {pipelines.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic py-2">لا توجد عمليات نشر.</p>
                 ) : pipelines.slice(0, 3).map((pipe, i) => (
                    <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 border border-transparent transition-colors">
                       <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">{pipe.name || `Pipeline-${i}`}</p>
                          <p className="text-[8px] text-slate-500 font-bold tracking-widest uppercase">{pipe.branch || 'main'} • {pipe.elapsed || 'قيد التشغيل'}</p>
                       </div>
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                         pipe.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                         pipe.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                         'bg-blue-500/10 text-blue-500 border-blue-500/20'
                       }`}>
                         {pipe.status === 'success' ? 'ناجح' : pipe.status === 'failed' ? 'فشل' : 'نشط'}
                       </span>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

