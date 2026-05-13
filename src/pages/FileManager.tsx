import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  Folder, File, FileText, Search, ChevronRight, 
  ArrowLeft, RefreshCw, LayoutGrid, List, ChevronLeft,
  ChevronRight as ChevronRightIcon, Trash2, MoreVertical,
  Download, Edit2, Share2, Info, Check, X, FolderPlus, FilePlus, Settings,
  ArrowUpCircle, Save, Layers, Replace, Navigation, Type, Palette, Command, Minus, Square,
  Plus, Upload, CloudDownload, Star, Terminal, HardDrive, ShieldCheck,
  GitBranch, GitCommit, Database, Code2, History, Lock, Activity, Clock, Box,
  Maximize2, Minimize2, ExternalLink, ChevronDown
} from 'lucide-react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { runtimeAPI } from '../services/runtimeApi';
import { TextEditorModal } from '../components/TextEditorModal';

// --- Types & Config ---
interface RuntimeFile {
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  mtime?: string;
  isProtected?: boolean;
  projectType?: 'node' | 'laravel' | 'flutter' | 'web';
  markers?: string[];
}

interface OpenFile extends RuntimeFile {
  content: string;
  isDirty: boolean;
}

const PROTECTED_FILES = ['.env', 'server.ts', 'runtimePersistence.ts', 'db.ts', 'connection.ts'];

// --- Helper Components ---

function ActionItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <div className="px-3 py-1">
      <button 
        onClick={onClick}
        className="w-full flex items-center gap-4 px-4 py-2.5 hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-all text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-white group"
      >
        <div className="group-hover:scale-110 transition-transform">{icon}</div>
        <span>{label}</span>
      </button>
    </div>
  );
}

const FileIcon = ({ name, type, size = "large" }: { name: string, type: 'folder' | 'file', size?: 'large' | 'small' }) => {
  const isLarge = size === "large";
  
  if (type === 'folder') {
    return (
      <div className={cn(
        "relative flex items-center justify-center transition-transform",
        isLarge ? "w-20 h-16" : "w-8 h-8"
      )}>
        <Folder className={cn(
          "text-amber-400 fill-amber-400/20",
          isLarge ? "w-14 h-14" : "w-5 h-5"
        )} />
      </div>
    );
  }

  const ext = name.split('.').pop()?.toLowerCase();
  const getBadge = () => {
    switch(ext) {
      case 'html': return { label: 'HTML', color: 'bg-orange-600' };
      case 'json': return { label: 'JSON', color: 'bg-amber-600' };
      case 'ts':
      case 'tsx': return { label: 'TS', color: 'bg-blue-600' };
      case 'js': return { label: 'JS', color: 'bg-yellow-600' };
      case 'css': return { label: 'CSS', color: 'bg-pink-600' };
      case 'php': return { label: 'PHP', color: 'bg-indigo-600' };
      default: return null;
    }
  };

  const badge = getBadge();

  return (
    <div className={cn(
      "relative flex items-center justify-center",
      isLarge ? "w-20 h-16" : "w-8 h-8"
    )}>
       <div className={cn("relative flex flex-col items-center", isLarge ? "gap-1" : "")}>
          <File className={cn(
            "text-slate-700 dark:text-slate-300",
            isLarge ? "w-12 h-12" : "w-5 h-5 text-slate-600 dark:text-slate-400"
          )} />
          {badge && (
            <div className={cn(
              "absolute bottom-0 -mb-1 px-1.5 py-0.5 rounded-[2px] text-[7px] font-black text-white uppercase leading-none border border-slate-200 dark:border-white/10 shadow-lg",
              badge.color,
              isLarge ? "scale-100" : "scale-[0.8]"
            )}>
              {badge.label}
            </div>
          )}
       </div>
    </div>
  );
};

// --- Sub-Components ---

// --- Main Component ---

