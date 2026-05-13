import React, { useEffect, useState } from 'react';
import { Shield, FileCheck, RefreshCw, AlertCircle, Terminal, HardDrive, Cpu, GitBranch, Link as LinkIcon, Globe, MapPin, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { runtimeAPI } from '../../services/runtimeApi';

interface RuntimeConstitutionProps {
  project: any;
  className?: string;
}

export const RuntimeConstitution: React.FC<RuntimeConstitutionProps> = ({ project, className }) => {
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManifest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await runtimeAPI.getProjectManifest(project.id, project.runtime_path || project.path);
      if (res.success) {
        setManifest(res.manifest);
      } else {
        setError(res.message || 'Manifest not found');
      }
    } catch (err) {
      setError('Failed to fetch runtime constitution');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project) {
      fetchManifest();
    }
  }, [project]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic animate-pulse">Syncing Constitution...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
        <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-tight">Identity Violation</h3>
          <p className="text-xs text-slate-500 font-bold max-w-xs uppercase">{error}</p>
        </div>
        <button 
          onClick={fetchManifest}
          className="mt-4 px-6 py-2 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
        >
          Check Isolation Engine
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-500/20">
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">NEXUS Runtime Constitution</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Single Source of Truth Manifest • v{manifest?.nexus_version || '2.0.0'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg shadow-[inset_0_1px_4px_rgba(16,185,129,0.1)]">
          <FileCheck className="w-3 h-3 text-emerald-500" />
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Manifest Synchronized</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Core Identity */}
        <div className="glass-panel p-5 border-slate-200 dark:border-white/5 rounded-2xl space-y-4 relative overflow-hidden group/card shadow-xl-ambient">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-30 transition-opacity">
            <Terminal className="w-12 h-12 text-blue-500" />
          </div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-3 h-3" /> Core Identity
          </h4>
          <div className="space-y-3">
            <ManifestItem label="Runtime UID" value={manifest?.project_id} />
            <ManifestItem label="Runtime Type" value={manifest?.runtime_type} />
            <ManifestItem label="Environment" value={manifest?.environment} />
            <ManifestItem label="Node Anchor" value={manifest?.node_id} />
          </div>
        </div>

        {/* Path Isolation */}
        <div className="glass-panel p-5 border-slate-200 dark:border-white/5 rounded-2xl space-y-4 relative overflow-hidden group/card shadow-xl-ambient">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-30 transition-opacity">
            <HardDrive className="w-12 h-12 text-emerald-500" />
          </div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <MapPin className="w-3 h-3" /> Workspace Isolation
          </h4>
          <div className="space-y-3">
            <ManifestItem label="Runtime Path" value={manifest?.runtime_path} mono highlight />
            <ManifestItem label="Workspace Root" value={manifest?.workspace_root} mono />
            <ManifestItem label="SSH Entry Context" value={manifest?.ssh_entry_path} mono />
            <ManifestItem label="Protection" value={manifest?.governance_level} highlight />
          </div>
        </div>

        {/* Git & Operational Metadata */}
        <div className="glass-panel p-5 border-slate-200 dark:border-white/5 rounded-2xl space-y-4 relative overflow-hidden group/card shadow-xl-ambient">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-30 transition-opacity">
            <GitBranch className="w-12 h-12 text-orange-500" />
          </div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Database className="w-3 h-3" /> Operational Stack
          </h4>
          <div className="space-y-3">
            <ManifestItem label="Git Branch" value={manifest?.git_branch} />
            <ManifestItem label="PM2 Process Alias" value={manifest?.pm2_process} highlight />
            <ManifestItem label="Dedicated Port" value={manifest?.runtime_port?.toString()} />
            <ManifestItem label="Last Governance Sync" value={new Date(manifest?.last_synced).toLocaleString()} />
          </div>
        </div>
      </div>

      {/* Manifest Raw View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Raw Manifest Definition</h4>
          <span className="text-[9px] text-slate-600 font-mono italic select-none">nexus.runtime.json</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 rounded-2xl p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto shadow-inner-ambient">
          <pre>{JSON.stringify(manifest, null, 2)}</pre>
        </div>
      </div>

      <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-3">
        <Shield className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Runtime Lock Warning</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed opacity-60">Any manual modification to the manifest file on the filesystem will be overwritten during the next NEXUS Governance synchronization cycle.</p>
        </div>
      </div>
    </div>
  );
};

const ManifestItem: React.FC<{ label: string; value?: string; mono?: boolean; highlight?: boolean }> = ({ label, value, mono, highlight }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">{label}</span>
    <span className={cn(
      "text-xs font-bold leading-tight truncate",
      mono ? "font-mono" : "",
      highlight ? "text-blue-400" : "text-white"
    )}>
      {value || '—'}
    </span>
  </div>
);
