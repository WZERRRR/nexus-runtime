// DevCore AI Runtime Actions API client

export interface SystemStatus {
  status: string;
  uptime: number;
  platform: string;
  release: string;
  loadavg: number[];
  totalmem: number;
  freemem: number;
  cpus: number;
  hostname: string;
}

export interface ProcessStatus {
  pid: number;
  title: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;
}

export interface EnvStatus {
  nodeVersion: string;
  environment: string;
  exposedKeys: string[];
}

export interface RuntimeLog {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

class RuntimeAPI {
  async getTelemetry(): Promise<any> {
    try {
      const res = await fetch('/api/runtime/telemetry');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.data;
    } catch (e) {
      console.error('Failed to fetch telemetry:', e);
      return {};
    }
  }

  async getSystemStatus(): Promise<SystemStatus | null> {
    try {
      const res = await fetch('/api/runtime/system');
      if (!res.ok) {
         console.error(`SystemStatus fetch error: ${res.status} ${res.statusText}`);
         return null;
      }
      const text = await res.text();
      try {
          const data = JSON.parse(text);
          return data.data;
      } catch (e) {
          console.error("Failed to parse SystemStatus JSON:", text);
          return null;
      }
    } catch (e) {
      // console.error('Failed to fetch system status:', e);
      return null;
    }
  }

  async getProcessStatus(): Promise<ProcessStatus | null> {
    try {
      const res = await fetch('/api/runtime/processes');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.data;
    } catch (e) {
      // console.error('Failed to fetch process status:', e);
      return null;
    }
  }

  async getEnvStatus(): Promise<EnvStatus | null> {
    try {
      const res = await fetch('/api/runtime/env');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.data;
    } catch (e) {
      console.error('Failed to fetch environment status:', e);
      return null;
    }
  }

