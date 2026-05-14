import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { PageLoader } from './components/common/Loader';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { RuntimeProvider } from './client/context/runtimeContext';

// Lazy loaded pages for performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const PM2Manager = lazy(() => import('./pages/PM2').then(module => ({ default: module.PM2Manager })));
const Deploy = lazy(() => import('./pages/Deploy').then(module => ({ default: module.Deploy })));
const AIMonitor = lazy(() => import('./pages/AIMonitor').then(module => ({ default: module.AIMonitor })));
const Monitoring = lazy(() => import('./pages/Monitoring').then(module => ({ default: module.Monitoring })));
const Servers = lazy(() => import('./pages/Servers').then(module => ({ default: module.Servers })));
const Projects = lazy(() => import('./pages/Projects').then(module => ({ default: module.Projects })));
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace').then(module => ({ default: module.ProjectWorkspace })));
const LaravelCenter = lazy(() => import('./pages/Laravel').then(module => ({ default: module.LaravelCenter })));
const FrontendCenter = lazy(() => import('./pages/Frontend').then(module => ({ default: module.FrontendCenter })));
const MobileAppsCenter = lazy(() => import('./pages/MobileApps').then(module => ({ default: module.MobileAppsCenter })));
const DatabasesCenter = lazy(() => import('./pages/Databases').then(module => ({ default: module.DatabasesCenter })));
const BackupCenter = lazy(() => import('./pages/Backups').then(module => ({ default: module.BackupCenter })));
const FileManager = lazy(() => import('./pages/FileManager').then(module => ({ default: module.FileManager })));
const LogsCenter = lazy(() => import('./pages/Logs').then(module => ({ default: module.LogsCenter })));
const OTPCenter = lazy(() => import('./pages/OTP').then(module => ({ default: module.OTPCenter })));
const PaymentsCenter = lazy(() => import('./pages/Payments').then(module => ({ default: module.PaymentsCenter })));
const ApisCenter = lazy(() => import('./pages/Apis').then(module => ({ default: module.ApisCenter })));
const DomainsCenter = lazy(() => import('./pages/Domains').then(module => ({ default: module.DomainsCenter })));
const SecurityCenter = lazy(() => import('./pages/Security').then(module => ({ default: module.SecurityCenter })));
const EnvironmentsCenter = lazy(() => import('./pages/Environments').then(module => ({ default: module.EnvironmentsCenter })));
const InfrastructureManager = lazy(() => import('./pages/Infrastructure').then(module => ({ default: module.InfrastructureManager })));
const TerminalPage = lazy(() => import('./pages/Terminal').then(module => ({ default: module.TerminalPage })));
const TeamManager = lazy(() => import('./pages/Team').then(module => ({ default: module.TeamManager })));
const SettingsCenter = lazy(() => import('./pages/Settings').then(module => ({ default: module.SettingsCenter })));
const AdminGovernance = lazy(() => import('./pages/AdminGovernance').then(module => ({ default: module.AdminGovernance })));
const Documentation = lazy(() => import('./pages/Documentation').then(module => ({ default: module.Documentation })));

// Placeholder Component for unbuilt routes

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] glass-panel rounded-xl border border-slate-200 dark:border-slate-800/50 p-8 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-300 dark:border-slate-700">
      <span className="text-2xl text-slate-600 dark:text-slate-400">🏗️</span>
    </div>
    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
    <p className="text-slate-600 dark:text-slate-400 max-w-md">
      هذا القسم قيد التطوير ضمن المرحلة الحالية وسيتم إضافته قريباً وفقاً لهيكلية منصة التحكم الذكية.
    </p>
  </div>
);

import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <RuntimeProvider>
        <BrowserRouter>
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="servers" element={<Servers />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id/workspace" element={<ProjectWorkspace />} />
            <Route path="deploy" element={<Deploy />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="pm2" element={<PM2Manager />} />
            <Route path="laravel" element={<LaravelCenter />} />
            <Route path="frontend" element={<FrontendCenter />} />
            <Route path="mobile" element={<MobileAppsCenter />} />
            <Route path="database" element={<DatabasesCenter />} />
            <Route path="backup" element={<BackupCenter />} />
            <Route path="files" element={<FileManager />} />
            <Route path="logs" element={<LogsCenter />} />
            <Route path="otp" element={<OTPCenter />} />
            <Route path="payments" element={<PaymentsCenter />} />
            <Route path="apis" element={<ApisCenter />} />
            <Route path="domains" element={<DomainsCenter />} />
            <Route path="security" element={<SecurityCenter />} />
            <Route path="ai-monitor" element={<AIMonitor />} />
            <Route path="environments" element={<EnvironmentsCenter />} />
            <Route path="infrastructure" element={<InfrastructureManager />} />
            <Route path="terminal" element={<TerminalPage />} />
            <Route path="team" element={<TeamManager />} />
            <Route path="settings" element={<SettingsCenter />} />
            <Route path="governance" element={<AdminGovernance />} />
            <Route path="docs" element={<Documentation />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
          </Suspense>
          </ErrorBoundary>
    </BrowserRouter>
      </RuntimeProvider>
    </ThemeProvider>
  );
}
