import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { 
  X, Square, Minus, Check, Layers, RefreshCw, Search, FileText, 
  Navigation, Type, Palette, Settings, Command, Folder, File, 
  ChevronRight, ArrowUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { runtimeAPI } from '../services/runtimeApi';

interface OpenFile {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
}

interface RuntimeFile {
  name: string;
  type: 'file' | 'folder';
  path: string;
}

interface TextEditorModalProps {
  openFiles: OpenFile[];
  setOpenFiles: React.Dispatch<React.SetStateAction<OpenFile[]>>;
  activeFilePath: string | null;
  setActiveFilePath: (path: string | null) => void;
  onClose: () => void;
  projectRoot: string;
  projectId?: string;
  currentDirPath: string;
  directoryItems: RuntimeFile[];
  onNavigate: (path: string) => void;
  onLoadItems: (path: string) => void;
  onOpenFileDescendant: (item: RuntimeFile) => void;
}

export function TextEditorModal({
  openFiles, setOpenFiles, activeFilePath, setActiveFilePath, onClose,
  projectRoot, projectId, currentDirPath, directoryItems, onNavigate, onLoadItems, onOpenFileDescendant
}: TextEditorModalProps) {
  const activeFile = openFiles.find(f => f.path === activeFilePath);
  const isMaskedSensitiveFile = activeFile?.content?.trim?.() === '*** MASKED SENSITIVE FILE ***';
  
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [diffMode, setDiffMode] = useState(false);
  const [editorWarning, setEditorWarning] = useState<string | null>(null);
  const [language, setLanguage] = useState('plaintext');
  const isLargeFile = (activeFile?.content?.length || 0) > 1024 * 512;
  

  const mapLanguageFromPath = (filePath?: string) => {
    if (!filePath) return 'plaintext';
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.ts')) return 'typescript';
    if (lower.endsWith('.tsx')) return 'typescript';
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
    if (lower.endsWith('.json')) return 'json';
    if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'yaml';
    if (lower.endsWith('.env')) return 'shell';
    if (lower.endsWith('.sql')) return 'sql';
    if (lower.endsWith('.php')) return 'php';
    if (lower.endsWith('.md')) return 'markdown';
    if (lower.endsWith('.dart')) return 'dart';
    return 'plaintext';
  };

  useEffect(() => {
    setLanguage(mapLanguageFromPath(activeFile?.path));
    if (isMaskedSensitiveFile) {
      setEditorWarning('Sensitive file is masked and read-only by governance.');
    } else if (isLargeFile) {
      setEditorWarning('Large file protection enabled. Diff mode may impact performance.');
    } else {
      setEditorWarning(null);
    }
  }, [activeFile?.path, isMaskedSensitiveFile, isLargeFile]);

  const handleSave = async (filePath: string) => {
    const file = openFiles.find(f => f.path === filePath);
    if (!file) return;
    if (file.content.trim() === '*** MASKED SENSITIVE FILE ***') {
      console.error('Sensitive masked files cannot be written.');
      return;
    }
    if (file.path.toLowerCase().endsWith('.json')) {
      try {
        JSON.parse(file.content);
      } catch {
        console.error('Invalid JSON syntax');
        return;
      }
    }
    try {
      await runtimeAPI.writeFile(file.path, file.content, projectRoot, projectId);
      setOpenFiles(prev => prev.map(f => f.path === filePath ? { ...f, isDirty: false, originalContent: f.content } : f));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAll = async () => {
    for (const file of openFiles) {
      if (file.isDirty) {
        await handleSave(file.path);
      }
    }
  };

  const closeTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(f => f.path !== path);
    setOpenFiles(newOpenFiles);
    if (path === activeFilePath) {
      setActiveFilePath(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].path : null);
    }
  };

  if (!activeFilePath && openFiles.length === 0) return null;

  return createPortal(
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 z-[9999] bg-slate-100 dark:bg-black/50 sm:p-6 lg:p-8 flex items-center justify-center backdrop-blur-sm"
    >
      <div className="w-full max-w-[1600px] h-full max-h-[92vh] bg-[#1e1e1e] rounded-2xl shadow-sm dark:shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-slate-200 dark:border-white/20 font-sans">
        
        {/* Title Bar */}
        <div className="h-8 bg-[#323233] flex items-center justify-between select-none border-b border-slate-200 dark:border-white/5">
          <div className="flex-1 flex items-center px-4">
            <span className="text-xs text-slate-700 dark:text-slate-300">Online Text Editor</span>
          </div>
          <div className="flex bg-[#323233]">
            <button className="w-11 h-8 flex items-center justify-center hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors">
              <Minus className="w-4 h-4" />
            </button>
            <button className="w-11 h-8 flex items-center justify-center hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors hidden sm:flex">
              <Square className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="w-11 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white text-slate-600 dark:text-slate-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-10 bg-[#252526] border-b border-black flex items-center px-2 overflow-x-auto no-scrollbar shrink-0 shadow-md">
          <ToolbarBtn icon={<Check className="w-3.5 h-3.5" />} label="Save" onClick={() => activeFilePath && handleSave(activeFilePath)} />
          <ToolbarBtn icon={<Layers className="w-3.5 h-3.5" />} label="Save All" onClick={handleSaveAll} />
          <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-2" />
          <ToolbarBtn icon={<RefreshCw className="w-3.5 h-3.5" />} label="Refresh" onClick={() => activeFile && handleSave(activeFile.path)} />
          <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-2" />
          <ToolbarBtn icon={<Search className="w-3.5 h-3.5" />} label="Search" />
          <ToolbarBtn icon={<FileText className="w-3.5 h-3.5" />} label={diffMode ? "Diff On" : "Diff Off"} onClick={() => setDiffMode(v => !v)} />
          <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-2" />
          <ToolbarBtn icon={<Navigation className="w-3.5 h-3.5" />} label="Jump Line" />
          <ToolbarBtn icon={<Type className="w-3.5 h-3.5" />} label="Font Size" />
          <ToolbarBtn icon={<Palette className="w-3.5 h-3.5" />} label="Theme" />
          <ToolbarBtn icon={<Settings className="w-3.5 h-3.5" />} label="Settings" />
          <ToolbarBtn icon={<Command className="w-3.5 h-3.5" />} label="Shortcuts" />
        </div>

        {/* Main Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-64 bg-[#252526] border-r border-[#1a1a1a] flex flex-col max-w-[30%] shrink-0">
            <div className="px-3 py-2 border-b border-[#333] flex items-center overflow-x-auto no-scrollbar whitespace-nowrap">
              <span className="text-[12px] text-slate-700 dark:text-slate-300">Directory: {currentDirPath}</span>
            </div>
            <div className="flex items-center gap-1 p-1.5 border-b border-[#333] bg-[#2d2d2d]">
              <SidebarBtn icon={<ArrowUp className="w-3.5 h-3.5" />} label="Up" onClick={() => {
                const parts = currentDirPath.split('/');
                parts.pop();
                onNavigate(parts.join('/') || '.');
              }} />
              <SidebarBtn icon={<RefreshCw className="w-3.5 h-3.5" />} label="Refresh" onClick={() => onLoadItems(currentDirPath)} />
              <SidebarBtn icon={<Square className="w-3.5 h-3.5" />} label="New" />
              <SidebarBtn icon={<Search className="w-3.5 h-3.5" />} label="Search" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
              {directoryItems.map((item) => (
                <div 
                  key={item.path} 
                  onClick={() => onOpenFileDescendant(item)}
                  className="flex items-center gap-2 px-4 py-1 hover:bg-[#37373d] cursor-pointer text-[#cccccc]"
                >
                  {item.type === 'folder' ? (
                    <Folder className="w-[14px] h-[14px] text-amber-500 fill-amber-500/20 shrink-0" />
                  ) : (
                    <File className="w-[14px] h-[14px] text-[#cccccc] shrink-0" />
                  )}
                  <span className="text-[13px] truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0 shadow-inner">
            {/* Tabs */}
            <div className="flex bg-[#252526] overflow-x-auto custom-scrollbar shrink-0 h-9">
              {openFiles.map(file => {
                const isActive = file.path === activeFilePath;
                return (
                  <div 
                    key={file.path}
                    onClick={() => setActiveFilePath(file.path)}
                    className={cn(
                      "h-full flex items-center justify-between px-3 min-w-[120px] max-w-[200px] cursor-pointer group select-none transition-colors border-r border-[#1a1a1a]",
                      isActive ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500" : "bg-[#2d2d2d] text-slate-600 dark:text-slate-400 hover:bg-[#2b2b2b] border-t-2 border-t-transparent pt-[2px]"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <File className="w-3.5 h-3.5 shrink-0 text-slate-600 dark:text-slate-400" />
                      <span className="text-[12px] truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-1 pl-2">
                      {file.isDirty && <div className="w-2 h-2 rounded-full bg-white opacity-40 shrink-0" />}
                      <button 
                        onClick={(e) => closeTab(e, file.path)}
                        className={cn(
                          "p-0.5 rounded hover:bg-slate-200 dark:bg-white/10 transition-opacity flex items-center justify-center -mr-1",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Text Area */}
            {activeFile ? (
              <div className="flex-1 flex overflow-hidden bg-[#1e1e1e] relative">
                <div className="absolute top-2 right-3 z-10">
                  {editorWarning && <span className="text-[10px] font-bold text-amber-400">{editorWarning}</span>}
                </div>
                {diffMode && !isLargeFile ? (
                  <DiffEditor
                    original={activeFile.originalContent}
                    modified={activeFile.content}
                    language={language}
                    theme="vs-dark"
                    height="100%"
                    options={{
                      readOnly: isMaskedSensitiveFile,
                      renderSideBySide: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                    }}
                    onChange={(value) => {
                      if (typeof value !== 'string' || isMaskedSensitiveFile) return;
                      setOpenFiles(prev =>
                        prev.map(f => (f.path === activeFilePath ? { ...f, content: value, isDirty: value !== f.originalContent } : f))
                      );
                    }}
                  />
                ) : (
                  <Editor
                    value={activeFile.content}
                    language={language}
                    theme="vs-dark"
                    height="100%"
                    options={{
                      readOnly: isMaskedSensitiveFile,
                      minimap: { enabled: false },
                      fontSize: 13,
                      automaticLayout: true,
                      wordWrap: 'on',
                    }}
                    onChange={(value) => {
                      if (typeof value !== 'string' || isMaskedSensitiveFile) return;
                      setOpenFiles(prev =>
                        prev.map(f => (f.path === activeFilePath ? { ...f, content: value, isDirty: value !== f.originalContent } : f))
                      );
                    }}
                    onMount={(editor) => {
                      editor.onDidChangeCursorPosition((evt) => {
                        setCursorPos({ line: evt.position.lineNumber, col: evt.position.column });
                      });
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500">
                <div>
                  <Square className="w-16 h-16 opacity-10 mx-auto mb-4" />
                  <p>Select a file to edit</p>
                </div>
              </div>
            )}
            
            {/* Status Bar */}
            <div className="h-7 bg-[#252526] hover:bg-[#333333] text-white flex items-center justify-between px-3 text-[11px] select-none shrink-0 cursor-default border-t border-[#1a1a1a]">
              <div className="flex items-center space-x-4">
                <span>File: {activeFilePath || 'No file selected'}</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-4 text-slate-700 dark:text-slate-300 h-full">
                <span className="hover:bg-slate-200 dark:bg-white/10 px-2 h-full flex items-center cursor-pointer">LF</span>
                <span className="hover:bg-slate-200 dark:bg-white/10 px-2 h-full flex items-center cursor-pointer">Ln {cursorPos.line}, Col {cursorPos.col}</span>
                <span className="hover:bg-slate-200 dark:bg-white/10 px-2 h-full flex items-center cursor-pointer whitespace-nowrap">History: 0</span>
                <span className="hover:bg-slate-200 dark:bg-white/10 px-2 h-full flex items-center cursor-pointer whitespace-nowrap">Tab: 4</span>
                <span className="hover:bg-slate-200 dark:bg-white/10 px-2 h-full flex items-center cursor-pointer whitespace-nowrap hidden sm:flex">Encoding: ascii</span>
                <span className="hover:bg-slate-200 dark:bg-white/10 px-2 h-full flex items-center cursor-pointer whitespace-nowrap hidden sm:flex">Language: Text</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

function ToolbarBtn({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#3f3f46] text-[#cccccc] transition-colors text-[12px] rounded h-8 whitespace-nowrap"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SidebarBtn({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1.5 hover:bg-[#3f3f46] text-slate-700 dark:text-slate-300 transition-colors text-[11px] rounded"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
