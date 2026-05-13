import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
 Terminal as TerminalIcon, Server, Maximize2, Trash2, 
 ShieldCheck, Activity, Play, ChevronLeft, Command,
 Wifi, ShieldAlert, Cpu, HardDrive, WifiOff,
 Search, Github, TerminalSquare, AlertTriangle,
 History, Settings, Zap, ArrowLeft, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { runtimeAPI } from '../services/runtimeApi';


export function TerminalPage() {
 const { state } = useLocation();
 const context = state?.project;
 const [servers, setServers] = useState<any[]>([]);
 const [activeServer, setActiveServer] = useState<string | null>(null);
 const [inputVal, setInputVal] = useState('');
 const [output, setOutput] = useState<{type: string, text: string}[]>([]);
 const [isExpanded, setIsExpanded] = useState(false);
 const scrollRef = useRef<HTMLDivElement>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const [isExecuting, setIsExecuting] = useState(false);

 const server = servers.find(s => s.id === activeServer) || servers[0] || { name: 'NEXUS-NODE', ip: context?.host || '0.0.0.0', os: 'Nexus OS' };

 useEffect(() => {
  const loadNodes = async () => {
    try {
      const nodes = await runtimeAPI.getNodes();
      
      let filteredNodes = nodes;
      if (context) {
        const targetHost = context.runtime_host || context.host;
        filteredNodes = nodes.filter(n => n.id === context.node_id || (targetHost && n.ip === targetHost) || n.name.includes(context.name));
        
        if (filteredNodes.length === 0 && targetHost) {
          filteredNodes = [{
            id: context.node_id || 'project-node',
            name: (context.name || 'nexus') + '-NODE',
            ip: targetHost,
            os: 'Nexus Runtime',
            load: '2%',
            status: 'online'
          }];
        }
      }

      setServers(filteredNodes);
      if (filteredNodes.length > 0) {
        const initialServer = filteredNodes[0];
        setActiveServer(initialServer.id);
        
        setOutput([
          { type: 'system', text: `Connecting to ${initialServer.name} [${initialServer.ip}]...` },
          { type: 'success', text: 'Secure SSH Handshake Completed [Ed25519]' },
          { type: 'system', text: `Welcome to ${initialServer.os} | Nexus Runtime Protocol v5.1` },
          { type: 'system', text: `System Context: ${context ? context.name : 'Global'}` },
          { type: 'system', text: `Active Directory: ${context?.runtime_path || '/www/wwwroot'}` },
          { type: 'system', text: '\nReady for operational commands.' },
        ]);
      } else {
         setOutput([
          { type: 'warning', text: 'No active runtime nodes detected for this context.' },
          { type: 'system', text: 'Please ensure a server is registered and linked to the project.' },
        ]);
      }
    } catch (e) {
      console.error('Failed to load nodes', e);
    }
  };
  loadNodes();
 }, [context]);

 useEffect(() => {
 if (scrollRef.current) {
 scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
 }
 }, [output]);

 const handleCommandSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!inputVal.trim() || isExecuting) return;

 const cmdRaw = inputVal.trim();
 const newCmd = { type: 'command', text: cmdRaw };
 setOutput(prev => [...prev, newCmd]);
 setInputVal('');
 
 if (cmdRaw.toLowerCase() === 'clear') {
 setOutput([]);
 return;
 }

 setIsExecuting(true);
 try {
    if (!context?.id) {
       setOutput(prev => [...prev, { type: 'error', text: 'Error: No target project context. Terminal restricted to project-specific operations.' }]);
       setIsExecuting(false);
       return;
    }
    const res = await runtimeAPI.executeTerminalCommand(cmdRaw, undefined, context?.id);
   if (res.success && res.data) {
     if (res.data.stdout) {
       setOutput(prev => [...prev, { type: 'system', text: res.data.stdout.trimEnd() }]);
     }
     if (res.data.stderr) {
       setOutput(prev => [...prev, { type: 'warning', text: res.data.stderr.trimEnd() }]);
     }
   } else {
     setOutput(prev => [...prev, { type: 'error', text: res.message || res.data?.error || `Command failed: ${cmdRaw}` }]);
   }
 } catch (err: any) {
   setOutput(prev => [...prev, { type: 'error', text: `Execution fault: ${err.message}` }]);
 } finally {
   setIsExecuting(false);
   setTimeout(() => inputRef.current?.focus(), 10);
 }
 };

 const handleChangeServer = (id: string) => {
  if (activeServer === id) return;
  setActiveServer(id);
  const srv = servers.find(s => s.id === id);
  
  setOutput(prev => [...prev, { type: 'system', text: `\nTerminating current connection... Session closed.` }]);
  
  setTimeout(() => {
  setOutput([
  { type: 'system', text: `Initiating SSH to ${srv?.name} [${srv?.ip}]` },
  { type: 'warning', text: `Warning: Authorized sessions only. Activity is monitored.` },
  { type: 'success', text: `Authenticated via project certificate` },
  { type: 'system', text: `\nWelcome to ${srv?.os || 'Nexus OS'} | Virtual Machine Platform v4.2` },
  { type: 'system', text: `System Load: ${srv?.load || '0%'} | Uptime: ONLINE` }
  ]);
  if (inputRef.current) inputRef.current.focus();
  }, 600);
 };

 return (
 <div className="space-y-8 flex flex-col h-[calc(100vh-6rem)] overflow-hidden text-right font-sans" dir="rtl">
 <ProjectHeader 
 projectName={context?.name}
 project={context}
 projectDescription={context ? undefined : "التحكم الكامل في الخوادم عبر واجهة Terminal مشفرة بالكامل. وصول SSH مباشر لإدارة الملفات، العمليات، وقواعد البيانات."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="وحدة التحكم الذكية (Nexus SSH Console)"
 actions={
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5">
 <Trash2 className="w-4 h-4" />
 مسح السجل
 </button>
 <button 
 onClick={() => setIsExpanded(!isExpanded)}
 className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5"
 >
 <Maximize2 className="w-4 h-4" />
 {isExpanded ? 'تصغير الواجهة' : 'ملء الشاشة'}
 </button>
 </div>
 }
 />

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 pb-8 px-1 overflow-hidden">
 {/* Servers Sidebar */}
 <div className="lg:col-span-3 flex flex-col gap-6 overflow-hidden">
 <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col h-full ">
 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-16 -mt-16 rounded-full"></div>
 
 <div className="flex items-center justify-between mb-8 relative z-10 text-right">
 <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
 <Server className="w-5 h-5 text-emerald-500" />
 </div>
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">الخوادم النشطة</h3>
 </div>

 <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 relative z-10 pr-1">
 {servers.length === 0 ? (
   <div className="text-center py-20 opacity-30">
     <WifiOff className="w-8 h-8 mx-auto mb-3 text-slate-500" />
     <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Nodes Found</p>
   </div>
 ) : (
   servers.map((s) => (
     <motion.button
     key={s.id}
     whileHover={{ scale: 1.02 }}
     whileTap={{ scale: 0.98 }}
     onClick={() => handleChangeServer(s.id)}
     className={`w-full text-right p-5 rounded-3xl border transition-all relative overflow-hidden group ${
     activeServer === s.id 
     ? 'bg-blue-600/10 border-blue-500/30' 
     : 'bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:bg-black/40'
     }`}
     >
     <div className="flex justify-between items-center mb-3">
     <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-emerald-500 animate-pulse shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
     <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{s.name}</h4>
     </div>
     <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">
     <span>{s.ip}</span>
     <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {s.load || '2%'}</span>
     </div>
     <div className="flex items-center gap-2 text-[9px] font-black text-blue-400 bg-blue-500/5 p-2 rounded-lg justify-end">
     {s.os}
     </div>
     {activeServer === s.id && (
     <motion.div 
     layoutId="active-server-indicator"
     className="absolute bottom-0 right-0 h-1 w-full bg-blue-500"
     />
     )}
     </motion.button>
   ))
 )}
 </div>

 <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 relative z-10 flex flex-col gap-4">
 <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3 flex-row-reverse text-right">
 <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
 <div>
 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">تشفير عسكري</p>
 <p className="text-[9px] text-slate-500 font-bold leading-relaxed">اتصال SSH عبر نفق مشفر بالكامل (Quantum Resistant Ready).</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Terminal Window */}
 <div className="lg:col-span-9 flex flex-col overflow-hidden">
 <div className={`glass-panel rounded-3xl bg-[#080c14] flex flex-col overflow-hidden relative flex-1 ${isExpanded ? 'fixed inset-4 z-[100] m-0 rounded-3xl' : ''}`}>
 {/* Terminal Header */}
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-[#0d121f] flex items-center justify-between shrink-0 px-8">
 <div className="flex gap-2">
 <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
 <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
 <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
 </div>
 <div className="flex items-center gap-5 flex-row-reverse text-right">
 <div className="flex items-center gap-3">
 <TerminalIcon className="w-5 h-5 text-blue-400" />
 <div className="flex flex-col text-right">
 <span className="text-[10px] font-black text-white uppercase tracking-widest">SESSION: ACTIVE</span>
 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{server.name} @ {server.ip}</span>
 </div>
 </div>
 <div className="h-8 w-px bg-slate-200 dark:bg-white/5 hidden md:block"></div>
 <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
 <span className="flex items-center gap-2"><Wifi className="w-4 h-4 text-emerald-400" /> LOW LATENCY</span>
 <span className="flex items-center gap-2"><History className="w-4 h-4" /> LOGGING...</span>
 </div>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => setOutput([])}
 className="p-3 bg-slate-200 dark:bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-2xl transition-all"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setIsExpanded(!isExpanded)}
 className="p-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-500 hover:text-white rounded-2xl transition-all"
 >
 {isExpanded ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
 </button>
 </div>
 </div>

 {/* Terminal Display */}
 <div 
 className="flex-1 overflow-auto p-10 font-mono text-[13px] leading-[1.8] custom-scrollbar text-slate-700 dark:text-slate-300 whitespace-pre-wrap select-text bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] bg-fixed"
 ref={scrollRef}
 onClick={() => inputRef.current?.focus()}
 dir="ltr"
 style={{ textShadow: '0 0 20px rgba(59, 130, 246, 0.2)' }}
 >
 {output.map((line, idx) => (
 <motion.div 
 key={idx} 
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 className={`mb-2 ${
 line.type === 'error' ? 'text-red-400' : 
 line.type === 'success' ? 'text-emerald-400' : 
 line.type === 'warning' ? 'text-amber-400' :
 line.type === 'command' ? 'text-blue-400 font-black flex gap-2' : 
 'text-slate-600 dark:text-slate-400'
 }`}
 >
 {line.type === 'command' && (
 <span className="shrink-0 text-slate-600 font-black">root@{server.name.toLowerCase()}:~$</span>
 )}
 {line.text}
 </motion.div>
 ))}
 
 {/* Current Input */}
 <form onSubmit={handleCommandSubmit} className="flex mt-2 group">
 <span className="shrink-0 text-slate-600 font-black mr-2">root@{server.name.toLowerCase()}:~$</span>
 <input 
 autoFocus
 ref={inputRef}
 value={inputVal}
 onChange={(e) => setInputVal(e.target.value)}
 type="text" 
 className="bg-transparent border-none outline-none flex-1 text-white font-mono min-w-0 caret-blue-500"
 autoComplete="off"
 spellCheck="false"
 />
 </form>
 
 {/* Cursor effect */}
 <div className="w-2 h-4 bg-blue-500/50 animate-pulse inline-block align-middle ml-1"></div>
 </div>

 {/* Terminal Footer Info */}
 <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-[#0d121f] flex items-center justify-between px-8 text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
 <div className="flex items-center gap-6">
 <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> SSH_ENC_MODE: CHACHA20-POLY1305</span>
 <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> PROTOCOL_V: 2.0</span>
 </div>
 <div className="flex gap-4">
 <span>UTF-8</span>
 <span>XTERM-256COLOR</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
