import React, { useState } from 'react';
import { 
 Settings as SettingsIcon, Globe, Layers, Server, Folder, Rocket, Database, 
 Activity, Code, LayoutDashboard, Smartphone, Webhook, KeyRound, CreditCard, 
 Bot, Bell, Save, Shield, Terminal, GitBranch, FileBox, Users, Sliders, Zap, AlignLeft,
 Search, CheckCircle2, Loader2, Monitor, Share2, Key, Globe2, Wallet, Brain, 
 ShieldAlert, Box, ShieldCheck, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { ProjectHeader } from '../components/common/ProjectHeader';
import { RuntimeConstitution } from '../components/runtime/RuntimeConstitution';

const CATEGORIES = [
  { id: 'general', title: 'الهوية العامة', icon: Globe2, count: 8, desc: 'تخصيص اسم المنصة، الشعار، واللغة' },
  { id: 'governance', title: 'دستور التشغيل', icon: ShieldCheck, count: 1, desc: 'NEXUS Runtime Constitution Manifest' },
  { id: 'infrastructure', title: 'البنية التحتية', icon: Server, count: 12, desc: 'إدارة الخوادم، الاتصال، وجدران الحماية' },
 { id: 'environments', title: 'بيئات العمل', icon: Layers, count: 15, desc: 'تكوين متغيرات البيئة (Environment Variables)' },
 { id: 'ai_core', title: 'محرك الذكاء (Nexus AI)', icon: Brain, count: 6, desc: 'إعدادات Gemini ومحركات الاستشعار' },
 { id: 'security', title: 'الأمن والوصول', icon: Shield, count: 10, desc: 'إعدادات 2FA، الجلسات، وتشفير SSH' },
 { id: 'payments', title: 'الفوترة والمدفوعات', icon: Wallet, count: 8, desc: 'تكوين بوابات الدفع (Stripe, Moyasar)' },
 { id: 'deploy', title: 'النشر المؤتمت', icon: Rocket, count: 6, desc: 'قواعد النشر الآلي و CI/CD' },
 { id: 'database', title: 'قواعد البيانات', icon: Database, count: 9, desc: 'توصيلات SQL و Redis وإعدادات النسخ' },
 { id: 'notifications', title: 'التنبيهات الذكية', icon: Bell, count: 7, desc: 'قنوات Telegram, WhatsApp والبريد' },
 { id: 'integrations', title: 'الربط الخارجي', icon: Share2, count: 5, desc: 'مفاتيح GitHub, GitLab والـ Webhooks' },
];

const Toggle = ({ label, description, defaultChecked = false }: any) => (
 <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 hover:border-slate-200 dark:border-white/10 transition-all group">
 <div className="text-right">
 <p className="text-[11px] font-black text-white uppercase tracking-tight">{label}</p>
 {description && <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">{description}</p>}
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
 <div className="w-12 h-6 bg-slate-100 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-blue-500 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-slate-400 after:border-transparent after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-blue-600/20 peer-checked:after:bg-blue-500 shadow-inner"></div>
 </label>
 </div>
);

const InputField = ({ label, type = "text", placeholder, defaultValue = "", description, typeArea = false }: any) => {
 const [showValue, setShowValue] = useState(false);
 const isPassword = type === "password";

 return (
 <div className="space-y-3 text-right">
 <div className="flex justify-between items-center mb-1">
 <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">{type} field</span>
 <label className="text-[10px] font-black text-white uppercase tracking-widest">{label}</label>
 </div>
 <div className="relative">
 {typeArea ? (
 <textarea 
 className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px] placeholder:text-slate-700"
 placeholder={placeholder}
 defaultValue={defaultValue}
 />
 ) : (
 <>
 <input 
 type={isPassword && !showValue ? "password" : "text"} 
 className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700 pr-4 pl-10"
 placeholder={placeholder}
 defaultValue={defaultValue}
 />
 {isPassword && (
 <button 
 type="button"
 onClick={() => setShowValue(!showValue)}
 className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 dark:bg-white/5 rounded-lg transition-all text-slate-500 hover:text-blue-400"
 >
 <KeyRound className={`w-4 h-4 ${showValue ? 'text-blue-500' : ''}`} />
 </button>
 )}
 </>
 )}
 </div>
 {description && <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mr-2">{description}</p>}
 </div>
 );
};

const SelectField = ({ label, options, defaultValue, description }: any) => (
 <div className="space-y-3 text-right">
 <label className="text-[10px] font-black text-white uppercase tracking-widest block">{label}</label>
 <div className="relative">
 <select 
 className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer appearance-none" 
 defaultValue={defaultValue}
 >
 {options.map((opt: any) => <option key={opt.value} value={opt.value} className="bg-[#0d121f]">{opt.label}</option>)}
 </select>
 <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
 <Zap className="w-4 h-4" />
 </div>
 </div>
 {description && <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mr-2">{description}</p>}
 </div>
);

const SettingBlock = ({ title, icon: Icon, children }: any) => (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="mb-6 p-5 bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl relative overflow-hidden group"
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] -mr-16 -mt-16 rounded-full group-hover:bg-blue-500/10 transition-all"></div>
 <div className="flex items-center justify-between mb-8 relative z-10">
 <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-lg">
 <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-400 transition-colors" />
 </div>
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{title}</h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
 {children}
 </div>
 </motion.div>
);

export function SettingsCenter() {
 const { state } = useLocation();
 const context = state?.project;
 const [activeTab, setActiveTab] = useState('general');
 const [search, setSearch] = useState('');
 const [isSaving, setIsSaving] = useState(false);
 const [saved, setSaved] = useState(false);

 const handleSave = () => {
 if (isSaving || saved) return;
 setIsSaving(true);
 setTimeout(() => {
 setIsSaving(false);
 setSaved(true);
 setTimeout(() => setSaved(false), 3000);
 }, 1500);
 };

 const filteredCategories = CATEGORIES.filter(c => 
 c.title.includes(search) || c.id.includes(search.toLowerCase())
 );

 const renderContent = () => {
 switch (activeTab) {
 case 'general':
 return (
 <div className="space-y-6">
 <SettingBlock title="تعريف المنصة (Platform Brand)" icon={Monitor}>
 <InputField label="اسم النظام (System Name)" defaultValue="Dieaya Plus HQ" description="الاسم الذي يظهر في العناوين والتقارير" />
 <InputField label="شعار المنصة (Icon URL)" defaultValue="/assets/nexus-logo.svg" />
 <InputField 
 label="وصف الميتا (Meta Description)" 
 typeArea={true} 
 defaultValue="منصة الجيل القادم لإدارة البنية التحتية البرمجية والعمليات التقنية المتكاملة." 
 />
 <SelectField 
 label="اللغة الافتراضية (Global Locale)" 
 options={[{label: 'العربية (AR)', value:'ar'}, {label: 'English (US)', value:'en'}]} 
 defaultValue="ar" 
 />
 </SettingBlock>

 <SettingBlock title="المظهر والواجهة (Interface)" icon={LayoutDashboard}>
 <SelectField 
 label="السمة البصرية (System Theme)" 
 options={[
 {label: 'الوضع الليلي (Nexus Dark)', value:'dark'}, 
 {label: 'الوضع النهاري', value:'light'},
 {label: 'تلقائي (حسب النظام)', value:'system'}
 ]} 
 defaultValue="dark" 
 />
 <Toggle label="تأثيرات الزجاج (Glassmorphism)" description="تفعيل الشفافية والبلور في الواجهة" defaultChecked={true} />
 <Toggle label="الرسوم المتحركة الثقيلة" description="تفعيل حركات motion-react المتقدمة" defaultChecked={true} />
 </SettingBlock>
 </div>
 );
 
 case 'infrastructure':
 return (
 <div className="space-y-6">
 <SettingBlock title="الخوادم المركزية (Master Clusters)" icon={Server}>
 <InputField label="عنوان اتصال SSH (Master IP)" defaultValue="1.1.1.1" />
 <InputField label="منفذ الدخول الآمن (SSL Port)" defaultValue="443" />
 <Toggle label="Strict Firewall (UFW)" description="غلق كافة المنافذ المفتوحة تلقائياً" defaultChecked={true} />
 <Toggle label="Force Global HTTPS" description="تحويل كافة روابط HTTP إلى HTTPS إجبارياً" defaultChecked={true} />
 </SettingBlock>
 <SettingBlock title="الحدود القصوى للاستهلاك" icon={Activity}>
 <InputField label="سقف استهلاك المعالج (%)" type="number" defaultValue="85" />
 <InputField label="سقف استهلاك الذاكرة (%)" type="number" defaultValue="90" />
 </SettingBlock>
 </div>
 );

 case 'ai_core':
 return (
 <div className="space-y-6">
 <SettingBlock title="محرك الذكاء (Gemini Engine)" icon={Brain}>
 <InputField label="مفتاح API (Gemini Key)" type="password" defaultValue="*************************" description="يتم التحميل من متغيرات البيئة تلقائياً" />
 <SelectField 
 label="الموديل النشط (Active Model)" 
 options={[{label: 'Gemini 1.5 Pro (Latest)', value:'p'}, {label: 'Gemini 1.5 Flash', value:'f'}]} 
 defaultValue="p" 
 />
 <Toggle label="Auto Code Fixer" description="السماح للذكاء الاصطناعي بمحاولة إصلاح الأخطاء تلقائياً" defaultChecked={true} />
 </SettingBlock>
 <SettingBlock title="الاستشعار والتحليل (Sensors)" icon={Zap}>
 <Toggle label="Security Threat Detection" description="تحليل المحاولات غير المصرح بها عبر AI" defaultChecked={true} />
 <Toggle label="Sentiment Ops Analysis" description="تحليل ردود أفعال الأنظمة للبيئة" defaultChecked={false} />
 </SettingBlock>
 </div>
 );

 case 'security':
 return (
 <div className="space-y-6">
 <SettingBlock title="سياسات الولوج (Auth Policies)" icon={Shield}>
 <Toggle label="إلزامية التحقق بخطوتين (2FA)" description="فرض التحقق على جميع أعضاء الفريق" defaultChecked={true} />
 <InputField label="نهاية الجلسة (Session Timeout)" type="number" defaultValue="120" description="بالدقائق" />
 <InputField label="الحد الأقصى للمحاولات" type="number" defaultValue="5" />
 </SettingBlock>
 <SettingBlock title="تشفير البيانات (Cryptography)" icon={Key}>
 <SelectField 
 label="نوع مفاتيح الـ SSH" 
 options={[{label:'ED25519 (Recommended)', value:'ed'}, {label:'RSA 4096-bit', value:'rsa'}]} 
 defaultValue="ed" 
 />
 <Toggle label="Audit Logging" description="تسجيل كامل لكل ضغطة زر أمنية في سجل Audit" defaultChecked={true} />
 </SettingBlock>
 </div>
 );

 case 'environments':
 return (
 <div className="space-y-6">
 <SettingBlock title="إعدادات النظام (System Variables)" icon={Layers}>
 <InputField label="VITE_API_BASE_URL" defaultValue="https://api.dieaya.plus" />
 <InputField label="STRIPE_PUBLIC_KEY" type="password" defaultValue="pk_test_****************" />
 <Toggle label="Production Lock" description="قفل البيئة ضد التعديلات اليدوية المباشرة" defaultChecked={true} />
 </SettingBlock>
 </div>
 );

 case 'payments':
 return (
 <div className="space-y-6">
 <SettingBlock title="بوابات دفع الأمان (Gateways)" icon={Wallet}>
 <Toggle label="تفعيل Stripe API" defaultChecked={true} />
 <Toggle label="تفعيل Moyasar (Apple Pay/Mada)" defaultChecked={true} />
 <InputField label="عملة النظام الافتراضية" defaultValue="SAR" />
 </SettingBlock>
 </div>
 );

 case 'governance':
 return (
   <div className="space-y-8 pb-10">
     <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] relative overflow-hidden text-right">
       <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
         <ShieldCheck className="w-48 h-48 text-blue-500" />
       </div>
       <div className="relative z-10 text-right">
         <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">النظام الدستوري للتشغيل</h3>
         <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-relaxed max-w-2xl ml-auto">
           هذا الدستور هو المصدر الحقيقي الوحيد (SSOT) لهوية المشروع. يتم معالجة وعزل المشروع برمجياً بناءً على القواعد المعرفة هنا.
         </p>
       </div>
     </div>
     {context && <RuntimeConstitution project={context} />}
   </div>
 );

 default:
 return (
 <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-4">
 <Box className="w-12 h-12 opacity-20" />
 <p className="text-[10px] font-black uppercase tracking-widest italic">هذا القسم جارٍ تهيئته حالياً عبر الذكاء الاصطناعي</p>
 </div>
 );
 }
 };

 const currentTab = CATEGORIES.find(c => c.id === activeTab);

 return (
 <div className="space-y-8 flex flex-col h-[calc(100vh-6rem)] overflow-hidden text-right font-sans" dir="rtl">
 <ProjectHeader 
 projectName={context?.name}
 projectDescription={context ? undefined : "مركز التحكم المركزي (Kernel Settings). قم بتخصيص الهوية البصرية، قواعد الأمن، وتكوينات السيرفرات."}
 environment={context?.environments?.[0]?.name}
 branch={context?.environments?.[0]?.branch}
 sectionName="إعدادات المنصة الشاملة (Nexus Kernel)"
 actions={
 <div className="flex gap-3">
 <button 
 onClick={handleSave}
 disabled={isSaving || saved}
 className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 ${
 saved 
 ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
 : isSaving 
 ? 'bg-blue-600/50 text-white' 
 : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
 }`}
 >
 {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
 {isSaving ? 'جاري الحفظ...' : saved ? 'تم الحفظ بنجاح' : 'تطبيق التعديلات'}
 </button>
 </div>
 }
 />

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 pb-8 px-1 overflow-hidden">
 {/* Sidebar Tabs */}
 <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
 <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col h-full ">
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] -mr-16 -mt-16 rounded-full"></div>
 
 <div className="relative z-10 mb-8 items-center justify-between flex">
 <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
 <Sliders className="w-5 h-5 text-blue-500" />
 </div>
 <div className="text-right">
 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">أقسام الإعدادات</h3>
 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">اختر نطاق التكوين</p>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 relative z-10">
 {filteredCategories.map((cat) => {
 const Icon = cat.icon;
 const isActive = activeTab === cat.id;
 return (
 <button
 key={cat.id}
 onClick={() => setActiveTab(cat.id)}
 className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all border group relative overflow-hidden ${
 isActive 
 ? 'bg-blue-600/10 border-blue-500/20 text-white' 
 : 'bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-black/40'
 }`}
 >
 <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-600 group-hover:text-slate-600 dark:text-slate-400'}`}>
 <Icon className="w-4 h-4" />
 </div>
 <div className="text-right flex-1">
 <p className="text-[11px] font-black uppercase tracking-tight">{cat.title}</p>
 <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest truncate">{cat.desc}</p>
 </div>
 {isActive && (
 <motion.div 
 layoutId="tab-indicator"
 className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.5)]"
 />
 )}
 </button>
 );
 })}
 </div>

 <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5 relative z-10">
 <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10 text-right">
 <div className="flex items-center gap-2 mb-2 flex-row-reverse">
 <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
 <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">تحذير أمني</span>
 </div>
 <p className="text-[9px] font-bold text-slate-500 opacity-80 leading-relaxed uppercase tracking-widest">
 التغييرات في هذا القسم قد تؤدي إلى إعادة تشغيل خدمات حيوية في النظام. يرجى التوخي بحذر.
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Form Area */}
 <div className="lg:col-span-8 flex flex-col overflow-hidden">
 <div className="glass-panel rounded-3xl overflow-hidden flex flex-col flex-1 relative">
 <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] -ml-32 -mt-16 rounded-full"></div>
 
 <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 flex items-center justify-between shrink-0 relative z-10">
 <div className="flex gap-4">
 <div className="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 flex items-center gap-3 w-64 group">
 <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
 <input 
 type="text" 
 placeholder="البحث في الإعدادات الفرعية..." 
 className="bg-transparent text-[10px] font-bold text-white focus:outline-none w-full text-right"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="text-right">
 <h3 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{currentTab?.title}</h3>
 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">Nexus Configuration Node</p>
 </div>
 <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
 {currentTab && <currentTab.icon className="w-5 h-5 text-blue-500" />}
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-auto p-10 custom-scrollbar relative z-10">
 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 transition={{ duration: 0.2 }}
 className="max-w-4xl mx-auto"
 >
 {renderContent()}

 <div className="mt-12 flex justify-center pb-8">
 <button 
 onClick={handleSave}
 className="flex items-center gap-4 px-12 py-5 bg-slate-200 dark:bg-white/5 hover:bg-blue-600 text-white border border-slate-200 dark:border-white/10 hover:border-blue-500 rounded-[2rem] transition-all group overflow-hidden relative"
 >
 <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent group-hover:from-blue-600/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <span className="text-xs font-black uppercase tracking-[0.3em] relative z-10">Commit These Changes</span>
 <Save className="w-5 h-5 group-hover:rotate-12 transition-transform relative z-10" />
 </button>
 </div>
 </motion.div>
 </AnimatePresence>
 </div>

 {/* Bottom Decoration */}
 <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-slate-100 dark:via-blue-500/50 to-transparent"></div>
 </div>
 </div>
 </div>
 </div>
 );
}