export function FileManager() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const project = state?.project;
  
  const projectRoot = project?.runtime_path || project?.environments?.[0]?.path;
  const projectId = project?.id;
  const isGlobalMode = !projectId;
  
  const [currentPath, setCurrentPath] = useState(projectId ? '.' : '/www/wwwroot');
  const [items, setItems] = useState<RuntimeFile[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeSubdirs, setIncludeSubdirs] = useState(false);
  
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [modalType, setModalType] = useState<'none' | 'newFile' | 'newFolder' | 'terminal' | 'upload'>('none');
  const [modalValue, setModalValue] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [notif, setNotif] = useState<{ id: string, type: 'success' | 'error', message: string } | null>(null);

  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle clicking outside actions menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showNotif = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random().toString();
    setNotif({ id, message, type });
    setTimeout(() => setNotif(prev => prev?.id === id ? null : prev), 3000);
  };

  const [operationalState, setOperationalState] = useState<'resolving' | 'syncing' | 'unavailable' | 'failed' | 'ready'>('resolving');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadItems = async (path: string = currentPath) => {
    setIsLoading(true);
    setOperationalState('syncing');
    setErrorMessage(null);
    try {
      const data = await runtimeAPI.listFiles(path, projectRoot, projectId);
      setItems(data.map((i: any) => ({
        ...i,
        type: i.type || (i.isDirectory ? 'folder' : 'file'), // Support both response styles
        mtime: i.mtime || i.modified,
        isProtected: PROTECTED_FILES.includes(i.name)
      })));
      setOperationalState('ready');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
      if (err.message?.includes('FILESYSTEM_') || err.message?.includes('RUNTIME_')) {
          setOperationalState('failed');
      } else {
          setOperationalState('unavailable');
      }
      showNotif("System synchronization failed: Context mismatch", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems(currentPath);
  }, [currentPath, projectRoot, projectId]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleOpenFile = async (item: RuntimeFile) => {
    if (item.type === 'folder') {
      handleNavigate(item.path);
      return;
    }
    
    const alreadyOpen = openFiles.find(f => f.path === item.path);
    if (alreadyOpen) {
      setActiveFilePath(item.path);
      return;
    }

    try {
      const data = await runtimeAPI.readFile(item.path, projectRoot, projectId);
      const newFile: OpenFile = { ...item, content: data, isDirty: false };
      setOpenFiles(prev => [...prev, newFile]);
      setActiveFilePath(item.path);
    } catch (e) {
      console.error(e);
      showNotif("Permission Denied: Core Protected", 'error');
    }
  };

  const handleGoBack = () => {
    if (isGlobalMode) {
      if (currentPath === '/') return;
      const parts = currentPath.split('/').filter(p => p !== '');
      parts.pop();
      setCurrentPath('/' + parts.join('/'));
      return;
    }
    if (currentPath === '.' || currentPath === projectRoot) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/') || '.');
  };

  const pathParts = useMemo(() => {
    if (isGlobalMode) {
      const parts = currentPath.split('/').filter(p => p !== '');
      return ['/', ...parts];
    }
    const cleanPath = currentPath === '.' ? '' : currentPath;
    const parts = cleanPath.split('/').filter(p => p !== '' && p !== '.');
    return ['Root', ...parts];
  }, [currentPath, isGlobalMode]);

  const handleBreadcrumbClick = (index: number) => {
    if (isGlobalMode) {
      if (index === 0) {
        setCurrentPath('/');
        return;
      }
      const parts = currentPath.split('/').filter(p => p !== '');
      const newPath = '/' + parts.slice(0, index).join('/');
      setCurrentPath(newPath);
      return;
    }
    
    if (index === 0) {
      setCurrentPath('.');
      return;
    }
    const cleanPath = currentPath === '.' ? '' : currentPath;
    const parts = cleanPath.split('/').filter(p => p !== '' && p !== '.');
    setCurrentPath(parts.slice(0, index).join('/'));
  };

  const joinPath = (basePath: string, name: string) => {
    const cleanName = name.replace(/^[/\\]+/, '');
    if (basePath === '.' || basePath === '') return cleanName;
    if (basePath.endsWith('/') || basePath.endsWith('\\')) return `${basePath}${cleanName}`;
    return `${basePath}/${cleanName}`;
  };

  const handleAction = async (type: string) => {
    setIsActionsMenuOpen(false);
    if (type === 'newFile') setModalType('newFile');
    else if (type === 'newFolder') setModalType('newFolder');
    else if (type === 'upload') fileInputRef.current?.click();
    else if (type === 'terminal') {
      setModalType('terminal');
      setTerminalOutput(["DevCore Terminal [Version 5.0.0]", "Type 'help' for available commands.", ""]);
    }
    else if (type === 'root') setCurrentPath(isGlobalMode ? '/www/wwwroot' : '.');
    else showNotif(`${type} functionality enabled for Production environment`);
  };

  const handleTerminalCommand = async () => {
    if (!terminalInput) return;
    const cmd = terminalInput;
    setTerminalInput('');
    setTerminalOutput(prev => [...prev, `\n> ${cmd}`]);
    
    try {
      const res = await runtimeAPI.executeTerminalCommand(cmd, currentPath, projectId);
      if (res.success && res.data) {
        if (res.data.stdout) setTerminalOutput(prev => [...prev, res.data!.stdout]);
        if (res.data.stderr) setTerminalOutput(prev => [...prev, res.data!.stderr]);
      } else {
        setTerminalOutput(prev => [...prev, res.message || "Command failed"]);
      }
    } catch (e) {
      setTerminalOutput(prev => [...prev, "System error executing command"]);
    }
  };

  const handleCreate = async () => {
    if (!modalValue) return;
    try {
      if (modalType === 'newFile') {
        const filePath = joinPath(currentPath, modalValue);
        await runtimeAPI.writeFile(filePath, '', projectRoot, projectId);
        showNotif(`File created: ${modalValue}`);
      } else if (modalType === 'newFolder') {
        const dirPath = joinPath(currentPath, modalValue);
        await runtimeAPI.createDirectory(dirPath, projectRoot, projectId);
        showNotif(`Directory created: ${modalValue}`);
      }
      loadItems();
      setModalType('none');
      setModalValue('');
    } catch (e: any) {
      showNotif(e.message, 'error');
    }
  };

  const selectedItem = useMemo(
    () => items.find(item => item.path === activeFilePath) || null,
    [items, activeFilePath]
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter(item => {
      const haystack = [
        item.name,
        item.path,
        item.type,
        ...(item.markers || []),
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [items, searchQuery]);

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const content = await file.text();
      await runtimeAPI.uploadFile(currentPath, file.name, content, projectRoot, projectId);
      showNotif(`Uploaded: ${file.name}`);
      await loadItems();
    } catch (e: any) {
      showNotif(e.message || 'Upload failed', 'error');
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedItem) {
      showNotif('Select a file or folder first', 'error');
      return;
    }

    const confirmed = window.confirm(`Delete "${selectedItem.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await runtimeAPI.deleteFiles([selectedItem.path], projectRoot, projectId);
      setOpenFiles(prev => prev.filter(file => file.path !== selectedItem.path));
      if (activeFilePath === selectedItem.path) setActiveFilePath(null);
      showNotif(`Deleted: ${selectedItem.name}`);
      await loadItems();
    } catch (e: any) {
      showNotif(e.message || 'Delete failed', 'error');
    }
  };

  const handleDownloadSelected = async () => {
    if (!selectedItem || selectedItem.type === 'folder') {
      showNotif('Select a file to download', 'error');
      return;
    }

    try {
      const content = await runtimeAPI.readFile(selectedItem.path, projectRoot, projectId);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedItem.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showNotif(`Downloaded: ${selectedItem.name}`);
    } catch (e: any) {
      showNotif(e.message || 'Download failed', 'error');
    }
  };

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput]);

  // Derived stats
  const stats = useMemo(() => {
    const foldersCount = items.filter(i => i.type === 'folder').length;
    const filesCount = items.filter(i => i.type === 'file').length;
    return { foldersCount, filesCount };
  }, [items]);

  const activeFile = useMemo(() => openFiles.find(f => f.path === activeFilePath) || null, [openFiles, activeFilePath]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] overflow-hidden rounded-[2.5rem] bg-[#121212] text-slate-700 dark:text-slate-300 relative" dir="ltr">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadFile} />
      
      {/* Notifications */}
      <AnimatePresence>
        {notif && (
          <motion.div 
            key={notif.id}
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 10, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={cn(
              "absolute top-4 left-1/2 z-[200] px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3",
              notif.type === 'success' ? "bg-emerald-500 text-white shadow-emerald-500/30" : "bg-red-500 text-white shadow-red-500/30"
            )}
          >
            {notif.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            {notif.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header & Path Explorer */}
      <div className="px-6 py-4 flex items-center gap-4 bg-slate-100 dark:bg-black/40 border-b border-slate-200 dark:border-white/5 relative z-50">
        <button 
          onClick={handleGoBack}
          className="p-2 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-lg border border-slate-200 dark:border-white/10 transition-all text-blue-500 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center gap-1 bg-slate-100 dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-1.5 overflow-x-auto no-scrollbar shadow-inner group">
            {pathParts.map((part, i) => (
              <React.Fragment key={i}>
                 <button 
                   onClick={() => handleBreadcrumbClick(i)}
                   className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-white transition-colors shrink-0 px-1 py-0.5 rounded hover:bg-slate-200 dark:bg-white/5"
                 >
                   {part}
                 </button>
                 {i < pathParts.length - 1 && <ChevronRight className="w-3 h-3 text-slate-700 shrink-0 mx-1" />}
              </React.Fragment>
            ))}
           <div className="flex-1" />
           <button 
             onClick={() => loadItems()}
             className="p-1 hover:bg-slate-200 dark:bg-white/10 rounded transition-all opacity-40 group-hover:opacity-100"
           >
             <RefreshCw className={cn("w-3.5 h-3.5 text-slate-600 dark:text-slate-400", isLoading && "animate-spin")} />
           </button>
        </div>

        <div className="flex items-center gap-3">
           {/* Context Mode Indicator */}
           <div className={cn(
             "px-4 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-inner transition-all duration-300",
             isGlobalMode 
               ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
               : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
           )}>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isGlobalMode ? "bg-amber-500" : "bg-emerald-500")} />
              {isGlobalMode ? "Infrastructure Mode" : "Runtime Mode"}
           </div>

           <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-1.5 min-w-[280px]">
              <input 
                type="text" 
                placeholder="Search Files" 
                className="bg-transparent border-none outline-none text-xs text-white w-full font-bold"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="mx-2 w-px h-3 bg-slate-200 dark:bg-white/10" />
              <label className="flex items-center gap-2 cursor-pointer">
                 <input 
                   type="checkbox" 
                   className="w-3 h-3 rounded border-slate-200 dark:border-white/20 bg-slate-200 dark:bg-white/5 accent-blue-600" 
                   checked={includeSubdirs} 
                   onChange={e => setIncludeSubdirs(e.target.checked)} 
                 />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter whitespace-nowrap">Include subdir</span>
              </label>
              <button className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-all ml-2 shadow-lg shadow-blue-600/20">
                 <Search className="w-3.5 h-3.5 text-white" />
              </button>
           </div>
        </div>
      </div>

      {/* 2. Actions & Utility Row */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-[#121212] z-40">
         <div className="flex items-center gap-4">
            <div className="relative" ref={actionsMenuRef}>
               <button 
                 onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                 className={cn(
                   "flex items-center gap-3 px-5 py-2.5 bg-blue-900/10 hover:bg-blue-900/20 text-blue-400 rounded-xl border transition-all text-xs font-black uppercase tracking-tight",
                   isActionsMenuOpen ? "border-blue-500/50 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "border-blue-500/20"
                 )}
               >
                  <Layers className="w-4 h-4" />
                  File Operations
                  <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isActionsMenuOpen && "rotate-180")} />
               </button>

               <AnimatePresence>
                 {isActionsMenuOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute top-full left-0 mt-2 w-64 bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2"
                   >
                     <ActionItem icon={<Upload className="w-4 h-4 text-blue-500" />} label="Upload" onClick={() => handleAction('upload')} />
                     <ActionItem icon={<CloudDownload className="w-4 h-4 text-cyan-500" />} label="Remote Download" onClick={() => handleAction('remote')} />
                     <div className="px-3 py-1">
                       <button className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-all text-xs font-bold group">
                         <div className="flex items-center gap-4">
                           <Plus className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                           <span className="text-slate-700 dark:text-slate-300 group-hover:text-white">New</span>
                         </div>
                         <ChevronRightIcon className="w-3.5 h-3.5 text-slate-600" />
                       </button>
                       {/* Submenu for New could be added here, but simplicity first */}
                       <div className="pl-12 flex flex-col gap-1 mt-1">
                          <button onClick={() => handleAction('newFile')} className="text-[10px] text-slate-500 hover:text-emerald-400 font-bold uppercase transition-colors tracking-widest px-2 py-1">File</button>
                          <button onClick={() => handleAction('newFolder')} className="text-[10px] text-slate-500 hover:text-emerald-400 font-bold uppercase transition-colors tracking-widest px-2 py-1">Directory</button>
                       </div>
                     </div>
                     <ActionItem icon={<Search className="w-4 h-4 text-amber-500" />} label="Search File Content" onClick={() => handleAction('search')} />
                     <ActionItem icon={<Star className="w-4 h-4 text-yellow-500" />} label="Favorite" onClick={() => handleAction('fav')} />
                     <ActionItem icon={<Share2 className="w-4 h-4 text-purple-500" />} label="Share List" onClick={() => handleAction('share')} />
                     <ActionItem icon={<Terminal className="w-4 h-4 text-slate-600 dark:text-slate-400" />} label="Terminal" onClick={() => handleAction('terminal')} />
                     <div className="my-1 border-t border-slate-200 dark:border-white/5 mx-4" />
                     <ActionItem icon={<HardDrive className="w-4 h-4 text-indigo-500" />} label="Root Directory" onClick={() => handleAction('root')} />
                     <ActionItem icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />} label="File/Dir protection" onClick={() => handleAction('protect')} />
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1">Current Context</span>
               <div className="flex items-center gap-2 px-3 py-1 bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg">
                  <div className={cn("w-1.5 h-1.5 rounded-full", isGlobalMode ? "bg-amber-500 shadow-sm dark:shadow-[0_0_5px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-sm dark:shadow-[0_0_5px_rgba(16,185,129,0.5)]")} />
                  <span className="text-[10px] font-bold text-white uppercase">{isGlobalMode ? "Global Infrastructure" : project.name}</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadSelected}
              className="px-6 py-2.5 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2"
            >
               <Download className="w-4 h-4" />
               Download
            </button>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-white/5 hover:bg-red-500/10 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-red-400 transition-all font-black text-[10px] uppercase tracking-widest"
            >
               <Trash2 className="w-4 h-4" />
               Delete
            </button>

            <div className="mx-2 w-px h-6 bg-slate-200 dark:bg-white/10" />

            <div className="flex bg-slate-100 dark:bg-black/60 p-1.5 rounded-xl border border-slate-200 dark:border-white/10">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={cn(
                   "p-2 rounded-lg transition-all",
                   viewMode === 'grid' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-600 hover:text-slate-600 dark:text-slate-400"
                 )}
               >
                  <LayoutGrid className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={cn(
                   "p-2 rounded-lg transition-all",
                   viewMode === 'list' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-600 hover:text-slate-600 dark:text-slate-400"
                 )}
               >
                  <List className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>

      {/* 3. Main Explorer Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#121212]">
        <AnimatePresence mode="wait">
          {operationalState === 'resolving' || operationalState === 'syncing' ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-4 py-20"
            >
               <RefreshCw className="w-12 h-12 text-blue-500 animate-spin opacity-20" />
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-700">
                  {operationalState === 'resolving' 
                    ? (isGlobalMode ? 'Loading Infrastructure Filesystem...' : 'Resolving Runtime Context...') 
                    : (isGlobalMode ? 'Scanning Directories...' : 'Synchronizing Live Files...') }
               </p>
            </motion.div>
          ) : operationalState === 'unavailable' || operationalState === 'failed' ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-6 py-20 text-center"
            >
               <div className="w-20 h-20 bg-red-500/10 rounded-3xl border border-red-500/20 flex items-center justify-center">
                  <HardDrive className="w-8 h-8 text-red-500 opacity-80" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">
                     {operationalState === 'failed' ? 'Filesystem binding failed' : 'Runtime filesystem unavailable'}
                  </h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold max-w-md mx-auto mb-4">
                     {errorMessage || "The runtime context mapping is broken or the directory does not exist on the node."}
                  </p>
               </div>
               <button 
                  onClick={() => loadItems()} 
                  className="px-6 py-2.5 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all border border-slate-200 dark:border-white/10"
               >
                  Retry Synchronization
               </button>
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-4 py-20"
            >
               <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                  <Folder className="w-6 h-6 text-slate-600" />
               </div>
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">
                  {isGlobalMode ? "Global Infrastructure Root is Empty" : "Runtime Directory is Empty"}
               </p>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-6 gap-y-12"
            >
              {filteredItems.map(item => (
                <button 
                  key={item.path}
                  onDoubleClick={() => handleOpenFile(item)}
                  onClick={() => setActiveFilePath(item.path)}
                  className={cn(
                    "group flex flex-col items-center gap-3 p-3 rounded-2xl transition-all relative outline-none",
                    activeFilePath === item.path ? "bg-blue-600/20 border border-blue-500/30 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10" : "border border-transparent hover:bg-white/[0.03]"
                  )}
                >
                  <FileIcon name={item.name} type={item.type} size="large" />
                  
                  {/* Status/Marker Indicators */}
                  {item.markers && (
                    <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                      {item.markers.map(marker => (
                        <span key={`${item.path}-${marker}`} className="text-[7px] font-black px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/10 uppercase tracking-tighter">
                          {marker}
                        </span>
                      ))}
                    </div>
                  )}

                  <span className={cn(
                    "text-[11px] font-bold text-center break-all line-clamp-2 px-1 transition-colors duration-300",
                    activeFilePath === item.path ? "text-blue-400" : "text-slate-600 dark:text-slate-400 group-hover:text-white"
                  )}>
                    {item.name}
                  </span>
                  
                  {item.isProtected && (
                    <div className="absolute top-2 right-2 p-1 bg-red-500/20 rounded-lg text-red-500 scale-75 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Lock className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="list"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-slate-100 dark:bg-black/40 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl"
            >
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white/[0.04] border-b border-slate-200 dark:border-white/5">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Name</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Size</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Modified</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                     {filteredItems.map(item => (
                       <tr 
                          key={item.path}
                          onDoubleClick={() => handleOpenFile(item)}
                          onClick={() => setActiveFilePath(item.path)}
                          className={cn(
                            "group cursor-pointer transition-all outline-none",
                            activeFilePath === item.path ? "bg-blue-600/10" : "hover:bg-white/[0.02]"
                          )}
                       >
                          <td className="px-8 py-4 flex items-center gap-4">
                             <FileIcon name={item.name} type={item.type} size="small" />
                             <div className="flex items-center gap-2">
                               <span className={cn(
                                 "text-xs font-bold transition-colors",
                                 activeFilePath === item.path ? "text-blue-400" : "text-slate-700 dark:text-slate-300 group-hover:text-white"
                               )}>{item.name}</span>
                               {item.isProtected && <Lock className="w-3 h-3 text-red-500/50" />}
                               {item.markers && (
                                 <div className="flex items-center gap-1.5 ml-3">
                                   {item.markers.map(marker => (
                                     <span key={`${item.path}-${marker}`} className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/10 uppercase tracking-tighter">
                                       {marker}
                                     </span>
                                   ))}
                                 </div>
                               )}
                             </div>
                          </td>
                          <td className="px-8 py-4 text-right font-mono text-[10px] text-slate-500">
                             {item.size ? `${(item.size / 1024).toFixed(1)} KB` : '--'}
                          </td>
                          <td className="px-8 py-4 text-right font-mono text-[10px] text-slate-600">
                             {item.mtime || '2024-05-12 17:25'}
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Modals (New File/Folder/Terminal) */}
      <AnimatePresence>
        {modalType !== 'none' && (
          <motion.div key="file-modal" className="fixed inset-0 z-[150] flex items-center justify-center p-8 bg-slate-100 dark:bg-black/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className={cn(
                 "bg-[#1a1a1a] border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden",
                 modalType === 'terminal' ? "w-full max-w-4xl h-[600px]" : "w-full max-w-lg"
               )}
            >
               {modalType === 'terminal' ? (
                 <div className="flex flex-col h-full gap-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <Terminal className="w-5 h-5 text-blue-500" />
                          <h3 className="text-sm font-black text-white uppercase tracking-widest">Root Terminal Access</h3>
                       </div>
                       <button onClick={() => setModalType('none')} className="p-2 hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-all">
                          <X className="w-5 h-5 text-slate-500" />
                       </button>
                    </div>
                    
                    <div className="flex-1 bg-slate-100 dark:bg-black/60 rounded-2xl border border-slate-200 dark:border-white/5 p-6 font-mono text-xs overflow-y-auto custom-scrollbar text-blue-400">
                       {terminalOutput.map((line, i) => (
                         <div key={i} className="whitespace-pre-wrap">{line}</div>
                       ))}
                       <div ref={terminalEndRef} />
                    </div>

                    <div className="flex items-center gap-4 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2">
                       <span className="text-blue-500 font-bold">$</span>
                       <input 
                         type="text" 
                         className="bg-transparent border-none outline-none text-xs text-white w-full font-mono"
                         value={terminalInput}
                         onChange={(e) => setTerminalInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleTerminalCommand()}
                         placeholder="Enter command..."
                         autoFocus
                       />
                    </div>
                 </div>
               ) : (
                 <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                             {modalType === 'newFile' ? <FilePlus className="w-6 h-6 text-emerald-500" /> : <FolderPlus className="w-6 h-6 text-emerald-500" />}
                          </div>
                          <div>
                             <h3 className="text-lg font-black text-white uppercase tracking-tight">Create {modalType === 'newFile' ? 'New File' : 'Directory'}</h3>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Path: {currentPath}</p>
                          </div>
                       </div>
                       <button onClick={() => setModalType('none')} className="p-2 hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-all">
                          <X className="w-5 h-5 text-slate-500" />
                       </button>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Entity Name</label>
                       <input 
                         type="text" 
                         className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-blue-500/50 outline-none transition-all"
                         placeholder={modalType === 'newFile' ? "example.ts" : "new_folder"}
                         value={modalValue}
                         onChange={(e) => setModalValue(e.target.value)}
                         autoFocus
                         onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                       />
                    </div>

                    <div className="flex gap-4 pt-4">
                       <button 
                         onClick={handleCreate}
                         className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                       >
                          Finalize Creation
                       </button>
                       <button 
                         onClick={() => setModalType('none')}
                         className="px-8 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                       >
                          Abort
                       </button>
                    </div>
                 </div>
               )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Footer: Pagination & Stats */}
      <div className="px-6 h-16 bg-slate-100 dark:bg-black/60 border-t border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span>Total {stats.foldersCount} directories, {stats.filesCount} files</span>
            <div className="mx-2 w-px h-3 bg-slate-200 dark:bg-white/5" />
            <button className="text-blue-500 hover:text-blue-400 transition-colors uppercase font-black tracking-widest">Calculate Size</button>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <button className="p-2 bg-slate-200 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 opacity-30 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4 scale-x-[-1]" />
               </button>
               <button className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/30 text-xs font-black">1</button>
               <button className="p-2 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-xl border border-slate-200 dark:border-white/10 transition-all">
                  <ChevronRightIcon className="w-4 h-4 translate-x-px" />
               </button>
            </div>

            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-white/10 pl-6">
               <div className="relative group">
                  <button className="px-4 py-2 bg-slate-200 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                     100 / page
                     <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                  </button>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Goto</span>
                  <input type="text" defaultValue="1" className="w-12 h-9 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-center text-xs font-black text-white focus:border-blue-500/50 outline-none transition-all shadow-inner" />
               </div>
               <span className="text-[10px] font-black text-slate-600 ml-4 uppercase tracking-[0.2em]">Total {items.length}</span>
            </div>
         </div>
      </div>

      {/* Editor Modal Overlay (If file is open) */}
      <AnimatePresence>
        {openFiles.length > 0 && (
          <TextEditorModal
            openFiles={openFiles}
            setOpenFiles={setOpenFiles}
            activeFilePath={activeFilePath}
            setActiveFilePath={setActiveFilePath}
            onClose={() => {
              setOpenFiles([]);
              setActiveFilePath(null);
            }}
            projectRoot={projectRoot}
            projectId={projectId}
            currentDirPath={currentPath}
            directoryItems={items}
            onNavigate={handleNavigate}
            onLoadItems={loadItems}
            onOpenFileDescendant={handleOpenFile}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

function ToolbarBtn({ icon, label, onClick, disabled }: { icon: React.ReactNode, label: string, onClick?: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest",
        disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function QuickAction({ icon, label, sub }: { icon: React.ReactNode, label: string, sub: string }) {
  return (
    <div className="p-5 rounded-3xl bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-blue-500/20 hover:bg-blue-500/5 transition-all cursor-pointer group text-left">
      <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <div className="text-slate-500 group-hover:text-blue-400 transition-colors">{icon}</div>
      </div>
      <p className="text-[11px] font-black text-white uppercase tracking-tight mb-1">{label}</p>
      <p className="text-[9px] font-medium text-slate-600 uppercase tracking-widest">{sub}</p>
    </div>
  );
}
