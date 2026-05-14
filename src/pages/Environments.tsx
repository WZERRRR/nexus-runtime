import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ExternalLink, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { runtimeAPI } from '../services/runtimeApi';

type RuntimeEnvironmentBinding = {
  id: string;
  name: string;
  realDomain: string | null;
  runtimePath: string | null;
  pm2Process: string | null;
  runtimePort: number | null;
  nginxBinding: string | null;
  sslState: string;
  pm2Status: string;
  validated: boolean;
  validationMessage: string | null;
};

export function EnvironmentsCenter() {
  const { state } = useLocation();
  const context = state?.project;
  const [bindings, setBindings] = useState<RuntimeEnvironmentBinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadBindings = async () => {
    if (!context?.id) {
      setBindings([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await runtimeAPI.getProjectEnvironmentBindings(context.id);
      setBindings(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch environment runtime bindings.');
      setBindings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBindings();
  }, [context?.id]);

  const handleOpenEnvironment = (binding: RuntimeEnvironmentBinding) => {
    if (!binding.validated || !binding.realDomain) {
      setToast('البيئة غير مربوطة ببنية تشغيل فعلية');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const normalized = /^https?:\/\//i.test(binding.realDomain) ? binding.realDomain : `https://${binding.realDomain}`;
    window.open(normalized, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/30 text-red-500 px-5 py-3 rounded-xl text-xs font-black">
          {toast}
        </div>
      )}

      <ProjectHeader
        projectName={context?.name}
        sectionName="Runtime Environments"
        projectDescription={context ? undefined : 'بيئات التشغيل مرتبطة فقط بحالة البنية الفعلية.'}
      />

      {loading ? (
        <div className="glass-panel rounded-2xl p-6 text-xs text-slate-500">جاري تحميل البيانات التشغيلية...</div>
      ) : error ? (
        <div className="glass-panel rounded-2xl p-6 text-xs text-red-500">{error}</div>
      ) : bindings.length === 0 ? (
        <div className="glass-panel rounded-2xl p-6 text-xs text-slate-500">لا توجد بيانات تشغيلية حالياً</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bindings.map((env) => (
            <div key={env.id} className="glass-panel rounded-2xl p-5 border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-[var(--text-primary)]">{env.name}</h3>
                {env.validated ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <ShieldAlert className="w-4 h-4 text-red-500" />}
              </div>
              <div className="space-y-1 text-xs">
                <p><span className="text-slate-500">Domain:</span> {env.realDomain || '-'}</p>
                <p><span className="text-slate-500">Runtime Path:</span> {env.runtimePath || '-'}</p>
                <p><span className="text-slate-500">PM2 Process:</span> {env.pm2Process || '-'}</p>
                <p><span className="text-slate-500">Port:</span> {env.runtimePort ?? '-'}</p>
                <p><span className="text-slate-500">Nginx:</span> {env.nginxBinding || '-'}</p>
                <p><span className="text-slate-500">SSL:</span> {env.sslState}</p>
                <p><span className="text-slate-500">PM2 Status:</span> {env.pm2Status}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className={`text-[11px] font-bold ${env.validated ? 'text-emerald-500' : 'text-red-500'}`}>
                  {env.validated ? 'Runtime binding verified' : (env.validationMessage || 'Binding incomplete')}
                </p>
                <button
                  onClick={() => handleOpenEnvironment(env)}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black inline-flex items-center gap-2"
                >
                  Open
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
