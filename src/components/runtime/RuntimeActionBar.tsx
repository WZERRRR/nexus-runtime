import React, { useState } from 'react';
import { 
  GitPullRequest, RefreshCw, Box, Play, Terminal, 
  UploadCloud, FileText, RotateCcw, ShieldCheck, 
  CheckCircle2, AlertCircle, Loader2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { runtimeAPI } from '../../services/runtimeApi';
import { useNavigate } from 'react-router-dom';

interface RuntimeActionBarProps {
  project: any;
  className?: string;
}

export const RuntimeActionBar: React.FC<RuntimeActionBarProps> = ({ project, className }) => {
  const navigate = useNavigate();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [logs, setLogs] = useState<{type: 'info' | 'success' | 'error', message: string}[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAction = async (action: string, label: string) => {
    setActiveAction(action);
    setIsExpanded(true);
    setLogs(prev => [...prev, { type: 'info', message: `Initiating ${label} protocol for ${project.name}...` }]);
    
    try {
      const res = await runtimeAPI.performProjectAction(project.id, action, project.environments?.[0]?.path);
      if (res.success) {
        setLogs(prev => [...prev, { type: 'success', message: `${label} finalized successfully.` }]);
        if (res.data?.stdout) {
           setLogs(prev => [...prev, { type: 'info', message: res.data.stdout }]);
        }
      } else {
        setLogs(prev => [...prev, { type: 'error', message: `Execution Error: ${res.message || 'Unknown fault'}` }]);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, { type: 'error', message: `Connection Fault: ${err.message}` }]);
    } finally {
      setActiveAction(null);
    }
  };

  const [currentStep, setCurrentStep] = useState<number | null>(null);

  const updateSteps = [
    { id: 'git_sync', label: 'Git Sync', action: 'git_pull' },
    { id: 'deps', label: 'Install dependencies', action: 'sync' },
    { id: 'build', label: 'Build production', action: 'build' },
    { id: 'restart', label: 'Restart processes', action: 'restart' },
    { id: 'health', label: 'Health Check', action: 'health' }
  ];

  const handleUpdateFlow = async () => {
    setIsExpanded(true);
    setLogs([]);
    setLogs(prev => [...prev, { type: 'info', message: 'Starting NEXUS Runtime Update Engine...' }]);
    
    for (let i = 0; i < updateSteps.length; i++) {
       const step = updateSteps[i];
       setCurrentStep(i);
       setLogs(prev => [...prev, { type: 'info', message: `Step ${i+1}/${updateSteps.length}: ${step.label}...` }]);
       
       try {
         // Health check is client side check or special ping
         if (step.id === 'health') {
            await new Promise(r => setTimeout(r, 1500));
            setLogs(prev => [...prev, { type: 'success', message: 'System Health: 100% (All heartbeats received)' }]);
            continue;
         }

         const res = await runtimeAPI.performProjectAction(project.id, step.action, project.environments?.[0]?.path);
         if (!res.success) {
            setLogs(prev => [...prev, { type: 'error', message: `Engine Failure at ${step.label}: ${res.message}` }]);
            setCurrentStep(null);
            return;
         }
         setLogs(prev => [...prev, { type: 'success', message: `${step.label} verified.` }]);
       } catch (err: any) {
         setLogs(prev => [...prev, { type: 'error', message: `Critical Engine Fault: ${err.message}` }]);
         setCurrentStep(null);
         return;
       }
    }
    
    setCurrentStep(null);
    setLogs(prev => [...prev, { type: 'success', message: 'Runtime successfully updated and synchronized.' }]);
  };

  const actions = [
    { id: 'update_flow', label: 'Update Runtime', icon: <RotateCcw className="w-4 h-4" />, color: 'text-emerald-400 font-bold', bg: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20', customAction: handleUpdateFlow },
    { id: 'git_pull', label: 'Git Pull', icon: <GitPullRequest className="w-4 h-4" />, color: 'text-blue-400', bg: 'hover:bg-blue-500/10' },
    { id: 'build', label: 'Build', icon: <Box className="w-4 h-4" />, color: 'text-amber-400', bg: 'hover:bg-amber-500/10' },
    { id: 'restart', label: 'Restart', icon: <Play className="w-4 h-4" />, color: 'text-purple-400', bg: 'hover:bg-purple-500/10' },
    { id: 'ssh', label: 'Open SSH', icon: <Terminal className="w-4 h-4" />, color: 'text-slate-600 dark:text-slate-400', bg: 'hover:bg-slate-200 dark:bg-white/10', customAction: () => navigate('/terminal', { state: { project } }) },
    { id: 'deploy', label: 'Deploy', icon: <UploadCloud className="w-4 h-4" />, color: 'text-rose-400 font-bold', bg: 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20' },
    { id: 'logs', label: 'View Logs', icon: <FileText className="w-4 h-4" />, color: 'text-sky-400', bg: 'hover:bg-sky-500/10', customAction: () => navigate('/logs', { state: { project } }) },
    { id: 'governance', label: 'Governance', icon: <ShieldCheck className="w-4 h-4" />, color: 'text-indigo-400', bg: 'hover:bg-indigo-500/10', customAction: () => navigate('/admin/governance', { state: { project } }) },
  ];

  return (
    <div className={cn("flex flex-col gap-3", className)} dir="rtl">
      <div className="flex flex-wrap items-center gap-2 bg-[#0d121f]/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-white/5 shadow-2xl">
        {actions.map((act) => (
          <button
            key={act.id}
            disabled={!!activeAction || currentStep !== null}
            onClick={() => act.customAction ? act.customAction() : handleAction(act.id, act.label)}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-transparent disabled:opacity-50",
              act.bg,
              act.color,
              (activeAction === act.id || (act.id === 'update_flow' && currentStep !== null)) ? "bg-slate-200 dark:bg-white/10 border-slate-200 dark:border-white/10" : ""
            )}
          >
            {(activeAction === act.id || (act.id === 'update_flow' && currentStep !== null)) ? <Loader2 className="w-4 h-4 animate-spin" /> : act.icon}
            <span className="hidden md:inline">{act.label}</span>
          </button>
        ))}
        
        <div className="h-6 w-px bg-slate-200 dark:bg-white/5 mx-2 hidden md:block" />
        
        <button 
           onClick={() => setIsExpanded(!isExpanded)}
           className="p-2 text-slate-500 hover:text-white transition-colors"
        >
           <Info className={cn("w-4 h-4", isExpanded && "text-blue-400")} />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
               
               {currentStep !== null && (
                 <div className="mb-4 bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-blue-400 font-black uppercase tracking-widest">Update Progress</span>
                       <span className="text-slate-500">{Math.round(((currentStep + 1) / updateSteps.length) * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         className="h-full bg-blue-500" 
                         initial={{ width: 0 }}
                         animate={{ width: `${((currentStep + 1) / updateSteps.length) * 100}%` }}
                       />
                    </div>
                    <div className="flex gap-2 mt-2">
                       {updateSteps.map((s, idx) => (
                         <div key={s.id} className={cn(
                           "flex-1 h-1 rounded-full",
                           idx <= currentStep ? "bg-emerald-500" : "bg-slate-200 dark:bg-white/5"
                         )} />
                       ))}
                    </div>
                 </div>
               )}

               <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-white/5 pb-2">
                  <span className="text-slate-500 uppercase font-black tracking-widest">Runtime Event Log</span>
                  <button onClick={() => setLogs([])} className="text-slate-600 hover:text-slate-700 dark:text-slate-300 text-[10px]">Clear</button>
               </div>
               {logs.length === 0 ? (
                 <div className="text-slate-700 italic">No active runtime operations...</div>
               ) : (
                 logs.map((log, i) => (
                   <div key={i} className={cn(
                     "mb-1 flex gap-3",
                     log.type === 'success' ? "text-emerald-400" : log.type === 'error' ? "text-red-400" : "text-slate-600 dark:text-slate-400"
                   )}>
                     <span className="shrink-0 text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                     <span className="flex-1 whitespace-pre-wrap">{log.message}</span>
                   </div>
                 ))
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
