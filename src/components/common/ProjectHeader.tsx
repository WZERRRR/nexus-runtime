import React, { useState } from 'react';
import { 
  Layers, ChevronRight, ArrowLeft, RefreshCw, 
  MoreVertical, Edit3, Trash2, GitBranch, 
  Terminal, Globe, Settings, Activity, 
  ShieldCheck, X, Loader2, Database,
  Cpu, HardDrive, LayoutTemplate, Link as LinkIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { RuntimeActionBar } from '../runtime/RuntimeActionBar';
import { runtimeAPI } from '../../services/runtimeApi';

interface ProjectHeaderProps {
  projectName?: string;
  projectDescription?: string;
  environment?: string;
  branch?: string;
  sectionName: string;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  project?: any;
  onProjectUpdate?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  projectName,
  projectDescription,
  environment,
  branch,
  sectionName,
  actions,
  showBackButton = true,
  project,
  onProjectUpdate
}) => {
  const navigate = useNavigate();
  const isGlobal = !projectName;
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState<any>(null);

  const handleEditOpen = () => {
    setEditForm({
      name: project?.name || '',
      runtime_path: project?.runtime_path || project?.path || '',
      repo: project?.repo || '',
      env: project?.env || environment || 'Production',
      runtime_process: project?.runtime_process || project?.pm2?.name || '',
      port: project?.port || '',
      type: project?.type || '',
      domain: project?.domain || project?.prodDomain || ''
    });
    setIsEditModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleUpdate = async () => {
    if (!project?.id) return;
    setIsUpdating(true);
    try {
      const res = await runtimeAPI.updateProject(project.id, editForm);
      if (res.success) {
        setIsEditModalOpen(false);
        if (onProjectUpdate) onProjectUpdate();
        else window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!project?.id) return;
    if (deleteConfirmName !== project.name) return;
    
    setIsDeleting(true);
    try {
      const res = await runtimeAPI.deleteProject(project.id, project.name);
      if (res.success) {
        navigate('/projects');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAction = async (action: string, label: string) => {
    if (!project?.id) return;
    setActiveAction(action);
    try {
      const res = await runtimeAPI.performProjectAction(project.id, action, project.runtime_path || project.path);
      if (res.success) {
        setIsMenuOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex flex-col gap-4 mb-6 sm:mb-8 shrink-0 sticky top-0 z-[40] -mx-4 md:-mx-6 px-4 md:px-6 py-2 bg-[var(--bg-main)]/80 backdrop-blur-xl border-b border-white/[0.05] shadow-xl",
          isGlobal ? 'items-start' : ''
        )}
      >
      {/* Infrastructure Runtime Path Bar (Explorer Style) */}
      {!isGlobal && (
          <div className="flex flex-col md:flex-row items-center gap-3 w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-0 w-full md:w-auto md:min-w-[400px] bg-slate-100 dark:bg-black/40 backdrop-blur-md border border-white/[0.08] rounded-xl h-10 overflow-hidden shadow-inner-ambient group/path">
              {showBackButton && (
                <>
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center w-10 h-full text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all shrink-0 touch-target"
                    title="Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-6 bg-white/[0.08] shrink-0" />
                </>
              )}
              
              <div className="flex-1 flex items-center gap-2 px-3 overflow-x-auto no-scrollbar scroll-smooth">
                <button 
                  onClick={() => navigate('/projects')}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-blue-400 transition-colors shrink-0 group/root"
                >
                  <HardDrive className="w-3 h-3 opacity-40 group-hover/root:opacity-100" />
                  <span className="text-[10px] font-black uppercase tracking-widest">NEXUS</span>
                </button>
                
                <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
                
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-white text-[10px] font-black tracking-widest uppercase truncate max-w-[120px] sm:max-w-[200px]">
                    {projectName}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                </div>

                <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">
                    {environment || 'RUNTIME'}
                  </span>
                </div>
              </div>

              <div className="w-[1px] h-6 bg-white/[0.08] shrink-0" />
              
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center w-10 h-full text-slate-500 hover:text-blue-400 hover:bg-white/[0.03] transition-all shrink-0"
                title="Refresh Runtime"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {project && (
              <div className="flex-1 w-full md:w-auto relative z-20">
                <RuntimeActionBar project={project} className="!bg-transparent !p-0 !border-0" />
              </div>
            )}
          </div>
        )}

      {/* Main Header Surface */}
        <div className={cn(
          "w-full max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10",
          isGlobal ? 'w-full' : ''
        )}>
          <div className="flex items-center gap-4 w-full md:w-auto">
            {!isGlobal && (
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.05 }}
                className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner shrink-0 hidden sm:flex"
              >
                 <Layers className="w-6 h-6 text-blue-500" />
              </motion.div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase truncate">
                  {sectionName}
                </h1>
                {!isGlobal && (
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 shrink-0">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">{project?.status || 'ACTIVE'}</span>
                  </div>
                )}
              </div>
              {projectDescription && (
                <p className="text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-widest opacity-60 mt-1 truncate">
                  {projectDescription}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {actions}
            </div>

            {!isGlobal && project && (
              <div className="relative shrink-0 ml-2">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all flex items-center justify-center",
                    isMenuOpen 
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                      : "bg-slate-200 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-200 dark:bg-white/10"
                  )}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute top-full right-0 mt-2 w-64 glass-panel border-slate-200 dark:border-white/10 rounded-2xl z-50 overflow-hidden py-1 shadow-2xl"
                      >
                        <div className="px-4 py-2 border-b border-slate-200 dark:border-white/5 mb-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Project Center</span>
                        </div>
                        <button 
                          onClick={handleEditOpen}
                          className="w-full text-right px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/5 hover:text-white flex items-center gap-3 font-bold transition-all"
                        >
                          <Edit3 className="w-4 h-4 text-blue-500" /> تعديل إعدادات المشروع
                        </button>
                        <button 
                          onClick={() => { setIsMenuOpen(false); navigate('/logs', { state: { project } }); }}
                          className="w-full text-right px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/5 hover:text-white flex items-center gap-3 font-bold transition-all"
                        >
                          <Activity className="w-4 h-4 text-emerald-500" /> سجلات Governance
                        </button>
                        <button 
                          onClick={() => { handleAction('git_pull', 'Sync Project'); }}
                          className="w-full text-right px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-white/5 hover:text-white flex items-center gap-3 font-bold transition-all"
                        >
                          {activeAction === 'git_pull' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-orange-500" />}
                           إعادة مزامنة Git
                        </button>
                        
                        <div className="h-px bg-slate-200 dark:bg-white/5 my-1" />
                        
                        <button 
                          onClick={() => setIsDeleteModalOpen(true)}
                          className="w-full text-right px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-3 font-bold transition-all"
                        >
                          <Trash2 className="w-4 h-4" /> حذف المشروع نهائياً
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Edit3 className="w-6 h-6 text-blue-500" />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Edit Project Runtime</h2>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Project Name</label>
                    <input 
                      type="text" 
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Runtime Type</label>
                    <input 
                      type="text" 
                      value={editForm.type}
                      onChange={e => setEditForm({...editForm, type: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all font-bold" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Runtime Absolute Path</label>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl pr-3 overflow-hidden">
                    <Terminal className="w-4 h-4 text-slate-600" />
                    <input 
                      type="text" 
                      value={editForm.runtime_path}
                      onChange={e => setEditForm({...editForm, runtime_path: e.target.value})}
                      className="flex-1 bg-transparent p-3 text-xs text-emerald-400 focus:outline-none font-mono text-left" 
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">PM2 Process Name</label>
                    <input 
                      type="text" 
                      value={editForm.runtime_process}
                      onChange={e => setEditForm({...editForm, runtime_process: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-white focus:border-blue-500/50 outline-none transition-all font-mono text-left" 
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Dedicated Port</label>
                    <input 
                      type="text" 
                      value={editForm.port}
                      onChange={e => setEditForm({...editForm, port: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-emerald-400 focus:border-blue-500/50 outline-none transition-all font-mono text-left" 
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Git Repository URL</label>
                  <input 
                    type="text" 
                    value={editForm.repo}
                    onChange={e => setEditForm({...editForm, repo: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400 focus:border-blue-500/50 outline-none transition-all font-mono text-left" 
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Domain / SSL</label>
                  <input 
                    type="text" 
                    value={editForm.domain}
                    onChange={e => setEditForm({...editForm, domain: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-blue-400 focus:border-blue-500/50 outline-none transition-all font-mono text-left" 
                    dir="ltr"
                  />
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                  <div className="flex items-center gap-3 text-blue-400 mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Governance Settings</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold mb-4 uppercase">Any modification to core runtime paths will trigger a system discovery scan.</p>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-white/5 pt-3">
                    <span>Active Environment</span>
                    <select 
                      value={editForm.env}
                      onChange={e => setEditForm({...editForm, env: e.target.value})}
                      className="bg-transparent text-white font-black outline-none border-b border-blue-500/30 pb-0.5"
                    >
                      <option value="Production">Production</option>
                      <option value="Staging">Staging</option>
                      <option value="Development">Development</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 text-slate-500 hover:text-white transition-all text-sm font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-black transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-950/60 backdrop-blur-xl"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-panel border border-red-500/20 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-right">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center mb-6 mx-auto md:mx-0">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Dismantle Project</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-bold leading-relaxed mb-8">
                  You are about to remove <span className="text-white">"{project?.name}"</span> from the NEXUS Runtime Control.
                  <br />
                  <span className="text-red-500/80 text-[10px] uppercase font-black tracking-widest mt-2 block">Soft Delete: System files will NOT be affected.</span>
                </p>

                <div className="space-y-4 mb-8">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Type project name to confirm:</label>
                  <input 
                    type="text"
                    value={deleteConfirmName}
                    onChange={e => setDeleteConfirmName(e.target.value)}
                    placeholder={project?.name}
                    className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 outline-none font-mono text-left" 
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 py-4 bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting || deleteConfirmName !== project.name}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Dismantle
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