  async getLogs(runtimeId?: string): Promise<RuntimeLog[]> {
    try {
      if (runtimeId) {
        const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId)}/logs`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
      }
      const res = await fetch('/api/runtime/logs');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch logs:', e);
      return [];
    }
  }

  async getMetrics(runtimeId?: string): Promise<any> {
    try {
      if (runtimeId) {
        const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId)}/monitoring`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        return data.data;
      }
      return null;
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
      return null;
    }
  }

  async getEvents(runtimeId: string, limit: number = 50): Promise<any[]> {
    const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId)}/events?limit=${limit}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  async getIntelligence(runtimeId: string): Promise<any> {
    const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId)}/intelligence`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  async triggerAnalysis(runtimeId: string): Promise<any> {
    const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId)}/intelligence/analyze`, { method: 'POST' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  // Phase 2: Active Sessions
  async getSessions(): Promise<any[]> {
    const res = await fetch('/api/runtime/sessions');
    const data = await res.json();
    return data.data;
  }

  // Phase 2: Suspend
  async suspendSession(uid: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/runtime/sessions/${encodeURIComponent(uid)}/suspend`, { method: 'POST' });
    return res.json();
  }

  // Phase 4 & 7: Governance Actions
  async getGovernanceActions(): Promise<any[]> {
    const res = await fetch('/api/runtime/governance');
    const data = await res.json();
    return data.data;
  }

  // Phase 9: Security Events
  async getSecurityEvents(): Promise<any[]> {
    const res = await fetch('/api/runtime/security');
    const data = await res.json();
    return data.data;
  }

  // Phase 11: Execution Engine
  async getExecutionHistory(): Promise<any[]> {
    const res = await fetch('/api/runtime/execution/history');
    const data = await res.json();
    return data.data;
  }

  async executeCommand(commandId: string, parameters: string = "{}", uid: string = "U-12A4", role: string = "Super Admin"): Promise<{ success: boolean; message: string; violation_type?: string }> {
    const res = await fetch('/api/runtime/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        commandId, 
        parameters, 
        triggeredBy: 'Kernel Workspace',
        uid,
        role
      })
    });
    return res.json();
  }

  async executeTerminalCommand(command: string, cwd?: string, projectId?: string | number): Promise<{ success: boolean, message?: string, data?: { stdout: string, stderr: string, error: string | null } }> {
    const res = await fetch('/api/runtime/terminal/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, cwd, projectId })
    });
    return res.json();
  }

  async getPM2Processes(path?: string, runtimeId?: string): Promise<any[]> {
    if (runtimeId) {
       const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId)}/pm2`);
       const data = await res.json();
       if (!data.success) throw new Error(data.message);
       // Handle safe read-only fallback structure
       const p = data.data;
       if (!p.name) return [];
       return [{
          id: p.pid || '-',
          name: p.name || 'Unknown',
          status: p.status || 'unknown',
          cpu: `${p.cpu || 0}%`,
          mem: `${p.memory || 0} MB`,
          uptime: p.uptime ? `${p.uptime}s` : '0s',
          restarts: p.restarts || 0,
          mode: p.exec_mode || 'fork',
          path: 'Runtime Isolated',
          port: 'N/A',
          isReadOnly: true
       }];
    }
    const url = path ? `/api/runtime/pm2/list?path=${encodeURIComponent(path)}` : '/api/runtime/pm2/list';
    const res = await fetch(url);
    const data = await res.json();
    return data.data;
  }

  async performPM2Action(action: string, id: number): Promise<{ success: boolean, message: string }> {
    const res = await fetch('/api/runtime/pm2/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, id })
    });
    return res.json();
  }

  async getPM2Logs(id: number): Promise<string> {
    const res = await fetch(`/api/runtime/pm2/logs/${id}`);
    const data = await res.json();
    return data.data;
  }

  // --- Runtime File System Methods ---
  async listFiles(path: string = '.', root?: string, projectId?: string | number): Promise<any[]> {
    const queryPath = path === '.' ? '' : path;
    
    // Scoped Runtime Mode
    if (projectId) {
      const params = new URLSearchParams({
        path: queryPath || '.',
        projectId: projectId.toString(),
      });
      if (root) params.set('root', root);
      const res = await fetch(`/api/runtime/files/list?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data.data;
    }
    
    // Global Infrastructure Mode
    const res = await fetch(`/api/files/list?path=${encodeURIComponent(queryPath)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  async readFile(path: string, root?: string, projectId?: string | number): Promise<string> {
    const url = projectId 
      ? `/api/runtime/files/read?path=${encodeURIComponent(path)}&projectId=${encodeURIComponent(projectId.toString())}`
      : `/api/files/read?path=${encodeURIComponent(path)}`;
      
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }

  async writeFile(path: string, content: string, root?: string, projectId?: string | number): Promise<void> {
    const url = projectId ? '/api/runtime/files/write' : '/api/files/write';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, root, projectId })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  }

  async deleteFiles(paths: string[], root?: string, projectId?: string | number): Promise<void> {
    const url = projectId ? '/api/runtime/files/delete' : '/api/files/delete';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths, root, projectId })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  }

  async createDirectory(path: string, root?: string, projectId?: string | number): Promise<void> {
    const url = projectId ? '/api/runtime/files/mkdir' : '/api/files/mkdir';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, root, projectId })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  }

  async uploadFile(path: string, name: string, content: string, root?: string, projectId?: string | number): Promise<void> {
    const url = projectId ? '/api/runtime/files/upload' : '/api/files/upload';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, name, content, root, projectId })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  }

  async searchRuntimeFiles(
    q: string,
    path: string = '.',
    includeSubdirs: boolean = false,
    root?: string,
    projectId?: string | number
  ): Promise<any[]> {
    const params = new URLSearchParams({
      q,
      path,
      includeSubdirs: includeSubdirs ? 'true' : 'false',
    });
    if (root) params.set('root', root);
    if (projectId) params.set('projectId', projectId.toString());
    const res = await fetch(`/api/runtime/files/search?${params.toString()}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Search failed');
    return data.data || [];
  }

  async getPolicyViolations(): Promise<any[]> {
    const res = await fetch('/api/runtime/policies/violations');
    const data = await res.json();
    return data.data;
  }

  async getCommandPolicy(commandId: string): Promise<any> {
    const res = await fetch(`/api/runtime/policies/${commandId}`);
    const data = await res.json();
    return data.data;
  }

  // Phase 13: Operational Intelligence
  async getInfrastructureDiscovery(timeoutMs: number = 10000): Promise<any> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch('/api/runtime/infrastructure/discovery', { signal: controller.signal });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Infrastructure discovery failed');
      return data.data;
    } finally {
      window.clearTimeout(timer);
    }
  }

  async getNodes(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/nodes');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      // console.error('Failed to fetch nodes:', e);
      return [];
    }
  }

  async getAgents(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/agents');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch agents:', e);
      return [];
    }
  }

  async getIntelligenceSignals(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/intelligence/signals');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch signals:', e);
      return [];
    }
  }

  // Phase 14: CI/CD Pipeline API
  async getPipelines(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/pipelines');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch pipelines:', e);
      return [];
    }
  }

  async getPipelineJobs(pipelineId: string): Promise<any[]> {
    try {
      const res = await fetch(`/api/runtime/pipelines/${pipelineId}/jobs`);
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch pipeline jobs:', e);
      return [];
    }
  }

  async getArtifacts(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/artifacts');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch artifacts:', e);
      return [];
    }
  }

  async triggerPipeline(name: string, env: string): Promise<{ success: boolean; pipelineId: string }> {
    try {
      const res = await fetch('/api/runtime/pipelines/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, env, user: 'U-12A4' })
      });
      return res.json();
    } catch (e) {
      return { success: false, pipelineId: '' };
    }
  }

  // Phase 15: Recovery & Stability API
  async getRestorePoints(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/recovery/restore-points');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch restore points:', e);
      return [];
    }
  }

  async getStabilityIndex(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/stability/index');
      if (!res.ok) {
        console.error(`StabilityIndex fetch error: ${res.status} ${res.statusText}`);
        return [];
      }
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        return data.data || [];
      } catch (e) {
        console.error("Failed to parse StabilityIndex JSON:", text);
        return [];
      }
    } catch (e) {
      // console.error('Failed to fetch stability index:', e);
      return [];
    }
  }

  async getRecommendations(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/intelligence/recommendations');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch recommendations:', e);
      return [];
    }
  }

  // Phase 17: Predictive Operational Intelligence API
  async getFailureForecast(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/intelligence/forecast');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      // console.error('Failed to fetch failure forecast:', e);
      return [];
    }
  }

  async getOptimizationStrategy(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/intelligence/optimization');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch optimization strategy:', e);
      return [];
    }
  }

  async getDeploymentRiskScore(pipelineName: string): Promise<any> {
    try {
      const res = await fetch(`/api/runtime/intelligence/deployment-risk/${pipelineName}`);
      const data = await res.json();
      return data.data || { risk_score: 0 };
    } catch (e) {
      return { risk_score: 0 };
    }
  }

  async getAnomalyForecasting(): Promise<any[]> {
    try {
      const res = await fetch('/api/runtime/intelligence/anomaly-stream');
      const data = await res.json();
      return data.data || [];
    } catch (e) {
      console.error('Failed to fetch anomaly forecast:', e);
      return [];
    }
  }

  async getRiskIndicators(): Promise<any> {
    try {
      const res = await fetch('/api/runtime/intelligence/risk-indicators');
      const data = await res.json();
      return data.data || {};
    } catch (e) {
      return {};
    }
  }

  async executeRestore(restoreId: string): Promise<any> {
    const res = await fetch('/api/runtime/recovery/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restoreId })
    });
    return res.json();
  }

  // Phase 16: Hardening & Coordination API
  async getProtectionLocks(): Promise<any[]> {
    const res = await fetch('/api/runtime/hardening/locks');
    const data = await res.json();
    return data.data;
  }

  async getCoordinationStates(): Promise<any[]> {
    const res = await fetch('/api/runtime/coordination/states');
    const data = await res.json();
    return data.data;
  }

  async toggleLock(id: string, status: string): Promise<any> {
    const res = await fetch(`/api/runtime/hardening/locks/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  }

  async clearCache(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/runtime/action/clear-cache', { method: 'POST' });
    return res.json();
  }

  async reloadEnv(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/runtime/action/reload-env', { method: 'POST' });
    return res.json();
  }

  // Phase 18: Operational Simulation
  async getSimulationState(): Promise<any> {
    const res = await fetch('/api/runtime/simulation/state');
    const data = await res.json();
    return data.data;
  }

  async toggleStressMode(active: boolean, chaosLevel: number = 0): Promise<any> {
    const res = await fetch('/api/runtime/simulation/stress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active, chaosLevel })
    });
    return res.json();
  }

  async toggleRecoveryDrill(active: boolean): Promise<any> {
    const res = await fetch('/api/runtime/simulation/drill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    return res.json();
  }
  // Mobile Runtime Methods
  async performProjectAction(projectId: string | number, action: string, path?: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const res = await fetch('/api/runtime/projects/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, action, path })
    });
    return res.json();
  }

  async getMobileApps(): Promise<any[]> {
    const res = await fetch('/api/runtime/mobile/list');
    const data = await res.json();
    return data.data || [];
  }

  async sendMobilePush(appId: number, title: string, body: string): Promise<{success: boolean, message: string}> {
    const res = await fetch('/api/runtime/mobile/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, title, body })
    });
    return res.json();
  }

  async deployMobileApp(appId: number): Promise<{success: boolean, message: string}> {
    const res = await fetch('/api/runtime/mobile/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId })
    });
    return res.json();
  }

  async updateMobileSettings(appId: number, settings: any): Promise<{success: boolean, message: string}> {
    const res = await fetch('/api/runtime/mobile/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, settings })
    });
    return res.json();
  }
  async provisionProject(config: any): Promise<{success: boolean, message: string}> {
    const res = await fetch('/api/runtime/projects/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message);
    }
    return data;
  }

  async getProjects(): Promise<any[]> {
    const res = await fetch('/api/runtime/projects');
    const data = await res.json();
    return data.data || [];
  }

  async getProjectManifest(projectId: string | number, projectPath: string): Promise<{ success: boolean; manifest?: any; message?: string }> {
    const res = await fetch(`/api/runtime/projects/manifest?id=${projectId}&path=${encodeURIComponent(projectPath)}`);
    return res.json();
  }

  async updateProject(id: string | number, project: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/runtime/projects/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, project })
    });
    return res.json();
  }

  async deleteProject(id: string | number, name?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/runtime/projects/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name })
    });
    return res.json();
  }

  async getSettings(): Promise<any[]> {
    const res = await fetch('/api/runtime/settings');
    const data = await res.json();
    return data.data || [];
  }

  async updateSetting(key: string, value: string): Promise<void> {
    const res = await fetch('/api/runtime/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message);
  }

  async scanNode(nodeId: string): Promise<any[]> {
    const res = await fetch(`/api/runtime/nodes/${nodeId}/scan`, { method: 'POST' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.discoveredProjects || [];
  }

  async importProject(project: any): Promise<{success: boolean, id: string, message?: string}> {
    const res = await fetch('/api/runtime/projects/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    return res.json();
  }

  async discoverProject(path: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const res = await fetch(`/api/runtime/discover?path=${encodeURIComponent(path)}`);
    return res.json();
  }

  async registerServer(config: any): Promise<{success: boolean, message: string, serverInfo: any}> {
    const res = await fetch('/api/runtime/servers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message);
    }
    return data;
  }

  async performNodeAction(nodeId: string, action: string): Promise<{ success: boolean, message: string }> {
    const res = await fetch(`/api/runtime/nodes/${nodeId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    return res.json();
  }

  async deleteNode(nodeId: string): Promise<{ success: boolean, message: string }> {
    const res = await fetch(`/api/runtime/nodes/${nodeId}`, {
      method: 'DELETE'
    });
    return res.json();
  }

  async getProjectEnvironmentBindings(projectId: string | number): Promise<any[]> {
    const res = await fetch(`/api/runtime/projects/${encodeURIComponent(projectId.toString())}/environments`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch environment bindings');
    return data.data || [];
  }

  async getRuntimeDeployments(runtimeId: string | number): Promise<any[]> {
    const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId.toString())}/deployments`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch deployments');
    return data.data || [];
  }

  async runGovernedDeploy(runtimeId: string | number, branch?: string): Promise<any> {
    const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId.toString())}/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Deploy failed');
    return data.data;
  }

  async getRuntimeSnapshots(runtimeId: string | number): Promise<any[]> {
    const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId.toString())}/snapshots`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch runtime snapshots');
    return data.data || [];
  }

  async getRuntimeRecoveries(runtimeId: string | number): Promise<any[]> {
    const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId.toString())}/recoveries`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch runtime recoveries');
    return data.data || [];
  }

  async runRuntimeRollback(runtimeId: string | number, snapshotId: string): Promise<any> {
    const res = await fetch(`/api/runtime/${encodeURIComponent(runtimeId.toString())}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotId })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Rollback failed');
    return data.data;
  }
}

export const runtimeAPI = new RuntimeAPI();
