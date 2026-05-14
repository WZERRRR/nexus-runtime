import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
 Users, UserPlus, Shield, Mail, MoreVertical, Activity, 
 CheckCircle2, Clock, Key, Laptop2, Trash2, Edit2, 
 ShieldAlert, ShieldCheck, Search, Filter, Settings2,
 Fingerprint, Zap, ShieldQuestion, UserCheck, 
 Globe, Terminal as TerminalIcon, Radio, Brain,
 MoreHorizontal, Plus, Copy, Lock, Unlock, X, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectHeader } from '../components/common/ProjectHeader';

const TEAM_MEMBERS = [
 { id: 1, name: 'أحمد محمود', email: 'ahmed@devcore.com', role: 'Super Admin', status: 'online', lastActive: 'الآن', location: 'الرياض, SA', device: 'MacBook Pro' },
 { id: 2, name: 'سارة خالد', email: 'sarah@devcore.com', role: 'DevOps Engineer', status: 'offline', lastActive: 'قبل ساعتين', location: 'جدة, SA', device: 'Windows PC' },
 { id: 3, name: 'محمد عبدالله', email: 'mohamed@devcore.com', role: 'Backend Developer', status: 'online', lastActive: 'منذ 5 دقائق', location: 'القاهرة, EG', device: 'Ubuntu Desktop' },
 { id: 4, name: 'خالد عمر', email: 'khalid@devcore.com', role: 'Frontend Developer', status: 'away', lastActive: 'قبل 45 دقيقة', location: 'دبي, AE', device: 'MacBook Air' },
 { id: 5, name: 'فاطمة علي', email: 'fatima@devcore.com', role: 'QA Tester', status: 'offline', lastActive: 'قبل يومين', location: 'الرياض, SA', device: 'iPad Pro' },
];

const ROLES = [
 { id: 'admin', name: 'Super Admin', count: 1, permissions: ['All Access', 'Billing', 'Security'], color: 'red' },
 { id: 'devops', name: 'DevOps Engineer', count: 1, permissions: ['Servers', 'Deploy', 'Logs'], color: 'purple' },
 { id: 'backend', name: 'Backend Developer', count: 2, permissions: ['APIs', 'Database (Read)', 'Logs'], color: 'blue' },
 { id: 'frontend', name: 'Frontend Developer', count: 3, permissions: ['Deploy (Staging)', 'Frontend Center'], color: 'emerald' },
];

const SECURITY_LOGS = [
 { id: 1, user: 'أحمد محمود', action: 'تغيير إعدادات DNS', target: 'Environment: LIVE', time: '14:30', status: 'success' },
 { id: 2, user: 'سارة خالد', action: 'إنشاء بيئة جديدة', target: 'Branch: feat/api', time: '12:15', status: 'success' },
 { id: 3, user: 'محمد عبدالله', action: 'إعادة تشغيل قاعدة البيانات', target: 'DB: main-prod', time: '10:05', status: 'warning' },
];

