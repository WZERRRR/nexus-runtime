import React, { useState, useEffect } from 'react';
import { Folders, Plus, Github, Globe, Server, Code2, Link as LinkIcon, CheckCircle2, ChevronDown, MoreVertical, LayoutTemplate, X, Edit, Trash2, Settings, Layers, FolderOpen, Database, TerminalSquare, Activity, GitBranch, Terminal, FolderTree, ShieldCheck, RefreshCw, Loader2, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { RuntimeErrorAlert } from '../components/common/RuntimeErrorAlert';
import { runtimeAPI } from '../services/runtimeApi';

const INITIAL_PROJECTS = [
 {
 id: 1,
 name: 'DevCore Plus API',
 type: 'Laravel API',
 repo: 'devcore/api-core',
 prodDomain: 'api.devcore.com',
 environments: [
 { name: 'LIVE', branch: 'main', status: 'online', version: 'v2.4.0', lastDeploy: '2 hours ago', path: '/var/www/api-live' },
 { name: 'STAGING', branch: 'staging', status: 'online', version: 'v2.5.0-rc', lastDeploy: '1 day ago', path: '/var/www/api-staging' },
 { name: 'DEV', branch: 'develop', status: 'online', version: 'v2.5.x-dev', lastDeploy: '15 mins ago', path: '/var/www/api-dev' },
 ]
 },
 {
 id: 2,
 name: 'DevCore Admin Panel',
 type: 'Next.js Frontend',
 repo: 'devcore/admin-frontend',
 prodDomain: 'admin.devcore.com',
 environments: [
 { name: 'LIVE', branch: 'main', status: 'online', version: 'v1.8.2', lastDeploy: '5 days ago', path: '/var/www/admin-live' },
 { name: 'DEV', branch: 'develop', status: 'online', version: 'v1.9.0-dev', lastDeploy: '1 hour ago', path: '/var/www/admin-dev' },
 ]
 },
 {
 id: 3,
 name: 'DevCore WebSockets',
 type: 'Node.js Socket.IO',
 repo: 'devcore/wss-server',
 prodDomain: 'ws.devcore.com',
 environments: [
 { name: 'LIVE', branch: 'main', status: 'online', version: 'v1.2.0', lastDeploy: '10 days ago', path: '/var/www/wss-live' },
 ]
 }
];

export function Projects() {
 const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState<'provision' | 'import'>('provision');
  const [discoveryPath, setDiscoveryPath] = useState('/www/wwwroot');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredProject, setDiscoveredProject] = useState<any>(null);
  
  const [provisioningState, setProvisioningState] = useState<'idle' | 'auth' | 'clone' | 'deps' | 'ready'>('idle');
  const [provisioningForm, setProvisioningForm] = useState({ name: '', type: 'react', server: 'srv1', env: 'node20', repo: '', domain: '', token: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetProject, setTargetProject] = useState<any>(null);
 const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isAddEnvModalOpen, setIsAddEnvModalOpen] = useState<{projectId: string | number | null, open: boolean}>({projectId: null, open: false});
 const [toast, setToast] = useState<{ id: string, message: string, type: 'success' | 'error'} | null>(null);

 const [projects, setProjects] = useState<typeof INITIAL_PROJECTS>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [error, setError] = useState<string | null>(null);

  const fetchProjectsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await runtimeAPI.getProjects();
      const normalized = (data || []).map((p: any) => ({
        ...p,
        prodDomain: p.domain || p.prodDomain || 'Internal-Runtime',
        environments: p.environments || [
          { 
            name: p.env || 'PROD', 
            branch: p.git_branch || 'main', 
            status: p.status || 'online', 
            version: 'v1.0.0', 
            lastDeploy: 'Just Imported', 
            path: p.runtime_path || '/var/www/runtime'
          }
        ]
      }));
      setProjects(normalized.length > 0 ? normalized : INITIAL_PROJECTS);
    } catch (err) {
      setError('فشل مزامنة المشاريع. يرجى التحقق من الخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsData();
  }, []);

 const showToast = (message: string, type: 'success' | 'error' = 'success') => {
   const id = Date.now() + Math.random().toString();
   setToast({ id, message, type });
   setTimeout(() => setToast(prev => prev?.id === id ? null : prev), 3000);
 };

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProject?.id) return;
    setIsUpdating(true);
    try {
      // Ensure the domain field is correctly mapped for the backend
      const payload = {
        ...targetProject,
        domain: targetProject.prodDomain // Sync the UI field with DB field
      };
      const res = await runtimeAPI.updateProject(targetProject.id, payload);
      if (res.success) {
        setIsEditModalOpen(false);
        showToast('تم تحديث إعدادات المشروع بنجاح');
        fetchProjectsData();
      }
    } catch (err) {
      showToast('فشل تحديث المشروع', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!targetProject?.id) return;
    if (deleteConfirmName !== targetProject.name) return;
    setIsDeleting(true);
    try {
      const res = await runtimeAPI.deleteProject(targetProject.id, targetProject.name);
      if (res.success) {
        setIsDeleteModalOpen(false);
        showToast('تم حذف المشروع من نظام المزامنة (Soft Delete)');
        fetchProjectsData();
      }
    } catch (err) {
      showToast('فشل حذف المشروع', 'error');
    } finally {
      setIsDeleting(false);
    }
  };
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError(null);
    try {
      await fetchProjectsData();
      showToast('تم تحديث قائمة المشاريع ومزامنة الحالة حالياً');
    } catch (err) {
      setError('فريق العمل التقني يعمل على حل المشكلة، يرجى المحاولة لاحقاً.');
      showToast('تعذر استرداد البيانات التشغيلية', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDiscover = async () => {
    if (!discoveryPath) {
      showToast('يرجى تحديد مسار للمشروع', 'error');
      return;
    }
    setIsDiscovering(true);
    setDiscoveredProject(null);
    try {
      const res = await runtimeAPI.discoverProject(discoveryPath);
      if (res.success) {
        setDiscoveredProject(res.data);
        showToast('تم تحليل المشروع بنجاح');
      } else {
        showToast(res.message || 'المسار غير موجود أو لا يحتوي على بنية مشروع معترف بها', 'error');
      }
    } catch (e) {
      showToast('خطأ أثناء محاولة استكشاف المسار', 'error');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImport = async () => {
    if (!discoveredProject) return;
    setIsDiscovering(true);
    try {
      const res = await runtimeAPI.importProject({
        name: discoveredProject.name,
        path: discoveredProject.runtime_path,
        type: discoveredProject.type,
        git: { branch: discoveredProject.git_detected ? 'main' : undefined },
        pm2: { name: discoveredProject.pm2_suggested_name, status: 'online' }
      });

      if (res.success) {
        showToast('تم استيراد المشروع وربطه بنجاح في NEXUS Runtime');
        setIsAddModalOpen(false);
        setAddModalTab('provision');
        setDiscoveredProject(null);
        fetchProjectsData();
      } else {
        showToast(res.message || 'فشل استيراد المشروع', 'error');
      }
    } catch (e) {
      showToast('خطأ فني أثناء الاستيراد', 'error');
    } finally {
      setIsDiscovering(false);
    }
  };

 const handleProvisionProject = async () => {
    if (!provisioningForm.name || !provisioningForm.repo) {
       showToast('يرجى إدخال اسم المشروع ورابط المستودع', 'error');
       return;
    }
    setProvisioningState('auth');
    try {
       await runtimeAPI.provisionProject(provisioningForm);
       
       // Simulate steps for UI progression
       setTimeout(() => setProvisioningState('clone'), 1500);
       setTimeout(() => setProvisioningState('deps'), 3500);
       setTimeout(() => {
          setProvisioningState('ready');
          setTimeout(() => {
             setIsAddModalOpen(false);
             setProvisioningState('idle');
             setProvisioningForm({ name: '', type: 'react', server: 'srv1', env: 'node20', repo: '', domain: '', token: '' });
             showToast('تم تهيئة بيئة التشغيل للمشروع بنجاح.');
             handleRefresh();
          }, 2000);
       }, 6000);

    } catch (e: any) {
       showToast(e.message || 'فشل التكوين', 'error');
       setProvisioningState('idle');
    }
 };

 return (
 <div className="space-y-8 pb-12 relative">
 <AnimatePresence>
 {toast && (
 <motion.div 
 key={toast.id}
 initial={{ opacity: 0, y: -20, x: '-50%' }}
 animate={{ opacity: 1, y: 20, x: '-50%' }}
 exit={{ opacity: 0, y: -20, x: '-50%' }}
 className={`fixed top-4 left-1/2 z-[150] px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 font-bold text-sm backdrop-blur-md ${
 toast.type === 'success' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
 }`}
 >
 <ShieldCheck className="w-5 h-5" />
 {toast.message}
 </motion.div>
 )}
 </AnimatePresence>

 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex flex-col md:flex-row md:items-center justify-between gap-4"
 >
 <div>
 <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
 <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-500/20">
 <Folders className="w-8 h-8 text-blue-400" />
 </div>
 مركز إدارة المشاريع
 </h1>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 font-medium max-w-2xl leading-relaxed pr-1">
 نظام متكامل لإدارة مستودعات الكود، النطاقات، وبيئات التشغيل المختلفة لمشاريعك البرمجية باحترافية كاملة.
 </p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={handleRefresh}
 disabled={isRefreshing || isLoading}
 className="px-5 py-2.5 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-sm font-bold shadow-sm flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
 >
 <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
 تحديث الحالة
 </button>
 <button 
 onClick={() => setIsAddModalOpen(true)}
 disabled={isLoading}
 className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 disabled:hover:scale-100 group"
 >
 <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
 إضافة مشروع جديد
 </button>
 </div>
 </motion.div>

 <RuntimeErrorAlert 
 error={error} 
 onRetry={handleRefresh} 
 title="فشل مزامنة المشاريع التشغيلية"
 />

 <div className="grid grid-cols-1 gap-8">
 <AnimatePresence mode="wait">
 {isLoading ? (
 Array.from({ length: 2 }).map((_, idx) => (
 <motion.div 
 key={`project-skeleton-${idx}`}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0 }}
 className="glass-panel rounded-2xl overflow-hidden group"
 >
 <div className="bg-white dark:bg-slate-900/40 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-6 w-full">
 <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse shrink-0"></div>
 <div className="flex-1 space-y-3">
 <div className="h-6 bg-slate-200 dark:bg-white/5 rounded-md w-1/3 animate-pulse"></div>
 <div className="flex gap-2">
 <div className="h-6 bg-slate-200 dark:bg-white/5 rounded-md w-24 animate-pulse"></div>
 <div className="h-6 bg-slate-200 dark:bg-white/5 rounded-md w-32 animate-pulse"></div>
 </div>
 </div>
 </div>
 </div>
 <div className="bg-slate-50 dark:bg-slate-950/40 px-6 py-4 border-b border-t border-slate-200 dark:border-white/5">
 <div className="flex gap-3">
 {Array.from({ length: 5 }).map((_, i) => (
 <div key={i} className="h-10 w-28 bg-slate-200 dark:bg-white/5 rounded-xl animate-pulse"></div>
 ))}
 </div>
 </div>
 <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {Array.from({ length: 2 }).map((_, i) => (
 <div key={i} className="h-48 rounded-2xl bg-slate-200 dark:bg-white/5 animate-pulse"></div>
 ))}
 </div>
 </motion.div>
 ))
 ) : projects.length === 0 ? (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="w-full p-12 flex flex-col items-center justify-center text-center glass-panel rounded-2xl border-dashed border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/20"
 >
 <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
 <Folders className="w-8 h-8 text-blue-400" />
 </div>
 <h3 className="text-xl font-black text-white mb-2 tracking-tight">لا توجد مشاريع تشغيلية حالياً</h3>
 <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mb-8 font-medium leading-relaxed">قم بتهيئة مشروعك الأول للبدء في إدارة بيئات النشر، قواعد البيانات، وعمليات السيرفر.</p>
 <button 
 onClick={() => setIsAddModalOpen(true)}
 className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)]"
 >
 <Plus className="w-4.5 h-4.5" /> هندسة مشروع جديد
 </button>
 </motion.div>
 ) : (
 projects.map((project, idx) => (
 <motion.div 
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: idx * 0.1, duration: 0.4 }}
 key={project.id} 
 className="glass-panel rounded-2xl overflow-hidden group"
 >
  <div className="bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/10 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
    {/* Decorative background element with enhanced glow and slower animation */}
    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/[0.04] blur-[120px] -translate-y-1/2 translate-x-1/3 rounded-full transition-all duration-1000 pointer-events-none"></div>
    
    <div className="flex flex-col md:flex-row items-start md:items-center gap-5 relative z-10 w-full lg:w-auto">
      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/10 text-blue-400 shadow-xl shrink-0 group-hover:scale-105 transition-transform duration-500">
        {project.type.includes('API') ? <Code2 className="w-8 h-8" /> : <LayoutTemplate className="w-8 h-8" />}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors truncate drop-shadow-sm">{project.name}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-1.5 shadow-sm text-xs uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5" />
            {project.type}
          </span>
          
          <span className={cn(
            "font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 shadow-sm transition-all text-[10px] uppercase tracking-widest",
            project.env === 'Production Runtime' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
            project.env === 'Development Runtime' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
            project.env === 'UNVERIFIED RUNTIME' ? "bg-red-500/10 border-red-500/20 text-red-400" :
            project.env === 'Backup Runtime' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
            project.env === 'Snapshot Runtime' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
            project.env === 'Recovery Runtime' ? "bg-orange-500/10 border-orange-500/20 text-orange-400" :
            project.env === 'Archived Runtime' ? "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400" :
            "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400"
          )}>
            <Activity className="w-3.5 h-3.5" />
            {(project.env?.toUpperCase() || 'UNVERIFIED RUNTIME').includes('PRODUCTION') ? 'LIVE PRODUCTION' : 
             project.env === 'Backup Runtime' ? 'BACKUP SNAPSHOT' :
             project.env === 'Recovery Runtime' ? 'ROLLBACK RESTORE POINT' :
             project.env === 'Development Runtime' ? 'DEV ENVIRONMENT' :
             project.env === 'Snapshot Runtime' ? 'SNAPSHOT RUNTIME' :
             project.env === 'Archived Runtime' ? 'ARCHIVED RUNTIME' :
             (project.env?.toUpperCase() || 'UNVERIFIED RUNTIME')
            }
          </span>

          <span className="bg-slate-100 dark:bg-slate-800/80 text-blue-300 font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-1.5 shadow-sm text-[10px]">
            <Server className="w-3.5 h-3.5 text-blue-500/50" />
            {project.runtime_host || '187.124.190.79'}
          </span>

          <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-1.5 shadow-sm text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            {project.runtime_type === 'external-vps' ? 'VPS' : 'RUNTIME'}
          </span>

          <span className="flex items-center gap-1.5 text-slate-500 font-bold text-xs bg-slate-200 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 hover:text-slate-700 dark:text-slate-300 transition-colors">
            <Github className="w-3.5 h-3.5 opacity-70" />
            {project.repo}
          </span>
        </div>
      </div>
    </div>
    
    <div className="flex items-center gap-3 relative z-10 justify-end w-full lg:w-auto">
      <button 
        onClick={() => setIsAddEnvModalOpen({ projectId: project.id, open: true })}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] active:scale-95 group/add"
      >
        <Plus className="w-4 h-4 group-hover/add:rotate-90 transition-transform duration-300" />
        إضافة بيئة
      </button>
      <div className="relative z-[20]">
        <button 
          onClick={() => setActiveDropdown(activeDropdown === project.id ? null : project.id)}
          className="p-3 text-slate-600 dark:text-slate-400 hover:text-white transition-all bg-slate-200 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:bg-white/10 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95 cursor-pointer"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        <AnimatePresence>
          {activeDropdown === project.id && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute top-full left-0 mt-3 w-56 glass-panel border-slate-200 dark:border-white/10 rounded-xl z-[100] overflow-hidden p-1.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
            >
              <button 
                onClick={() => {
                  setActiveDropdown(null);
                  setTargetProject(project);
                  setIsEditModalOpen(true);
                }}
                className="w-full text-right px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-600/20 hover:text-white flex items-center gap-3 font-bold rounded-lg transition-all cursor-pointer group/item"
              >
                <div className="p-1.5 bg-blue-500/10 rounded-md group-hover/item:bg-blue-500/20 transition-colors">
                  <Edit className="w-4 h-4 text-blue-400" />
                </div>
                تعديل الإعدادات
              </button>
              <button 
                onClick={() => {
                  setActiveDropdown(null);
                  setTargetProject(project);
                  setDeleteConfirmName('');
                  setIsDeleteModalOpen(true);
                }}
                className="w-full text-right px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3 font-bold rounded-lg transition-all mt-1 cursor-pointer group/item"
              >
                <div className="p-1.5 bg-red-500/10 rounded-md group-hover/item:bg-red-500/20 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                حذف المشروع
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>

  <div className="bg-slate-50 dark:bg-slate-950/60 px-6 md:px-8 py-5 border-b border-slate-200 dark:border-white/5">
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <button 
        onClick={() => navigate('/files', { state: { project: project } })}
        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-white dark:bg-slate-900/40 hover:bg-emerald-500/5 text-slate-600 dark:text-slate-400 hover:text-emerald-400 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-emerald-500/20 transition-all font-bold text-xs group/btn shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] active:scale-95"
      >
        <FolderOpen className="w-5 h-5 text-emerald-500" />
        الملفات
      </button>
      <button 
        onClick={() => navigate('/database', { state: { project: project } })}
        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-white dark:bg-slate-900/40 hover:bg-orange-500/5 text-slate-600 dark:text-slate-400 hover:text-orange-400 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-orange-500/20 transition-all font-bold text-xs group/btn shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] active:scale-95"
      >
        <Database className="w-5 h-5 text-orange-500" />
        قواعد البيانات
      </button>
      <button 
        onClick={() => navigate('/servers', { state: { project: project } })}
        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-white dark:bg-slate-900/40 hover:bg-sky-500/5 text-slate-600 dark:text-slate-400 hover:text-sky-400 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-sky-500/20 transition-all font-bold text-xs group/btn shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] active:scale-95"
      >
        <Server className="w-5 h-5 text-sky-500" />
        السيرفرات
      </button>
      <button 
        onClick={() => navigate('/domains', { state: { project: project } })}
        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-white dark:bg-slate-900/40 hover:bg-blue-500/5 text-slate-600 dark:text-slate-400 hover:text-blue-400 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-blue-500/20 transition-all font-bold text-xs group/btn shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] active:scale-95"
      >
        <Globe className="w-5 h-5 text-blue-500" />
        النطاقات و SSL
      </button>
      <button 
        onClick={() => navigate('/pm2', { state: { project: project } })}
        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-white dark:bg-slate-900/40 hover:bg-purple-500/5 text-slate-600 dark:text-slate-400 hover:text-purple-400 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-purple-500/20 transition-all font-bold text-xs group/btn shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] active:scale-95"
      >
        <Layers className="w-5 h-5 text-purple-500" />
        عمليات PM2
      </button>
      <button 
        onClick={() => navigate('/infrastructure', { state: { project: project } })}
        className="flex flex-col items-center justify-center gap-2 px-3 py-4 bg-white dark:bg-slate-900/40 hover:bg-indigo-500/5 text-slate-600 dark:text-slate-400 hover:text-indigo-400 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/20 transition-all font-bold text-xs group/btn shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] active:scale-95"
      >
        <FolderTree className="w-5 h-5 text-indigo-500" />
        تنظيم السيرفر
      </button>
    </div>
  </div>

 <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
 {project.environments.map(env => (
 <motion.div 
 whileHover={{ y: -4 }}
 key={`${project.id}-${env.name}`} 
 className={`p-6 rounded-[1.5rem] border bg-white dark:bg-slate-900/40 relative overflow-hidden group/env hover:bg-slate-100 dark:bg-slate-800/60 transition-all duration-300 ${
 env.name === 'LIVE' ? 'border-red-500/10 hover:border-red-500/30' :
 env.name === 'STAGING' ? 'border-orange-500/10 hover:border-orange-500/30' :
 'border-blue-500/10 hover:border-blue-500/30'
 } shadow-xl ring-1 ring-white/5`}
 >
 {/* Background glow refinement */}
 <div className={`absolute -top-12 -right-12 w-40 h-40 blur-[60px] opacity-10 transition-opacity group-hover/env:opacity-30 pointer-events-none ${
 env.name === 'LIVE' ? 'bg-red-500' : env.name === 'STAGING' ? 'bg-orange-500' : 'bg-blue-500'
 }`}></div>
 
 <div className="flex justify-between items-center mb-5 relative z-10">
 <div className="flex items-center gap-2.5">
 <span className={`w-2.5 h-2.5 rounded-full ${
 env.name === 'LIVE' ? 'bg-red-500 animate-pulse shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.8)]' :
 env.name === 'STAGING' ? 'bg-orange-500' : 'bg-blue-500'
 }`}></span>
 <span className={`font-black uppercase tracking-widest text-sm ${
 env.name === 'LIVE' ? 'text-red-400' :
 env.name === 'STAGING' ? 'text-orange-400' : 'text-blue-400'
 }`}>{env.name}</span>
 </div>
 <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 bg-slate-50 dark:bg-slate-950/80 rounded-md text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 shadow-inner">
 <GitBranch className="w-3.5 h-3.5 text-slate-500" />
 {env.branch}
 </span>
 </div>

 <div className="space-y-4 relative z-10 pr-1">
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-500 font-medium tracking-tight">الحالة التشغيلية</span>
 <span className="flex items-center gap-1.5 text-green-400 font-bold bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20 text-xs shadow-sm">
 <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
 </span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-500 font-medium tracking-tight">نسخة البناء</span>
 <span className="text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-950/60 px-2 py-1 rounded border border-slate-200 dark:border-white/5 text-xs shadow-sm">{env.version}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-500 font-medium tracking-tight">آخر نشر (Deploy)</span>
 <span className="text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900/60 rounded border border-slate-200 dark:border-white/5">
 <Activity className="w-3 h-3 text-slate-500" />
 {env.lastDeploy}
 </span>
 </div>
 </div>

 <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10 flex flex-col gap-3 relative z-10">
 <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl group-hover/env:bg-slate-50 dark:bg-slate-950/80 transition-colors border border-slate-200 dark:border-white/5 shadow-inner">
 <TerminalSquare className="w-4 h-4 text-slate-600 shrink-0" />
 <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate" title={env.path}>
 {env.path}
 </span>
 </div>
 <button 
 onClick={() => navigate('/environments', { state: { project: project } })}
 className="w-full text-xs hover:bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 font-bold border border-slate-200 dark:border-white/10 shadow-sm active:scale-95"
 >
 <Settings className="w-3.5 h-3.5" />
 إدارة بيئة الـ {env.name}
 </button>
 </div>
 </motion.div>
 ))}
 </div>
 </motion.div>
 ))
 )}
 </AnimatePresence>
 </div>

 <AnimatePresence>
 {isAddModalOpen && (
 <motion.div key="add-project-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
 onClick={() => setIsAddModalOpen(false)}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-2xl glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
 >
 <div className="flex items-center justify-between p-7 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50">
 <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
 <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
 <Plus className="w-6 h-6 text-blue-500" />
 </div>
 هندسة مشروع جديد
 </h2>
 <button 
 onClick={() => setIsAddModalOpen(false)}
 className="p-2 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-all"
 >
 <X className="w-6 h-6" />
 </button>
 </div>

 {/* Tabs Header */}
 <div className="flex bg-white dark:bg-slate-900/30 p-1 mx-7 mt-4 rounded-xl border border-slate-200 dark:border-white/5 shrink-0">
   <button 
     onClick={() => setAddModalTab('provision')}
     className={cn(
       "flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2",
       addModalTab === 'provision' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
     )}
   >
     <LayoutTemplate className="w-3.5 h-3.5" />
     تأسيس (Provision)
   </button>
   <button 
     onClick={() => setAddModalTab('import')}
     className={cn(
       "flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2",
       addModalTab === 'import' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
     )}
   >
     <FolderTree className="w-3.5 h-3.5" />
     استيراد من السيرفر
   </button>
 </div>

 <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 relative">
 <AnimatePresence mode="wait">
 {addModalTab === 'provision' && (
    provisioningState === 'idle' ? (
    <motion.div key="form" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0, position: 'absolute', pointerEvents: 'none'}} className="space-y-8 min-w-full">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">اسم المشروع التجاري</label>
 <input 
 type="text" 
 value={provisioningForm.name}
 onChange={e => setProvisioningForm({...provisioningForm, name: e.target.value})}
 placeholder="مثال: DevCore Admin" 
 className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
 />
 </div>
 
 <div className="space-y-2">
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">هيكلية التطبيق (Type)</label>
 <select value={provisioningForm.type} onChange={e => setProvisioningForm({...provisioningForm, type: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold">
 <option value="react">Vite + React (Frontend)</option>
 <option value="nextjs">Next.js (Fullstack/Auth)</option>
 <option value="laravel">Laravel PHP (Backend API)</option>
 <option value="nodejs">Node.js Express (Service)</option>
 <option value="other">محرك برمجي آخر</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">السيرفر المستضيف</label>
 <select value={provisioningForm.server} onChange={e => setProvisioningForm({...provisioningForm, server: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium">
 <option value="srv1">Main Cloud Node (192.168.1.10)</option>
 <option value="srv2">Regional Cluster (192.168.1.11)</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">بيئة التشغيل (Environment)</label>
 <select value={provisioningForm.env} onChange={e => setProvisioningForm({...provisioningForm, env: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium">
 <option value="node20">Node.js v20.12.x (LTS)</option>
 <option value="php83">PHP 8.3 + FPM</option>
 <option value="docker">Dockerized Instance</option>
 </select>
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
 مستودع الكود (Repository) 
 <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 rounded-full border border-emerald-500/20">Auto-Detect</span>
 </label>
 <div className="flex gap-2">
 <div className="relative flex-1">
 <Github className="w-4.5 h-4.5 text-slate-500 absolute top-1/2 -translate-y-1/2 right-4" />
 <input 
 type="text" 
 value={provisioningForm.repo}
 onChange={e => setProvisioningForm({...provisioningForm, repo: e.target.value})}
 placeholder="Organization / Repository-name" 
 className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pr-11 pl-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
 />
 </div>
 <select className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold">
 <option value="github">GitHub</option>
 <option value="gitlab">GitLab</option>
 </select>
 </div>
 <div className="relative mt-3">
 <Key className="w-4.5 h-4.5 text-slate-500 absolute top-1/2 -translate-y-1/2 right-4" />
 <input 
 type="password" 
 value={provisioningForm.token}
 onChange={e => setProvisioningForm({...provisioningForm, token: e.target.value})}
 placeholder="Runtime Secret Token / SSH Key (Optional for Public Repos)" 
 className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pr-11 pl-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono text-left"
 dir="ltr"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">النطاق الأساسي للإنتاج (Domain)</label>
 <div className="relative">
 <Globe className="w-4.5 h-4.5 text-slate-500 absolute top-1/2 -translate-y-1/2 right-4" />
 <input 
 type="text" 
 value={provisioningForm.domain}
 onChange={e => setProvisioningForm({...provisioningForm, domain: e.target.value})}
 placeholder="e.g., app.yourdomain.com" 
 className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pr-11 pl-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all text-left font-mono"
 dir="ltr"
 />
 </div>
 </div>

 <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
 <h4 className="text-sm font-black text-blue-400 mb-3 uppercase tracking-wider flex items-center gap-2">
 <Activity className="w-4 h-4" /> بروتوكول التأسيس
 </h4>
 <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 pr-1 font-medium">
 <li className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div>
 سيتم إنشاء نظام النشر التلقائي (CI/CD) لبيئة الـ LIVE بشكل فوري.
 </li>
 <li className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div>
 سيتم ربط مدير الملفات وقواعد البيانات بمجلدات التشغيل تلقائياً.
 </li>
 <li className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div>
 إعدادات الأمان وجدران الحماية سيتم تطبيقها بناءً على نوع المشروع المختار.
 </li>
 </ul>
 </div>
 </motion.div>
 ) : (
 <motion.div key="provisioning" initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="flex flex-col items-center justify-center py-8 min-w-full">
 <div className="relative mb-8">
 <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
 <div className="w-24 h-24 bg-white dark:bg-slate-900 border-2 border-blue-500/50 rounded-3xl flex items-center justify-center relative z-10 shadow-sm dark:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
 {provisioningState === 'ready' ? (
 <CheckCircle2 className="w-12 h-12 text-emerald-400 drop-shadow-sm dark:shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
 ) : (
 <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
 )}
 </div>
 </div>
 <h3 className="text-2xl font-black text-white mb-6">جاري تهيئة بيئة التشغيل ...</h3>
 
 <div className="w-full max-w-sm space-y-4">
 <div className="flex items-center gap-4">
 <div className={`w-3 h-3 rounded-full ${provisioningState !== 'idle' ? 'bg-emerald-500 shadow-sm dark:shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`}></div>
 <span className={`text-sm font-bold ${provisioningState !== 'idle' ? 'text-white' : 'text-slate-500'}`}>Git Runtime Authentication</span>
 </div>
 <div className="flex items-center gap-4">
 <div className={`w-3 h-3 rounded-full ${['clone','deps','ready'].includes(provisioningState) ? 'bg-emerald-500 shadow-sm dark:shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`}></div>
 <span className={`text-sm font-bold ${['clone','deps','ready'].includes(provisioningState) ? 'text-white' : 'text-slate-500'}`}>Cloning Repository</span>
 </div>
 <div className="flex items-center gap-4">
 <div className={`w-3 h-3 rounded-full ${['deps','ready'].includes(provisioningState) ? 'bg-emerald-500 shadow-sm dark:shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`}></div>
 <span className={`text-sm font-bold ${['deps','ready'].includes(provisioningState) ? 'text-white' : 'text-slate-500'}`}>Installing Dependencies</span>
 </div>
 <div className="flex items-center gap-4">
 <div className={`w-3 h-3 rounded-full ${['ready'].includes(provisioningState) ? 'bg-emerald-500 shadow-sm dark:shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`}></div>
 <span className={`text-sm font-bold ${['ready'].includes(provisioningState) ? 'text-white' : 'text-slate-500'}`}>Runtime Initialization & Deploy</span>
 </div>
 </div>

 <p className="text-xs text-slate-500 font-mono mt-8 uppercase tracking-widest text-center max-w-[280px]">
 {provisioningState === 'auth' && 'Validating repository access and structure...'}
 {provisioningState === 'clone' && 'Downloading repository into workspace...'}
 {provisioningState === 'deps' && 'Preparing runtime and resolving packages...'}
 {provisioningState === 'ready' && 'Project is operational.'}
 </p>
 </motion.div>
 )
 )}
 </AnimatePresence>
 </div>

 <div className="p-8 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 flex flex-col sm:flex-row justify-end gap-4 shrink-0 transition-all">
 <button 
 onClick={() => {
 setIsAddModalOpen(false);
 setProvisioningState('idle');
 }}
 disabled={provisioningState !== 'idle'}
 className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
 >
 تجاهل العملية
 </button>
 <button 
 onClick={handleProvisionProject}
 disabled={provisioningState !== 'idle'}
 className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-black transition-all shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] active:scale-95 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
 >
 {provisioningState === 'idle' ? 'تأكيد التشغيل وتهيئة النظام' : (
 <>
 <Loader2 className="w-4 h-4 animate-spin" /> جاري التجهيز...
 </>
 )}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {isAddEnvModalOpen.open && (
 <motion.div key="add-env-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
 onClick={() => setIsAddEnvModalOpen({projectId: null, open: false})}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-lg glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
 >
 <div className="flex items-center justify-between p-7 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50">
 <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
 <div className="p-2 bg-pink-600/10 rounded-xl border border-pink-500/20">
 <Layers className="w-6 h-6 text-pink-500" />
 </div>
 إضافة بيئة عمل
 </h2>
 <button 
 onClick={() => setIsAddEnvModalOpen({projectId: null, open: false})}
 className="p-2 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-all"
 >
 <X className="w-6 h-6" />
 </button>
 </div>

 <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
 <div className="space-y-4">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">مسمى البيئة</label>
 <input 
 type="text" 
 placeholder="e.g., Staging, Testing, Preview" 
 className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-all font-bold"
 />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">الفرع المخصص (Git Branch)</label>
 <input 
 type="text" 
 placeholder="e.g., development" 
 className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-all font-mono"
 />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">النطاق الفرعي (Subdomain)</label>
 <div className="flex gap-2">
 <input 
 type="text" 
 placeholder="test" 
 className="flex-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-all text-left font-mono"
 dir="ltr"
 />
 <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl px-4 text-xs text-slate-600 dark:text-slate-400 flex items-center font-bold">
 .devcore.com
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="p-8 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 flex justify-end gap-4 shrink-0">
 <button 
 onClick={() => setIsAddEnvModalOpen({projectId: null, open: false})}
 className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-white rounded-xl transition-all text-sm font-bold"
 >
 إلغاء
 </button>
 <button 
 onClick={() => {
 setIsAddEnvModalOpen({projectId: null, open: false});
 showToast('جاري إنشاء بيئة العمل الجديدة...');
 }}
 className="bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-xl text-sm font-black transition-all shadow-[0_15px_30px_-10px_rgba(236,72,153,0.4)] active:scale-95"
 >
 تأكيد الإنشاء
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
  </AnimatePresence>

  {/* Edit Project Modal */}
  <AnimatePresence>
    {isEditModalOpen && targetProject && (
      <motion.div key="edit-project-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
          onClick={() => setIsEditModalOpen(false)}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-7 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50">
            <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Edit className="w-6 h-6 text-blue-500" />
              </div>
              تعديل إعدادات المشروع: {targetProject.name}
            </h2>
            <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 text-right font-sans">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Runtime Name</label>
                <input 
                  type="text" 
                  value={targetProject.name} 
                  onChange={(e) => setTargetProject({ ...targetProject, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-blue-500/50 transition-all font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">App Type</label>
                <input 
                  type="text" 
                  value={targetProject.type} 
                  onChange={(e) => setTargetProject({ ...targetProject, type: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-blue-500/50 transition-all font-bold" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Production Domain</label>
              <input 
                type="text" 
                value={targetProject.prodDomain} 
                onChange={(e) => setTargetProject({ ...targetProject, prodDomain: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-blue-500/50 transition-all font-mono" 
                dir="ltr" 
              />
            </div>

            <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <h4 className="text-xs font-black text-blue-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> سياسات الانتشار الذكي
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span>النشر التلقائي عند الدفع للفرع الأساسي</span>
                  <div className="w-10 h-5 bg-blue-600 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span>تفعيل الحماية المتقدمة WAF</span>
                  <div className="w-10 h-5 bg-blue-600 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 flex justify-end gap-4">
            <button 
              onClick={() => setIsEditModalOpen(false)} 
              className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-white rounded-xl transition-all text-sm font-bold"
              disabled={isUpdating}
            >
              تجاهل
            </button>
            <button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ التغييرات
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Delete Project Modal */}
  <AnimatePresence>
    {isDeleteModalOpen && targetProject && (
      <motion.div key="delete-project-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
          onClick={() => setIsDeleteModalOpen(false)}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg glass-panel border border-red-500/20 bg-white dark:bg-slate-900/90 rounded-[2rem] shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">حذف المشروع التشغيلي</h3>
                <p className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest mt-1">DANGEROUS: PROJECT DESTRUCTION</p>
              </div>
            </div>

            <div className="space-y-4 bg-red-500/5 border border-red-500/10 p-5 rounded-2xl text-right">
              <p className="text-sm font-bold text-red-200/80 leading-relaxed">أنت على وشك حذف مشروع <span className="text-white font-black">{targetProject.name}</span> بالبرمجيات المرتبطة به.</p>
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-red-400/70">
                  <div className="w-1 h-1 rounded-full bg-red-500" /> سيتم إيقاف كافة بيئات العمل (LIVE, STAGING, DEV).
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-red-400/70">
                  <div className="w-1 h-1 rounded-full bg-red-500" /> سيتم حذف إعدادات النطاقات و SSL المرتبطة.
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-red-400/70">
                  <div className="w-1 h-1 rounded-full bg-red-500" /> الحذف لا رجعة فيه.
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4 text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">اكتب اسم المشروع للتأكيد النهائي:</p>
              <input 
                type="text" 
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={targetProject.name} 
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500/50 transition-all outline-none font-mono" 
              />
            </div>
          </div>

          <div className="p-8 border-t border-red-500/10 bg-red-500/5 flex justify-end gap-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:text-white rounded-xl transition-all text-sm font-bold">إلغاء</button>
            <button 
              onClick={handleDelete} 
              disabled={deleteConfirmName !== targetProject.name || isDeleting}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              تأكيد الحذف النهائي
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
 </div>
 );
}
