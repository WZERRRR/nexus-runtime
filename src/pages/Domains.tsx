import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
 Globe, Lock, ShieldCheck, AlertTriangle, 
 Plus, ExternalLink, RefreshCw, BarChart2,
 Zap, Settings2, Search, Filter, 
 ChevronRight, Activity, Trash2, X,
 MoreVertical, MessageSquare, Play,
 ChevronDown, LayoutGrid, Check, 
 FolderOpen, Gauge, List as ListIcon,
 ArrowLeft, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { cn } from '../lib/utils';

interface SiteData {
  id: number;
  name: string;
  remark: string;
  status: 'running' | 'paused';
  backupCount: number;
  phpVersion: string | 'Static';
  expiration: string;
  sslDays: number | null;
  requests: number | null;
  waf: boolean;
  history: { value: number }[];
}

const Sparkline = ({ data }: { data: any[] }) => (
  <div className="w-24 h-8">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#2563eb" 
          strokeWidth={1.5} 
          dot={false} 
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export function DomainsCenter() {
  const { state } = useLocation();
  const context = state?.project;
  const [items, setItems] = useState<SiteData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Modals & UI State
  const [modalType, setModalType] = useState<'none' | 'add' | 'conf' | 'log' | 'delete'>('none');
  const [activeSite, setActiveSite] = useState<SiteData | null>(null);
  const [notif, setNotif] = useState<{ id: string, type: 'success' | 'alert', text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confText, setConfText] = useState('');

  // Form State
  const [newSite, setNewSite] = useState({ name: '', remark: '', type: 'PHP', version: '8.3', port: '', rootPath: '' });

  React.useEffect(() => {
    fetchDomains();
    if (context) {
      const domainValue = context.domain || context.prodDomain;
      if (domainValue && domainValue !== 'Internal-Runtime') {
        setSearchQuery(domainValue);
        setNewSite(prev => ({ 
          ...prev, 
          name: domainValue, 
          type: context.type === 'Node.js' ? 'Node.js' : 'PHP',
          rootPath: context.runtime_path || ''
        }));
      } else if (context.name) {
        setSearchQuery(context.name.toLowerCase().replace(/\s+/g, '-'));
      }
      if(context.port) setNewSite(prev => ({...prev, port: context.port.toString()}))
    }
  }, [context]);

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/runtime/domains');
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    if (modalType === 'conf' && activeSite) {
       fetch(`/api/runtime/domains/conf?name=${activeSite.name}`)
       .then(r => r.json())
       .then(d => { if (d.success) setConfText(d.data); });
    }
  }, [modalType, activeSite]);

  const handleConfUpdate = async () => {
    if (!activeSite) return;
    setIsProcessing(true);
    try {
      await fetch('/api/runtime/domains/conf', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: activeSite.name, content: confText })
      });
      showNotif("Config updated");
      setModalType('none');
    } catch(e) {} finally { setIsProcessing(false); }
  };

  const handleGenerateSSL = async () => {
    if (!activeSite) return;
    setIsProcessing(true);
    try {
      showNotif("Requesting Let's Encrypt certificate...");
      const res = await fetch('/api/runtime/domains/ssl/renew', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: activeSite.name })
      });
      const data = await res.json();
      if(data.success) {
         showNotif(data.message);
         fetchDomains();
         setModalType('none');
      } else {
         showNotif("SSL Generation failed: " + data.message, "alert");
      }
    } catch (e){} finally { setIsProcessing(false); }
  }

  const showNotif = (text: string, type: 'success' | 'alert' = 'success') => {
    const id = `${Date.now()}`;
    setNotif({ id, text, type });
    setTimeout(() => setNotif(prev => prev?.id === id ? null : prev), 3000);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.remark.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleToggleStatus = async (item: SiteData) => {
    const newStatus = item.status === 'running' ? 'paused' : 'running';
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    try {
      await fetch('/api/runtime/domains/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, status: newStatus })
      });
      showNotif(`Site ${item.name} is now ${newStatus}`);
    } catch(e) {}
  };

  const [batchAction, setBatchAction] = useState('');

  const handleBackup = async (id: number) => {
    setIsProcessing(true);
    try {
      const site = items.find(i => i.id === id);
      if (!site) return;
      const res = await fetch('/api/runtime/domains/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: site.name })
      });
      const data = await res.json();
      if (data.success) {
        showNotif("Backup created successfully");
        fetchDomains();
      }
    } catch(e) {} finally {
      setIsProcessing(false);
    }
  };

  const handleAddSite = async () => {
    if (!newSite.name) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/runtime/domains/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSite.name, remark: newSite.remark, type: newSite.type, port: newSite.port || null, rootPath: newSite.rootPath })
      });
      const data = await res.json();
      if (data.success) {
        showNotif("Site added to infrastructure");
        setModalType('none');
        setNewSite({ name: '', remark: '', type: 'PHP', version: '8.3', port: '', rootPath: '' });
        fetchDomains();
      } else {
        showNotif(data.message || "Failed to add domain", "alert");
      }
    } catch(e) {
      showNotif("Error adding domain", "alert");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchAction = async () => {
    if (selectedIds.size === 0 || !batchAction) return;
    setIsProcessing(true);
    try {
      const names = Array.from(selectedIds).map(id => items.find(i => i.id === id)?.name).filter(Boolean);
      
      if (batchAction === 'delete') {
        await fetch('/api/runtime/domains/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ names })
        });
        showNotif(`${names.length} sites removed`);
      } else if (batchAction === 'pause' || batchAction === 'resume') {
        const status = batchAction === 'pause' ? 'paused' : 'running';
        await fetch('/api/runtime/domains/batch_toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ names, status })
        });
        showNotif(`${names.length} sites ${status}`);
      }
      
      setSelectedIds(new Set());
      setBatchAction('');
      fetchDomains();
    } catch (e) {} finally { setIsProcessing(false); }
  };

  const handleToggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(items.map(i => i.id)));
    else setSelectedIds(new Set());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] overflow-hidden rounded-[2.5rem] bg-[#1a1a1a] text-slate-700 dark:text-slate-300 font-sans relative" dir="ltr">
      
      {/* Notifications */}
      <AnimatePresence>
        {notif && (
          <motion.div 
            key={notif.id}
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              "absolute top-4 left-1/2 z-[100] px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3",
              notif.type === 'success' ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-red-500 text-white shadow-red-500/30"
            )}
          >
            {notif.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {notif.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Toolbar */}
      <div className="px-6 py-3 flex items-center justify-between bg-slate-100 dark:bg-black/40 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setModalType('add')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            Add site
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 transition-all">
            Advanced Setup
            <ChevronDown className="w-4 h-4 opacity-50" />
          </button>
          <button className="px-4 py-2 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 transition-all">
            Statistics
          </button>
          <div className="mx-2 w-px h-4 bg-slate-200 dark:bg-white/10" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-xs font-bold text-emerald-500 tracking-tight">Nginx 1.24.0</span>
             <ChevronDown className="w-3 h-3 text-emerald-500 opacity-50 rotate-90" />
          </div>
          <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors ml-2">
             <MessageSquare className="w-4 h-4" />
             Feedback
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select className="bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500/50 cursor-pointer">
             <option>All categories</option>
             <option>Production</option>
             <option>Testing</option>
          </select>
          <div className="relative group">
            <div className="flex items-center gap-3 bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2">
               <input 
                 type="text" 
                 placeholder="Domain or Remarks" 
                 className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 w-48 font-medium"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               <Search className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <button className="p-2 hover:bg-slate-200 dark:bg-white/5 rounded-lg text-slate-500 transition-colors">
             <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-[#121212]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#1a1a1a] sticky top-0 z-10 border-b border-slate-200 dark:border-white/5">
            <tr className="text-[10px] font-black font-sans uppercase tracking-[0.1em] text-slate-500">
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-white/5"
                  checked={selectedIds.size === items.length && items.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group">
                <div className="flex items-center gap-2">
                  Site name <ChevronDown className="w-3 h-3 opacity-30" />
                </div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group text-center">
                <div className="flex items-center justify-center gap-2">
                  Status <ChevronDown className="w-3 h-3 opacity-30" />
                </div>
              </th>
              <th className="px-4 py-4">Backup</th>
              <th className="px-4 py-4">Quick action</th>
              <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group">
                 <div className="flex items-center gap-2">
                   Expiration <ChevronDown className="w-3 h-3 opacity-30" />
                 </div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group text-center">
                 <div className="flex items-center justify-center gap-2">
                   SSL <ChevronDown className="w-3 h-3 opacity-30" />
                 </div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors group text-center">
                 <div className="flex items-center justify-center gap-2">
                   Requests <ChevronDown className="w-3 h-3 opacity-30" />
                 </div>
              </th>
              <th className="px-4 py-4 text-center">WAF</th>
              <th className="px-4 py-4 text-right pr-6">Operate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filteredItems.map((site, index) => (
              <tr 
                key={`${site.id}-${site.name}-${index}`}
                className={cn(
                  "group transition-all hover:bg-white/[0.02]",
                  selectedIds.has(site.id) ? "bg-blue-500/5" : ""
                )}
              >
                <td className="px-6 py-4 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-white/5"
                    checked={selectedIds.has(site.id)}
                    onChange={() => handleToggleSelect(site.id)}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className={cn("w-4 h-4", site.waf ? "text-emerald-500" : "text-slate-500")} />
                       <span className="text-xs font-black text-blue-500 hover:underline cursor-pointer">{site.name}</span>
                       <ExternalLink className="w-3 h-3 text-blue-500/50" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 mt-0.5">{site.remark}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                   <button 
                    onClick={() => handleToggleStatus(site)}
                    className={cn(
                      "p-2 rounded-full transition-all flex items-center justify-center mx-auto",
                      site.status === 'running' ? "text-emerald-500 hover:bg-emerald-500/10" : "text-amber-500 hover:bg-amber-500/10"
                    )}
                   >
                      <Play className={cn("w-4 h-4", site.status === 'running' ? "fill-emerald-500" : "fill-amber-500")} />
                   </button>
                </td>
                <td className="px-4 py-4">
                  <button 
                    onClick={() => handleBackup(site.id)}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:bg-white/5 transition-all group/btn"
                  >
                    <div className="w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded group-hover/btn:scale-110 transition-transform">
                      {site.backupCount}
                    </div>
                    <span className="text-[10px] font-bold text-red-500">Backup now</span>
                  </button>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                     <FolderOpen className="w-4 h-4 text-slate-500 hover:text-blue-400 transition-colors" />
                     <Gauge className="w-4 h-4 text-slate-500 hover:text-amber-400 transition-colors" />
                     <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{site.phpVersion}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-xs font-medium text-slate-500">{site.expiration}</td>
                <td className="px-4 py-4 text-center">
                   <span className={cn(
                     "text-xs font-bold",
                     site.sslDays ? "text-blue-500" : "text-orange-500"
                   )}>
                     {site.sslDays ? `${site.sslDays} Days` : 'Not Set'}
                   </span>
                </td>
                <td className="px-4 py-4">
                   <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{site.requests != null ? site.requests.toLocaleString() : '-'}</span>
                      {Array.isArray(site.history) && site.history.length > 0 ? <Sparkline data={site.history} /> : <span className="text-[10px] text-slate-500">لا توجد بيانات تشغيلية حالياً</span>}
                   </div>
                </td>
                <td className="px-4 py-4 text-center">
                   <span className={cn(
                     "text-[10px] font-black uppercase",
                     site.waf ? "text-blue-500" : "text-slate-500"
                   )}>
                     {site.waf ? 'Active' : 'Disabled'}
                   </span>
                </td>
                <td className="px-4 py-4 text-right pr-6">
                   <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => { setActiveSite(site); setModalType('conf'); }}
                        className="text-xs font-bold text-slate-500 hover:text-blue-500 transition-colors"
                      >
                        Conf
                      </button>
                      <button 
                        onClick={() => { setActiveSite(site); setModalType('log'); }}
                        className="text-xs font-bold text-slate-500 hover:text-blue-500 transition-colors"
                      >
                        Log
                      </button>
                      <button 
                        onClick={async () => {
                           if (confirm(`Delete ${site.name}?`)) {
                             setIsProcessing(true);
                             try {
                               await fetch('/api/runtime/domains/delete', {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ names: [site.name] })
                               });
                               showNotif(`${site.name} removed`);
                               fetchDomains();
                             } finally { setIsProcessing(false); }
                           }
                        }}
                        className="p-1.5 hover:bg-slate-200 dark:bg-white/5 rounded transition-all text-slate-600 hover:text-red-500"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Footer Bar */}
      <div className="px-6 h-16 bg-slate-100 dark:bg-black/40 border-t border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
           <input 
             type="checkbox" 
             className="w-4 h-4 rounded border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-white/5 cursor-pointer"
             checked={selectedIds.size === items.length && items.length > 0}
             onChange={(e) => handleSelectAll(e.target.checked)}
           />
           <select 
             className="bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
             value={batchAction}
             onChange={e => setBatchAction(e.target.value)}
           >
              <option value="">Please choose</option>
              <option value="delete">Bulk Delete</option>
              <option value="pause">Pause Sites</option>
              <option value="resume">Resume Sites</option>
           </select>
           <button 
            onClick={handleBatchAction}
            disabled={selectedIds.size === 0 || !batchAction}
            className="px-4 py-1.5 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500 transition-all disabled:opacity-30"
           >
             Execute
           </button>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-slate-200 dark:bg-white/5 rounded-lg border border-transparent hover:border-slate-200 dark:border-white/5 transition-all text-slate-500 opacity-30 cursor-not-allowed">
                 <ArrowLeft className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-600/20 font-black text-xs">1</button>
              <button className="p-1.5 hover:bg-slate-200 dark:bg-white/5 rounded-lg border border-transparent hover:border-slate-200 dark:border-white/5 transition-all text-slate-500 opacity-30 cursor-not-allowed">
                 <ArrowRight className="w-4 h-4" />
              </button>
           </div>
           
           <div className="flex items-center gap-3 ml-4">
              <div className="relative">
                <select className="bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase cursor-pointer outline-none">
                   <option>10 / page</option>
                   <option>50 / page</option>
                   <option>100 / page</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-600 uppercase">Goto</span>
                 <input type="text" defaultValue="1" className="w-10 h-8 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded text-center text-xs font-black text-white focus:border-blue-500/50 outline-none transition-all" />
              </div>
              <span className="text-[10px] font-black text-slate-600 ml-4 uppercase tracking-[0.2em]">Total {items.length}</span>
           </div>
        </div>
      </div>

      {/* 4. Modals */}
      <AnimatePresence>
        {/* Add Site Modal */}
        {modalType === 'add' && (
          <motion.div key="add-site-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-100 dark:bg-black/80 backdrop-blur-md px-4">
             <motion.div 
               key="add-site-modal"
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="w-full max-w-lg bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
             >
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                         <Globe className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white uppercase">Initialize Site</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Connect a domain to the Nexus Edge gateway.</p>
                      </div>
                   </div>
                   <button onClick={() => setModalType('none')} className="p-2 hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-all"><X className="w-5 h-5 text-slate-500" /></button>
                </div>

                <div className="space-y-6">
                   <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Domain Hostname</p>
                      <input 
                        className="w-full bg-transparent border-none outline-none text-white text-sm font-bold"
                        placeholder="e.g. site.example.com"
                        value={newSite.name}
                        onChange={e => setNewSite({...newSite, name: e.target.value})}
                      />
                   </div>
                   <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Internal Remark</p>
                      <input 
                        className="w-full bg-transparent border-none outline-none text-white text-sm font-bold"
                        placeholder="e.g. Landing Page Production"
                        value={newSite.remark}
                        onChange={e => setNewSite({...newSite, remark: e.target.value})}
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Runtime Type</p>
                        <select 
                          className="w-full bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 text-sm font-bold cursor-pointer"
                          value={newSite.type}
                          onChange={e => setNewSite({...newSite, type: e.target.value})}
                        >
                          <option value="PHP">PHP</option>
                          <option value="Static">Static</option>
                          <option value="Node.js">NodeJS</option>
                          <option value="Python">Python</option>
                        </select>
                     </div>
                     {newSite.type === 'Node.js' && (
                       <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Proxy Port</p>
                          <input 
                            type="number"
                            className="w-full bg-transparent border-none outline-none text-white text-sm font-bold"
                            placeholder="e.g. 3000"
                            value={newSite.port}
                            onChange={e => setNewSite({...newSite, port: e.target.value})}
                          />
                       </div>
                     )}
                     {newSite.type === 'PHP' && (
                       <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">PHP Engine</p>
                          <select 
                            className="w-full bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 text-sm font-bold cursor-pointer"
                            value={newSite.version}
                            onChange={e => setNewSite({...newSite, version: e.target.value})}
                          >
                            <option>8.3</option>
                            <option>8.2</option>
                            <option>7.4</option>
                          </select>
                       </div>
                     )}
                     {(newSite.type === 'PHP' || newSite.type === 'Static') && (
                       <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Root Path</p>
                          <input 
                            className="w-full bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 text-sm font-bold cursor-pointer"
                            placeholder="e.g. /www/wwwroot/project"
                            value={newSite.rootPath}
                            onChange={e => setNewSite({...newSite, rootPath: e.target.value})}
                          />
                       </div>
                     )}
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                        onClick={handleAddSite}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                      >
                         Confirm Deployment
                      </button>
                      <button 
                        onClick={() => setModalType('none')}
                        className="px-8 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                      >
                         Cancel
                      </button>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}

        {/* Configuration Modal */}
        {(modalType === 'conf' || modalType === 'log') && activeSite && (
          <motion.div key={`site-modal-backdrop-${activeSite.id}-${modalType}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-100 dark:bg-black/90 backdrop-blur-sm px-4">
             <motion.div 
               key={`site-modal-${activeSite.id}-${modalType}`}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-4xl bg-[#0d0d0d] border border-slate-200 dark:border-white/10 rounded-[2.5rem] flex flex-col h-[700px] shadow-2xl relative overflow-hidden"
             >
                <div className="h-16 px-8 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white/[0.02]">
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        {modalType === 'conf' ? <Settings2 className="w-5 h-5 text-blue-500" /> : <ListIcon className="w-5 h-5 text-blue-500" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{activeSite.name}</h4>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{modalType === 'conf' ? 'Nginx VHost Engine' : 'Live Request Stream'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      {modalType === 'conf' && (
                        <>
                        <button onClick={handleGenerateSSL} disabled={isProcessing} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2">
                           Generate SSL
                        </button>
                        <button onClick={handleConfUpdate} disabled={isProcessing} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2">
                           Deploy Changes
                        </button>
                        </>
                      )}
                      <button onClick={() => { setModalType('none'); setActiveSite(null); }} className="p-2 hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-all">
                        <X className="w-5 h-5 text-slate-500" />
                      </button>
                   </div>
                </div>

                <div className="flex-1 p-8 overflow-hidden">
                   <div className="h-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6 font-mono text-[12px] text-slate-600 dark:text-slate-400 overflow-y-auto no-scrollbar selection:bg-blue-500/20">
                      {modalType === 'conf' ? (
                        <textarea 
                           className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                           value={confText}
                           onChange={e => setConfText(e.target.value)}
                           spellCheck={false}
                        />
                      ) : (
                        <p className="text-slate-500 text-xs">لا توجد بيانات تشغيلية حالياً</p>
                      )}
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InsightCard({ icon, title, value, sub, trend, status, type = 'cyan' }: any) {
  return null;
}