export function TeamManager() {
 const { state } = useLocation();
 const navigate = useNavigate();
 const context = state?.project;
 const [searchTerm, setSearchTerm] = useState('');
 const [isInviteOpen, setIsInviteOpen] = useState(false);
 const [toast, setToast] = useState<string | null>(null);

 const showToast = (message: string) => {
 setToast(message);
 window.setTimeout(() => setToast(null), 2800);
 };

 return (
 <div className="space-y-8 flex flex-col lg:h-[calc(100vh-6rem)] lg:overflow-hidden text-right font-sans pb-12 lg:pb-0" dir="rtl">
 <AnimatePresence>
 {toast && (
 <motion.div
 initial={{ opacity: 0, y: -20, x: '-50%' }}
 animate={{ opacity: 1, y: 20, x: '-50%' }}
 exit={{ opacity: 0, y: -20, x: '-50%' }}
 className="fixed top-4 left-1/2 z-[150] px-5 py-3 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs font-bold shadow-2xl backdrop-blur-md"
 >
 {toast}
 </motion.div>
 )}
 </AnimatePresence>

 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "إدارة القوى العاملة التقنية: إضافة أعضاء الفريق، التحكم في مستويات الوصول (RBAC)، ومراقبة النشاط الأمني."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="إدارة الصلاحيات (Nexus Identity)"
 actions={
 <div className="flex gap-3">
 <button 
 onClick={() => setIsInviteOpen(true)}
 className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-[10px] font-black shadow-lg shadow-blue-500/20 active:scale-95 uppercase tracking-widest"
 >
 <UserPlus className="w-4 h-4" />
 دعوة عضو جديد
 </button>
 </div>
 }
 />

 {/* Team Metrics */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 px-1">
 <InsightCard 
 icon={<Users className="w-4 h-4 text-blue-400" />}
 title="إجمالي الفريق"
 value="12"
 sub="3 دعوات قيد الانتظار"
 type="blue"
 />
 <InsightCard 
 icon={<Radio className="w-4 h-4 text-emerald-400" />}
 title="نشطون حالياً"
 value="04"
 sub="تفاعل لحظي مع النظام"
 status="LIVE"
 type="emerald"
 />
 <InsightCard 
 icon={<ShieldCheck className="w-4 h-4 text-purple-400" />}
 title="مستوى الأمان"
 value="99.9%"
 sub="دخول عبر 2FA مفعل"
 type="purple"
 />
 <InsightCard 
 icon={<Key className="w-4 h-4 text-amber-400" />}
 title="توزيع الأدوار"
 value="04"
 sub="هيكلية RBAC نشطة"
 type="amber"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 lg:overflow-hidden px-1">
 {/* Members List */}
 <div className="lg:col-span-8 flex flex-col gap-6 lg:overflow-hidden text-right min-h-[400px]">
 <div className="glass-panel rounded-3xl lg:overflow-hidden flex flex-col relative flex-1">
 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -mr-32 -mt-16 rounded-full"></div>
 
 <div className="p-6 md:p-8 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between shrink-0 relative z-10 font-sans gap-4">
 <div className="flex gap-4 w-full sm:w-auto">
 <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 flex items-center gap-3 w-full sm:w-64">
 <Search className="w-4 h-4 text-slate-500" />
 <input 
 type="text" 
 placeholder="بحث..." 
 className="bg-transparent text-[10px] font-bold text-white focus:outline-none w-full text-right"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>
 <div className="flex items-center gap-3">
 <Fingerprint className="w-5 h-5 text-blue-500" />
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] text-center sm:text-right">دليل الهوية والوصول</h3>
 </div>
 </div>
 
 <div className="flex-1 overflow-x-auto lg:overflow-y-auto custom-scrollbar">
 <table className="w-full text-right text-xs min-w-[800px] lg:min-w-0">
 <thead className="bg-white dark:bg-slate-900/20 text-slate-500 sticky top-0 z-20 backdrop-blur-md">
 <tr>
 <th className="px-8 py-5 font-black uppercase tracking-widest text-[9px]">العضو / الهوية</th>
 <th className="px-8 py-5 font-black uppercase tracking-widest text-[9px]">مستوى الوصول (Role)</th>
 <th className="px-8 py-5 font-black uppercase tracking-widest text-[9px]">الحالة</th>
 <th className="px-8 py-5 font-black uppercase tracking-widest text-[9px]">آخر نشاط</th>
 <th className="px-8 py-5 font-black uppercase tracking-widest text-[9px] text-center">إجراءات</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-white/5">
 {TEAM_MEMBERS.map((member) => (
 <motion.tr 
 key={member.id} 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="hover:bg-white/[0.02] transition-all group"
 >
 <td className="px-8 py-6">
 <div className="flex items-center gap-4 flex-row-reverse">
 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform ${
 member.role.includes('Admin') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
 member.role.includes('DevOps') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
 }`}>
 {member.name.charAt(0)}
 <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
 </div>
 <div className="text-right">
 <p className="font-black text-white text-sm uppercase tracking-tight mb-1">{member.name}</p>
 <p className="text-[10px] text-slate-500 font-bold tracking-wide">{member.email}</p>
 </div>
 </div>
 </td>
 <td className="px-8 py-6 text-right">
 <span className={`text-[9px] font-black px-3 py-1 rounded-lg border uppercase tracking-widest inline-block ${
 member.role.includes('Admin') ? 'bg-red-500/10 text-red-500 border-red-500/20' :
 member.role.includes('DevOps') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5'
 }`}>
 {member.role}
 </span>
 </td>
 <td className="px-8 py-6">
 <div className="flex items-center gap-2 justify-end">
 <span className={`w-1.5 h-1.5 rounded-full ${
 member.status === 'online' ? 'bg-emerald-500 animate-pulse shadow-sm dark:shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
 member.status === 'away' ? 'bg-amber-500' : 'bg-slate-600'
 }`}></span>
 <span className={`text-[10px] font-black uppercase tracking-widest ${
 member.status === 'online' ? 'text-emerald-400' : 'text-slate-500'
 }`}>{member.status}</span>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="text-right">
 <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight mb-1">{member.lastActive}</p>
 <div className="flex items-center gap-1 justify-end text-[9px] font-bold text-slate-500">
 <Globe className="w-3 h-3" /> {member.location}
 </div>
 </div>
 </td>
 <td className="px-8 py-6">
 <div className="flex gap-2 justify-center opacity-40 group-hover:opacity-100 transition-opacity">
 <button onClick={() => showToast(`تم فتح إعدادات العضو: ${member.name}`)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all">
 <Settings2 className="w-4 h-4" />
 </button>
 <button onClick={() => showToast(`تم طلب إزالة العضو: ${member.name}`,)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Security Sessions / Logs */}
 <div className="glass-panel rounded-3xl overflow-hidden flex flex-col flex-1 min-h-[300px]">
 <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between px-8">
 <div className="flex items-center gap-3">
 <ShieldCheck className="w-5 h-5 text-emerald-500" />
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">سجل العمليات الحسّاسة (Audit Logs)</h3>
 </div>
 </div>
 <div className="p-8 flex-1 overflow-auto custom-scrollbar">
 <div className="space-y-4">
 {SECURITY_LOGS.map((log) => (
 <div key={log.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all">
 <div className="text-left font-mono">
 <p className="text-[10px] font-black text-slate-500 mb-1">{log.time}</p>
 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{log.user}</p>
 </div>
 <div className="flex items-center gap-4 text-right">
 <div className="text-right">
 <p className="text-xs font-black text-white uppercase tracking-tight mb-1">{log.action}</p>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{log.target}</p>
 </div>
 <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5">
 <TerminalIcon className={`w-4 h-4 ${log.status === 'success' ? 'text-blue-400' : 'text-amber-400'}`} />
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Roles Distribution & Sidebar */}
 <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
 <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden group flex flex-col shrink-0">
 <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] -ml-16 -mt-16 rounded-full"></div>
 
 <div className="flex items-center justify-between mb-8 relative z-10 text-right">
 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">هيكلية الصلاحيات (RBAC Roles)</span>
 <Shield className="w-6 h-6 text-purple-400" />
 </div>

 <div className="space-y-4 relative z-10 flex-1">
 {ROLES.map((role) => (
 <div key={role.id} className="p-5 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/20 hover:bg-slate-100 dark:bg-black/40 transition-all cursor-pointer group/role text-right">
 <div className="flex justify-between items-center mb-4">
 <span className="text-[9px] font-black text-slate-500 bg-slate-200 dark:bg-white/5 px-2 py-0.5 rounded-md uppercase tracking-widest">
 {role.count} MEMBERS
 </span>
 <div className="flex items-center gap-3 flex-row-reverse">
 <div className={`w-1.5 h-1.5 rounded-full ${
 role.color === 'red' ? 'bg-red-500' : 
 role.color === 'purple' ? 'bg-purple-500' : 
 role.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'
 }`}></div>
 <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{role.name}</h4>
 </div>
 </div>
 <div className="flex flex-wrap gap-2 flex-row-reverse">
 {role.permissions.map((p, i) => (
 <span key={i} className="text-[8px] font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 px-2 py-1 rounded bg-white dark:bg-slate-900/50 uppercase tracking-widest">
 # {p}
 </span>
 ))}
 </div>
 </div>
 ))}
 
 <button onClick={() => showToast('تم فتح نموذج إضافة مستوى وصول جديد')} className="w-full py-4 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 hover:text-white hover:border-slate-200 dark:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
 <Plus className="w-4 h-4" /> إضافة مستوى وصول جديد
 </button>
 </div>
 </div>

 {/* Security Recommendations */}
 <div className="glass-panel p-6 md:p-8 rounded-3xl flex-1 flex flex-col relative overflow-hidden group">
 <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none"></div>
 
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2 justify-end">
 توصيات المحرك الأمني
 <Brain className="w-4 h-4 text-emerald-400" />
 </h3>

 <div className="space-y-6 relative z-10 text-right">
 <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
 <div className="flex items-center gap-2 mb-2 flex-row-reverse">
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Identity Secure</span>
 </div>
 <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
 جميع المسؤولين (Admins) يستخدمون ميزة التحقق بخطوتين (2FA). حالة الحماية: ممتازة.
 </p>
 </div>

 <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10">
 <div className="flex items-center gap-2 mb-2 flex-row-reverse">
 <Clock className="w-3.5 h-3.5 text-amber-400" />
 <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Inactivity Warning</span>
 </div>
 <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
 العضو "فاطمة علي" لم تسجل دخول منذ 45 يوم. ننصح بمراجعة صلاحياتها أو إلغاء الحساب.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Invite Member Modal */}
 <AnimatePresence>
 {isInviteOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md"
 onClick={() => setIsInviteOpen(false)}
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-xl glass-panel rounded-3xl shadow-2xl flex flex-col overflow-hidden"
 >
 <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-white/5 flex items-center justify-between text-right font-sans">
 <div className="text-right">
 <h2 className="text-xl font-black text-white uppercase tracking-tight">Invite Resource</h2>
 <p className="text-slate-500 text-[10px] font-black uppercase mt-1 tracking-widest">إضافة عضو جديد للفريق التقني</p>
 </div>
 <button onClick={() => setIsInviteOpen(false)} className="p-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 rounded-2xl transition-all">
 <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
 </button>
 </div>

 <div className="p-8 space-y-6">
 <div className="space-y-2 text-right">
 <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">EMAIL ADDRESS</label>
 <input 
 type="email" 
 placeholder="user@devcore.com"
 className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50"
 />
 </div>
 <div className="space-y-2 text-right">
 <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">ASSIGN ROLE</label>
 <select className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:outline-none appearance-none cursor-pointer">
 <option>DEVELOPER</option>
 <option>DEVOPS</option>
 <option>QA TESTER</option>
 <option>MANAGER</option>
 </select>
 </div>
 </div>

 <div className="p-8 border-t border-slate-200 dark:border-white/5 bg-slate-200 dark:bg-white/5 flex gap-4">
 <button onClick={() => setIsInviteOpen(false)} className="flex-1 py-4 bg-slate-200 dark:bg-white/5 hover:bg-slate-200 dark:bg-white/10 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all">
 CANCEL
 </button>
 <button onClick={() => showToast('تم إرسال دعوة العضو بنجاح')} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95">
 SEND INVITATION
 </button>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}

function InsightCard({ icon, title, value, sub, status, type = 'blue' }: any) {
 const getColors = () => {
 switch (type) {
 case 'purple': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
 case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
 case 'amber': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
 default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
 }
 };

 return (
 <motion.div 
 whileHover={{ y: -4 }}
 className="glass-panel p-6 rounded-[2rem] relative overflow-hidden group "
 >
 <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 -mr-12 -mt-12 rounded-full transition-all group-hover:opacity-40 animate-pulse ${getColors().split(' ')[0]}`}></div>
 <div className="flex justify-between items-start relative z-10 mb-4">
 <div className={`p-3 rounded-2xl border transition-transform group-hover:scale-110 ${getColors()}`}>
 {icon}
 </div>
 {status && (
 <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md">
 {status}
 </span>
 )}
 </div>
 <div className="relative z-10 text-right">
 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</h3>
 <p className="text-2xl font-black text-white tracking-tight uppercase">{value}</p>
 <p className="text-[10px] text-slate-600 font-bold mt-1.5 uppercase tracking-wide">{sub}</p>
 </div>
 </motion.div>
 );
}
