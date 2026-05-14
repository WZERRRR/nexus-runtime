import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Pause, Play, Search, Download, Filter, Activity } from 'lucide-react';
import { ProjectHeader } from '../components/common/ProjectHeader';

type LogLevel = 'all' | 'info' | 'warning' | 'error' | 'success';
type StreamChannel = 'runtime' | 'pm2' | 'deploy' | 'governance' | 'errors';

type LogEntry = {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
};

const CHANNELS: StreamChannel[] = ['runtime', 'pm2', 'deploy', 'governance', 'errors'];

export function LogsCenter() {
  const { state } = useLocation();
  const context = state?.project;
  const runtimeId = String(context?.runtime_id || context?.id || '');
  const projectId = String(context?.id || '');

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<LogLevel>('all');
  const [filterService, setFilterService] = useState('all');
  const [channels, setChannels] = useState<StreamChannel[]>(['runtime']);
  const [status, setStatus] = useState<'connecting' | 'live' | 'paused' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const connect = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/runtime/logs`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus(isLive ? 'live' : 'paused');
      ws.send(JSON.stringify({
        type: 'subscribe',
        runtimeId: runtimeId || undefined,
        projectId: projectId || undefined,
        channels,
        filterLevel,
        filterService,
        search,
      }));
      if (!isLive) ws.send(JSON.stringify({ type: 'pause' }));
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'logs' && Array.isArray(payload.data)) {
        setLogs((prev) => {
          const map = new Map(prev.map((item) => [`${item.id}:${item.timestamp}:${item.service}`, item]));
          payload.data.forEach((item: LogEntry) => {
            map.set(`${item.id}:${item.timestamp}:${item.service}`, item);
          });
          return Array.from(map.values()).slice(-1500);
        });
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;
    };

    ws.onerror = () => setStatus('disconnected');
  };

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtimeId, projectId]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'filters', filterLevel, filterService, search }));
    ws.send(JSON.stringify({ type: 'subscribe', runtimeId: runtimeId || undefined, projectId: projectId || undefined, channels, filterLevel, filterService, search }));
  }, [filterLevel, filterService, search, channels, runtimeId, projectId]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (isLive) {
      ws.send(JSON.stringify({ type: 'resume' }));
      setStatus('live');
      return;
    }
    ws.send(JSON.stringify({ type: 'pause' }));
    setStatus('paused');
  }, [isLive]);

  useEffect(() => {
    if (!isLive || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs, isLive]);

  const services = useMemo(() => ['all', ...Array.from(new Set(logs.map((l) => l.service)))], [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterLevel !== 'all' && log.level !== filterLevel) return false;
      if (filterService !== 'all' && log.service !== filterService) return false;
      const haystack = `${log.message} ${log.service}`.toLowerCase();
      if (search.trim() && !haystack.includes(search.toLowerCase())) return false;
      return true;
    });
  }, [logs, filterLevel, filterService, search]);

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runtime-logs-${runtimeId || 'global'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 h-[calc(100vh-6rem)] flex flex-col" dir="rtl">
      <ProjectHeader
        projectName={context?.name}
        project={context}
        sectionName="Live Runtime Stream Console"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setIsLive((v) => !v)} className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${isLive ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
              {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isLive ? 'Pause' : 'Resume'}
            </button>
            <button onClick={exportLogs} className="p-2 rounded-lg border border-slate-200 dark:border-white/10">
              <Download className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="lg:col-span-3 space-y-3">
          <div className="glass-panel rounded-xl p-3 space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Search</label>
            <div className="flex items-center gap-2 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-2">
              <Search className="w-4 h-4 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent outline-none text-xs w-full" placeholder="message or service" />
            </div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Level</label>
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value as LogLevel)} className="w-full rounded-lg px-2 py-2 bg-slate-100 dark:bg-slate-900 text-xs">
              <option value="all">all</option>
              <option value="info">info</option>
              <option value="warning">warning</option>
              <option value="error">error</option>
              <option value="success">success</option>
            </select>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Service</label>
            <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="w-full rounded-lg px-2 py-2 bg-slate-100 dark:bg-slate-900 text-xs">
              {services.map((srv) => <option key={srv} value={srv}>{srv}</option>)}
            </select>
          </div>

          <div className="glass-panel rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase text-slate-500">Channels</span>
            </div>
            <div className="space-y-2">
              {CHANNELS.map((channel) => (
                <label key={channel} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={(e) => setChannels((prev) => e.target.checked ? [...prev, channel] : prev.filter((c) => c !== channel))}
                  />
                  {channel}
                </label>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-slate-500">Status: {status}</div>
            <div className="text-[10px] text-slate-500">Logs: {filteredLogs.length}</div>
          </div>
        </div>

        <div className="lg:col-span-9 glass-panel rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Activity className="w-4 h-4 text-emerald-500" />
              Live Tail
            </div>
            <div className="text-[10px] text-slate-500">{runtimeId ? `Runtime: ${runtimeId}` : 'Global Runtime Stream'}</div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-auto p-2 font-mono text-xs bg-[#0a0f1c]">
            {filteredLogs.length === 0 ? (
              <div className="h-full grid place-items-center text-slate-500">لا توجد بيانات تشغيلية حالياً</div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log) => (
                  <div key={`${log.id}:${log.timestamp}:${log.service}`} className="px-2 py-1 rounded border border-white/5 bg-white/[0.02]">
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()} </span>
                    <span className="text-blue-400">[{log.service}] </span>
                    <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warning' ? 'text-amber-400' : log.level === 'success' ? 'text-emerald-400' : 'text-slate-300'}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-slate-300"> {log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
