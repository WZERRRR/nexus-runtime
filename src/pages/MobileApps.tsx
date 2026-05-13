import React, { useState, useEffect } from 'react';
import { Smartphone, Apple, Play, Code2, RefreshCcw, Bell, Settings, Activity, UploadCloud, Globe, ShieldCheck, Plus, Send, X, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { runtimeAPI } from '../services/runtimeApi';

export function MobileAppsCenter() {
  const [apps, setApps] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'alert'} | null>(null);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  
  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({ apiEndpoint: '', environment: '' });

  const fetchApps = async () => {
    try {
      const data = await runtimeAPI.getMobileApps();
      setApps(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchApps();
    const interval = setInterval(fetchApps, 5000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message: string, type: 'success' | 'alert' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchApps();
    setTimeout(() => {
        setIsRefreshing(false);
        showToast('تم تحديث مزامنة التطبيقات والرموز (Push Tokens)');
    }, 500);
  };

  const handleSendPush = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedApp) return;
    setLoadingId(selectedApp.id);
    
    try {
       const form = e.currentTarget;
       const titleInput = form.elements.namedItem('title') as HTMLInputElement;
       const bodyInput = form.elements.namedItem('body') as HTMLTextAreaElement;
       
       const response = await runtimeAPI.sendMobilePush(selectedApp.id, titleInput.value, bodyInput.value);
       if (response.success) {
           showToast(response.message);
       } else {
           showToast(response.message || 'فشل إرسال الإشعار', 'alert');
       }
    } catch(err: any) {
       showToast(err.message, 'alert');
    } finally {
       setLoadingId(null);
       setIsPushModalOpen(false);
    }
  };

  const handleDeploy = async (app: any) => {
    showToast(`جاري تحضير إصدار جديد للتطبيق ${app.name}...`);
    try {
        const response = await runtimeAPI.deployMobileApp(app.id);
        if (response.success) {
             showToast(response.message);
             fetchApps();
        } else {
             showToast(response.message || 'فشل نشر التطبيق', 'alert');
        }
    } catch (e: any) {
        showToast(e.message, 'alert');
    }
  };
  
  const openSettings = (app: any) => {
      setSelectedApp(app);
      setSettingsForm({ apiEndpoint: app.apiEndpoint, environment: app.environment });
      setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedApp) return;
      try {
          const res = await runtimeAPI.updateMobileSettings(selectedApp.id, settingsForm);
          if (res.success) {
              showToast(res.message);
              fetchApps();
              setIsSettingsModalOpen(false);
          } else {
              showToast(res.message, 'alert');
          }
      } catch (err: any) {
          showToast(err.message, 'alert');
      }
  };

  return (
    <div className="space-y-6 relative">
 <AnimatePresence>
 {toast && (
 <motion.div 
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
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex items-center justify-between"
 >
 <div>
 <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
 <div className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20">
 <Smartphone className="w-8 h-8 text-pink-400" />
 </div>
 إدارة تطبيقات الموبايل
 </h1>
 <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">تتبع إصدارات التطبيقات، نقاط اتصال API، وإدارة إشعارات الدفع الذكية.</p>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={handleRefresh}
 disabled={isRefreshing}
 className="group bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-slate-200 dark:border-white/5 flex items-center gap-2 active:scale-95 disabled:opacity-50"
 >
 <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-pink-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
 تحديث المزامنة
 </button>
 <button 
 onClick={() => showToast('لإضافة تطبيق جديد يرجى التواصل مع فريق الهندسة لربط الـ Repositories.', 'alert')}
 className="group bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
 >
 <Plus className="w-4 h-4" />
 تطبيق جديد
 </button>
 </div>
 </motion.div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full"></div>
 <div className="flex justify-between items-start mb-4 relative z-10">
 <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">إجمالي التطبيقات</p>
 <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10 shadow-inner">
 <Smartphone className="w-5 h-5" />
 </div>
 </div>
 <p className="text-3xl font-black text-white mb-2 relative z-10">{apps.length} تطبيقات</p>
 <p className="text-[10px] text-slate-500 font-bold relative z-10 uppercase tracking-widest">Android, iOS, Flutter</p>
 </motion.div>

 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.1 }}
 className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 blur-3xl rounded-full"></div>
 <div className="flex justify-between items-start mb-4 relative z-10">
 <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">الأجهزة النشطة</p>
 <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/10 shadow-inner">
 <Bell className="w-5 h-5" />
 </div>
 </div>
 <p className="text-3xl font-black text-white mb-2 relative z-10">
   {apps.reduce((acc, curr) => acc + parseInt((curr.pushTokens || '0').replace(',', '')), 0).toLocaleString()}
 </p>
 <p className="text-[10px] text-emerald-400 font-bold relative z-10 flex items-center gap-2 uppercase tracking-widest">
 <Activity className="w-3.5 h-3.5 animate-pulse" />
 +125 جهاز جديد اليوم
 </p>
 </motion.div>

 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.2 }}
 className="glass-panel p-6 rounded-2xl relative overflow-hidden group"
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full"></div>
 <div className="flex justify-between items-start mb-4 relative z-10">
 <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">حالة الأنظمة</p>
 <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shadow-inner">
 <Globe className="w-5 h-5" />
 </div>
 </div>
 <p className="text-3xl font-black text-emerald-400 mb-2 relative z-10">تعمل بكفاءة</p>
 <p className="text-[10px] text-slate-500 font-bold relative z-10 uppercase tracking-widest">زمن الاستجابة: ~45ms</p>
 </motion.div>
 </div>

 <div className="space-y-5 px-1">
 <AnimatePresence mode="popLayout">
 {apps.map((app, idx) => (
 <motion.div 
 layout
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: idx * 0.1 }}
 key={app.id} 
 className={`glass-panel rounded-3xl p-6 border transition-all ${
 app.status === 'online' ? 'border-slate-200 dark:border-white/5 hover:border-pink-500/30' : 'border-orange-500/20'
 } group/card relative overflow-hidden shadow-xl`}
 >
 <div className="absolute top-0 left-0 w-1 h-full bg-pink-600 opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
 
 <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative z-10">
 
 <div className="flex items-center gap-6">
 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${
 app.platform.includes('Apple') || app.platform.includes('iOS') ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-white' :
 app.platform.includes('Android') ? 'bg-green-500/5 border-green-500/20 text-green-500' :
 'bg-blue-500/5 border-blue-500/20 text-blue-400'
 }`}>
 {app.platform.includes('Flutter') ? <Code2 className="w-8 h-8" /> : 
 app.platform.includes('iOS') ? <Apple className="w-8 h-8" /> : 
 <Play className="w-8 h-8" />}
 </div>
 <div>
 <h3 className="font-black text-xl text-white tracking-tight mb-2">{app.name}</h3>
 <div className="flex flex-wrap items-center gap-3">
 <span className="text-slate-600 dark:text-slate-400 text-xs font-bold font-mono bg-slate-200 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5">{app.platform}</span>
 <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest shadow-inner ${
 app.environment === 'LIVE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
 }`}>
 {app.environment}
 </span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 flex-1 xl:px-10 xl:border-x border-slate-200 dark:border-white/5">
 <div className="group/item">
 <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest group-hover/item:text-blue-400 transition-colors">API Endpoint</p>
 <p className="text-sm font-mono font-bold text-blue-300 truncate tracking-tight shadow-sm" title={app.apiEndpoint}>{app.apiEndpoint}</p>
 </div>
 <div className="group/item">
 <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest group-hover/item:text-white transition-colors">Current Version</p>
 <div className="flex items-center gap-3">
 <p className="text-sm font-black text-white font-mono tracking-wider">{app.version}</p>
 <div className={`w-2 h-2 rounded-full shadow-sm dark:shadow-[0_0_8px_rgba(34,197,94,0.6)] ${app.version.includes('beta') ? 'bg-orange-400' : 'bg-green-400'}`}></div>
 </div>
 </div>
 <div className="group/item">
 <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest group-hover/item:text-pink-400 transition-colors">Push Data</p>
 <p className="text-sm font-black text-white flex items-center gap-2">
 <Bell className="w-4 h-4 text-pink-500" />
 {app.pushTokens}
 </p>
 </div>
 </div>

 <div className="flex justify-end gap-3 shrink-0">
 <button 
 onClick={() => handleDeploy(app)}
 className="p-3 rounded-2xl bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-200 dark:bg-white/10 transition-all border border-slate-200 dark:border-white/5 active:scale-90 shadow-lg group/btn"
 title="رفع إصدار جديد"
 >
 <UploadCloud className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
 </button>
 <button 
 onClick={() => { setSelectedApp(app); setIsPushModalOpen(true); }}
 className="p-3 rounded-2xl bg-pink-600/10 text-pink-400 hover:text-white hover:bg-pink-600 transition-all border border-pink-500/20 active:scale-90 shadow-lg group/btn"
 title="إرسال إشعار فوري"
 >
 {loadingId === app.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5 group-hover/btn:animate-ring" />}
 </button>
 <button onClick={() => openSettings(app)} className="p-3 rounded-2xl bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-200 dark:bg-white/10 transition-all border border-slate-200 dark:border-white/5 active:scale-90 shadow-lg group/btn" title="إعدادات التطبيق">
 <Settings className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
 </button>
 </div>

 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>

 {/* Push Notification Modal */}
 <AnimatePresence>
 {isPushModalOpen && selectedApp && (
 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setIsPushModalOpen(false)}
 className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm"
 ></motion.div>
 <motion.div 
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="relative w-full max-w-lg glass-panel p-1 rounded-3xl overflow-hidden"
 >
 <div className="p-8 bg-white dark:bg-slate-900/60 rounded-[2.2rem]">
 <div className="flex justify-between items-center mb-8">
 <h2 className="text-2xl font-black text-white flex items-center gap-3">
 <div className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20">
 <Bell className="w-6 h-6 text-pink-500" />
 </div>
 إشعار فوري ذكي
 </h2>
 <button 
 onClick={() => setIsPushModalOpen(false)}
 className="p-2 hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white"
 >
 <X className="w-6 h-6" />
 </button>
 </div>

 <form onSubmit={handleSendPush} className="space-y-6">
 <div>
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 pr-1">مستقبل الرسالة</label>
 <div className="p-4 bg-slate-200 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 font-bold text-white flex items-center justify-between shadow-inner">
 <span>{selectedApp.name}</span>
 <span className="text-xs text-pink-400 bg-pink-500/10 px-2 py-1 rounded-lg border border-pink-500/10">{selectedApp.pushTokens}</span>
 </div>
 </div>
 <div>
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 pr-1">عنوان الإشعار</label>
 <input 
 required
 type="text"
 name="title" 
 placeholder="مثال: خصم جديد متاح الآن!"
 className="w-full bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-pink-500/50 transition-all shadow-inner"
 />
 </div>
 <div>
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 pr-1">محتوى الإشعار</label>
 <textarea 
 required
 rows={4}
 name="body"
 placeholder="أدخل نص الإشعار الذي سيظهر للمستخدمين..."
 className="w-full bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-pink-500/50 transition-all shadow-inner resize-none"
></textarea>
 </div>

 <div className="pt-2">
 <button 
 type="submit"
 className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-5 rounded-2xl transition-all shadow-[0_20px_40px_-5px_rgba(219,39,119,0.4)] flex items-center justify-center gap-3 group/send active:scale-[0.98]"
 >
 <Send className="w-6 h-6 group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
 إرسال الآن لجميع المستخدمين
 </button>
 </div>
 </form>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Settings Modal */}
 <AnimatePresence>
 {isSettingsModalOpen && selectedApp && (
 <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setIsSettingsModalOpen(false)}
 className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm"
 ></motion.div>
 <motion.div 
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="relative w-full max-w-lg glass-panel p-1 rounded-3xl overflow-hidden"
 >
 <div className="p-8 bg-white dark:bg-slate-900/60 rounded-[2.2rem]">
 <div className="flex justify-between items-center mb-8">
 <h2 className="text-2xl font-black text-white flex items-center gap-3">
 <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
 <Settings className="w-6 h-6 text-blue-500" />
 </div>
 إعدادات التطبيق
 </h2>
 <button 
 onClick={() => setIsSettingsModalOpen(false)}
 className="p-2 hover:bg-slate-200 dark:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white"
 >
 <X className="w-6 h-6" />
 </button>
 </div>

 <form onSubmit={handleSaveSettings} className="space-y-6">
 <div>
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 pr-1">API Endpoint</label>
 <input 
 required
 type="url" 
 value={settingsForm.apiEndpoint}
 onChange={e => setSettingsForm({ ...settingsForm, apiEndpoint: e.target.value })}
 placeholder="https://api.example.com"
 className="w-full bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
 />
 </div>
 
 <div>
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 pr-1">بيئة التشغيل</label>
 <select 
 value={settingsForm.environment}
 onChange={e => setSettingsForm({ ...settingsForm, environment: e.target.value })}
 className="w-full bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
 >
   <option value="LIVE" className="bg-white dark:bg-slate-900">LIVE</option>
   <option value="STAGING" className="bg-white dark:bg-slate-900">STAGING</option>
   <option value="DEVELOPMENT" className="bg-white dark:bg-slate-900">DEVELOPMENT</option>
 </select>
 </div>

 <div className="pt-2">
 <button 
 type="submit"
 className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-[0_20px_40px_-5px_rgba(59,130,246,0.4)] flex items-center justify-center gap-3 group/send active:scale-[0.98]"
 >
 <Save className="w-6 h-6 group-hover/send:scale-110 transition-transform" />
 حفظ الإعدادات
 </button>
 </div>
 </form>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
