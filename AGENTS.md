# DEVCORE AI — MASTER AI DEVELOPMENT RULES
# STRICT PRODUCTION SAFE MODE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ CORE OPERATING MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

اعمل دائمًا بوضع:

STRICT ANALYSIS MODE
READ FIRST → ANALYZE → REPORT → EXECUTE

ممنوع البدء بأي تنفيذ مباشر قبل التحليل الكامل.

الأولوية القصوى:
- استقرار النظام
- عدم كسر أي ميزة
- الحفاظ على Architecture الحالية
- الحفاظ على جودة المنصة
- الحفاظ على الأداء
- الحفاظ على الهوية البصرية

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 EXECUTION RESTRICTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ممنوع تنفيذ أي:
- تعديل
- حذف
- إضافة
- Refactor
- Cleanup
- Optimization
- Install
- Migration
- Restart
- Deploy
- Push
- Pull
- تغيير Logic
- تغيير Architecture

إلا إذا كان مطلوبًا بشكل صريح وواضح.

أي طلب تحليلي أو اقتراح لا يعتبر إذن تنفيذ.

نفّذ المطلوب فقط حرفيًا.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 MANDATORY ANALYSIS BEFORE EXECUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

قبل أي تنفيذ يجب:

1- قراءة الملفات كاملة.
2- فهم المشروع الحالي بالكامل.
3- تحليل الترابطات.
4- فهم:
- Components
- APIs
- Hooks
- Services
- Routes
- State Management
- Environment Variables
- Database Relations
- Authentication
- Build System
- Deployment Logic

5- تحليل تأثير أي تعديل.
6- تحديد الملفات المتأثرة فقط.
7- منع أي تأثير جانبي.

ثم عرض تقرير يشمل:
- الملفات المتأثرة
- سبب المشكلة
- طريقة الحل
- التأثير المتوقع
- المخاطر المحتملة

ثم فقط ابدأ التنفيذ.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 STRICT NO-AUTO RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ممنوع:
- التفكير بدلاً عني
- اتخاذ قرارات من نفسك
- اختراع Features
- إضافة تحسينات جانبية
- تغيير UI من نفسك
- تغيير UX من نفسك
- تعديل النظام كامل بسبب مشكلة صغيرة
- إنشاء ملفات غير ضرورية
- إنشاء Hooks عبثية
- إنشاء Components غير مطلوبة
- تغيير المكتبات
- تحديث Versions
- حذف أكواد تعتبرها غير مستخدمة

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 TASK ONLY EXECUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

نفّذ فقط:

EXACT REQUESTED TASK ONLY

إذا كان المطلوب:
- بطاقة
فلا تعدل الصفحة كاملة.

إذا كان المطلوب:
- UI
فلا تلمس Backend.

إذا كان المطلوب:
- Frontend
فلا تعدل APIs.

إذا كان المطلوب:
- تصميم
فلا تغير Logic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 PROTECTED FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ممنوع لمس الملفات التالية بدون طلب مباشر:

.env
server.ts
package.json
vite.config.ts
tsconfig.json
nginx.conf
pm2.config.js
database/*
auth/*
payments/*
deploy/*
AI core/*
security/*
middleware/*
production configs/*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ UI/UX PROTECTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

يجب الحفاظ دائمًا على:
- RTL
- Dark Mode
- Responsive
- الهوية البصرية
- تصميم البطاقات
- Layout الحالي
- نظام الألوان
- تجربة المستخدم الحالية

ممنوع تغيير:
- Navigation
- User Flow
- Sidebar Structure
- Dashboard Structure
- Tabs
- Routes

إلا بطلب مباشر.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ PERFORMANCE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ممنوع:
- Rendering زائد
- Loops ثقيلة
- Memory Leaks
- Polling عشوائي
- Requests متكررة
- تحميل مكتبات ضخمة بدون داعي

أي كود جديد يجب أن يكون:
- Optimized
- Lightweight
- Production Safe

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧱 ARCHITECTURE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

يجب الالتزام بـ:
- Naming Convention الحالية
- Folder Structure الحالية
- Coding Style الحالي
- Component Patterns الحالية
- State Management الحالية
- Service Structure الحالية

ممنوع إعادة الهيكلة إلا بطلب مباشر.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 DEPENDENCY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ممنوع:
- npm install
- yarn add
- pnpm add
- تغيير versions
- تحديث dependencies

إلا بعد:
- شرح السبب
- شرح التأثير
- شرح المخاطر
- موافقة صريحة

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SECURITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ممنوع:
- Hardcoded Secrets
- كشف Tokens
- كشف API Keys
- تعطيل Security Logic
- تجاوز Validation
- تعطيل Auth

يجب استخدام:
- Environment Variables فقط
- Safe Error Handling
- Secure API Patterns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 DATABASE PROTECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ممنوع:
- تعديل Database Schema
- حذف بيانات
- تعديل Migrations
- حذف جداول
- تعديل Relations

إلا بطلب مباشر وصريح.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 PRE-EXECUTION SAFETY CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

قبل التنفيذ تأكد أن التعديل لن يكسر:

- Build
- TypeScript
- Runtime
- APIs
- Responsive
- Dark Mode
- RTL
- Sessions
- Auth
- Deploy
- PM2
- Vite
- Environment
- Existing Features

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 POST EXECUTION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

بعد التنفيذ يجب عرض:

- الملفات المعدلة
- ما الذي تم تغييره
- سبب التعديل
- هل يوجد أي تأثير محتمل
- هل النظام آمن
- هل يوجد Breaking Changes
- حالة Build
- حالة Errors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 GOLDEN RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

تعامل مع المشروع كنظام Production Enterprise حساس جدًا.

أي تعديل يجب أن يكون:
- Minimal
- Safe
- Isolated
- Backward Compatible
- Clean
- Stable

إذا لم تكن متأكدًا 100٪:
لا تنفذ.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 FINAL ABSOLUTE RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

نفّذ المطلوب فقط.
لا تضف.
لا تحذف.
لا تفترض.
لا تبتكر.
لا تغيّر أي شيء خارج نطاق المهمة.
