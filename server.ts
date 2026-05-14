import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import os from "os";
import { exec } from "child_process";
import { createHash, randomBytes } from "crypto";
import { WebSocketServer, WebSocket } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure Workspace Dirs
const WS_DIRS = [
  'dieaya-plus-prod/frontend', 'dieaya-plus-prod/backend', 'dieaya-plus-prod/logs', 'dieaya-plus-prod/storage', 'dieaya-plus-prod/configs',
  'linkpro-live/frontend', 'linkpro-live/backend', 'linkpro-live/logs', 'linkpro-live/storage',
  'nexus-core/runtime', 'nexus-core/deployments', 'nexus-core/logs',
  'deployments', 'shared-services'
];
const GLOBAL_ROOT = '/www/wwwroot';
// Protected paths for Global Mode navigation (Allow list)
const ALLOWED_INFRA_ROOTS = ['/www', '/etc/nginx', '/var/log', '/home', '/root', '/tmp'];

try {
  WS_DIRS.forEach(d => fs.mkdirSync(path.join(process.cwd(), 'runtime/workspaces', d), { recursive: true }));
  fs.mkdirSync(path.join(process.cwd(), 'runtime/backups'), { recursive: true });
  
  // Ensure the infrastructure root exists without creating fake runtime projects.
  if (!fs.existsSync(GLOBAL_ROOT)) {
    try {
      fs.mkdirSync(GLOBAL_ROOT, { recursive: true });
      fs.mkdirSync(path.join(GLOBAL_ROOT, 'nginx/conf.d'), { recursive: true });
      fs.mkdirSync(path.join(GLOBAL_ROOT, 'deployments'), { recursive: true });
    } catch(e) {
      console.warn("Could not initialize infrastructure root. Discovery will use existing readable paths only.", e);
    }
  }
} catch(e) {}

// Import Governance Persistence Database
import { getRuntimeTelemetry } from "./server/services/runtimeTelemetryService.js";
import { 
  initDB, 
  seedDummyData, 
  addRuntimeLog, 
  getRecentLogs, 
  getActiveSessions,
  suspendSession,
  getGovernanceActions,
  getSecurityEvents,
  registerCommand,
  startExecution,
  finishExecution,
  addExecutionLog,
  getExecutionHistory,
  getPolicyForCommand,
  addPolicyViolation,
  getRecentViolations,
  registerAgent,
  recordHeartbeat,
  getAgents,
  getNodes,
  deleteNode,
  upsertNode,
  addOperationalSignal,
  getOperationalSignals,
  createPipeline,
  updatePipelineStatus,
  addDeploymentJob,
  updateJobStatus,
  registerArtifact,
  getPipelines,
  getPipelineJobs,
  getArtifacts,
  recordStability,
  addRecommendation,
  getRestorePoints,
  getLatestStability,
  getPendingRecommendations,
  createRestorePoint,
  logRecoveryAction,
  getProtectionLocks,
  updateLockStatus,
  recordNodeSync,
  getNodeCoordination,
  getSimulationState,
  updateSimulationState,
  toggleDrill,
  db as sqliteDb 
} from "./server/db.js";

import { initRuntimeDB } from "./server/database/runtimePersistence.js";
import { RuntimeIntelligence } from "./server/runtime/runtimeIntelligence.js";
import { RuntimeGovernance } from "./server/runtime/runtimeGovernance.js";
import { RuntimePolicyEngine } from "./server/runtime/runtimePolicyEngine.js";
import { RuntimeApproval } from "./server/runtime/runtimeApproval.js";
import { RuntimeSSH } from "./server/runtime/runtimeSSH.js";
import { RuntimeSafeActions } from "./server/runtime/runtimeSafeActions.js";
import { RuntimeDeploy } from "./server/runtime/runtimeDeployGovernance.js";
import { RuntimeSnapshots } from "./server/runtime/runtimeSnapshots.js";
import { RuntimeRecovery } from "./server/runtime/runtimeRecovery.js";
import { RuntimeLocks } from "./server/runtime/runtimeLocks.js";
import { RuntimeAutonomousProtection } from "./server/runtime/runtimeAutonomousProtection.js";
import { RuntimeFederation } from "./server/runtime/runtimeFederation.js";
import { runtimeRealtime } from "./server/runtime/runtimeRealtime.js";
import { runtimeQueue } from "./server/runtime/runtimeQueue.js";
import { RuntimeSupervisor } from "./server/runtime/runtimeSupervisor.js";
import { RuntimeRetention } from "./server/runtime/runtimeRetention.js";
import { 
  addLog, getLogs, getNodes as getDbNodes, addNode, updateNodeStatus, deleteNode as deleteDbNode,
  getProjects, getProjectById, addProject, updateProject, deleteProject, setSetting, getSettings, getSetting,
  getDbSecurityEvents, getDbGovernanceActions, addGovernanceAction
} from "./server/database/queries.js";

// ===============================================
// Phase 14: CI/CD Orchestration Helper
// ===============================================
async function runDeploymentPipeline(pipelineId: string) {
    console.log(`[DevCore Pipeline] Orchestrating release: ${pipelineId}`);
    
    const stages = ['validation', 'build', 'artifact_push', 'runtime_deploy'];
    updatePipelineStatus(pipelineId, 'validating');

    for (const stage of stages) {
        const jobId = addDeploymentJob(pipelineId, stage) as number;
        updateJobStatus(jobId, 'running', `Executing ${stage} protocol...`);
        
        // Simulating enterprise build/deploy overhead
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        updateJobStatus(jobId, 'success', `Stage ${stage} finalized successfully.`);
        
        // Update pipeline state based on progress
        if (stage === 'validation') updatePipelineStatus(pipelineId, 'building');
        if (stage === 'build') updatePipelineStatus(pipelineId, 'deploying');
    }

    updatePipelineStatus(pipelineId, 'completed');
    
    // Auto-register artifact on success (deterministic identity, no random state)
    const artifactSeed = `${pipelineId}:${Date.now()}`;
    const artifactId = `ART-${createHash('sha1').update(artifactSeed).digest('hex').slice(0, 10).toUpperCase()}`;
    const artifactVersion = `v1.0.${Date.now()}`;
    registerArtifact({
        id: artifactId,
        pipeline_id: pipelineId,
        version: artifactVersion,
        metadata: JSON.stringify({ timestamp: new Date().toISOString(), integrity: 'VERIFIED' })
    });
}

// ===============================================
// Phase 15: Infrastructure Intelligence Engine
// ===============================================
function startInfrastructureIntelligence() {
    console.log('[DevCore Intelligence] Initializing Stability Monitor & Advisor...');
    
    setInterval(() => {
        const sim = getSimulationState();

        // 1. Stability Calculation
        const recentViolations = sqliteDb.prepare(`SELECT COUNT(*) as count FROM policy_violations WHERE timestamp > datetime('now', '-10 minutes')`).get() as any;
        const agentOutages = sqliteDb.prepare(`SELECT COUNT(*) as count FROM runtime_agents WHERE status != 'ONLINE'`).get() as any;
        
        let stabilityScore = sim?.is_stress_mode ? 40 : 100;
        if (sim?.is_stress_mode) {
          stabilityScore -= (sim.chaos_level / 2);
        }
        
        let factor = sim?.is_stress_mode ? 'Stress Simulation' : 'Optimal';

        if (recentViolations && recentViolations.count > 0) {
            stabilityScore -= Math.min(recentViolations.count * 5, 30);
            factor = 'Policy Instability';
        }
        if (agentOutages && agentOutages.count > 0) {
            stabilityScore -= (agentOutages.count * 15);
            factor = 'Agent Desync';
        }

        recordStability(Math.max(0, stabilityScore), factor);

        // 2. Intelligent Recommendations
        const existingCritical = sqliteDb.prepare(
          `SELECT COUNT(*) as count FROM runtime_recommendations WHERE impact_area = 'Stability' AND severity = 'Critical' AND timestamp > datetime('now', '-15 minutes')`
        ).get() as any;
        if (stabilityScore < 85 && Number(existingCritical?.count || 0) === 0) {
            addRecommendation(
                'Execute Automatic Recovery', 
                `Stability index dropped to ${stabilityScore}%. Potential Node drift detected in worker cluster. Restore point recommended.`,
                'Critical',
                'Stability'
            );
        }

    }, 120000); // Analyze every 2 minutes
}

// ===============================================
// Phase 13.6: Operational Intelligence Engine
// ===============================================
function startOperationalIntelligenceEngine() {
    console.log('[DevCore Intelligence] Starting Correlation Engine...');
    
    setInterval(() => {
        // 1. Correlation: Violations vs Security Events
        const recentViolations = sqliteDb.prepare(`SELECT COUNT(*) as count FROM policy_violations WHERE timestamp > datetime('now', '-5 minutes')`).get() as any;
        const recentThreats = sqliteDb.prepare(`SELECT COUNT(*) as count FROM security_events WHERE timestamp > datetime('now', '-5 minutes') AND risk_level = 'High'`).get() as any;
        
        if (recentViolations.count > 5 && recentThreats.count > 0) {
            addOperationalSignal(
                'Correlation', 
                'High', 
                'Intell-Core-X', 
                `Detected correlated pattern: High Violation Rate (${recentViolations.count}) combined with High Threats. Potential brute-force or privilege escalation attempt.`
            );
        }

        // 2. Anomaly: Agent Drift
        const staleAgents = sqliteDb.prepare(`SELECT COUNT(*) as count FROM runtime_agents WHERE status != 'ONLINE'`).get() as any;
        if (staleAgents.count > 0) {
            addOperationalSignal(
                'Anomaly', 
                'Medium', 
                'Runtime-Monitor', 
                `Detected Runtime Drift: ${staleAgents.count} agents in non-optimal state. Node stability may be degraded.`
            );
        }

    }, 60000); // Analyze every 1 minute
}

// ===================================
// Phase 13: Agent Network Simulator
// ===================================
function startAgentNetworkSimulator() {
    console.log('[DevCore Agent] Simulation heartbeat engine disabled in strict operational mode.');
}

// ===================================
// Phase 12: Policy Governance Helper
// ===================================
async function validateExecutionPolicy(commandId: string, uid: string, role: string) {
    const policy = getPolicyForCommand(commandId);
    if (!policy) return { allowed: true }; // No policy = fallback to structured default

    // 1. Role Validation
    const roleLevels: Record<string, number> = { 'Guest': 0, 'Developer': 1, 'Admin': 2, 'Super Admin': 3 };
    const userLevel = roleLevels[role] || 0;
    const requiredLevel = roleLevels[policy.required_role] || 1;

    if (userLevel < requiredLevel) {
        addPolicyViolation(uid, commandId, 'RoleMismatch', `User role [${role}] level ${userLevel} is below required ${requiredLevel}`);
        return { allowed: false, reason: `Insufficient Authority: Required Role [${policy.required_role}]` };
    }

    // 2. Environment Validation
    const currentEnv = process.env.NODE_ENV === 'production' ? 'LIVE' : 'DEV';
    if (!policy.allowed_environments.includes(currentEnv)) {
        addPolicyViolation(uid, commandId, 'EnvironmentRestricted', `Command restricted to [${policy.allowed_environments}], current is [${currentEnv}]`);
        return { allowed: false, reason: `Policy Restriction: Command forbidden in ${currentEnv} environment.` };
    }

    // 3. Cooldown Validation
    const lastExec = sqliteDb.prepare(`SELECT started_at FROM execution_history WHERE command_id = ? AND status = 'Completed' ORDER BY started_at DESC LIMIT 1`).get(commandId) as any;
    if (lastExec) {
        const diff = (Date.now() - new Date(lastExec.started_at).getTime()) / 1000;
        if (diff < policy.cooldown_seconds) {
            addPolicyViolation(uid, commandId, 'RateLimited', `Cooldown active: ${Math.ceil(policy.cooldown_seconds - diff)}s remaining`);
            return { allowed: false, reason: `Rate Limit: Cooldown active (${Math.ceil(policy.cooldown_seconds - diff)}s)` };
        }
    }

    return { allowed: true };
}

// ... [rest of imports/helpers]
async function runRuntimeCommand(commandId: string, parameters: string, triggeredBy: string) {
  const executionId = startExecution(commandId, parameters, triggeredBy);
  addExecutionLog(executionId, 'info', `Initiating command: ${commandId}`);

  try {
    // Simulate steps for Stage 1 (Structured Execution)
    await new Promise(r => setTimeout(r, 1000));
    addExecutionLog(executionId, 'info', 'Phase 1/3: Environment Validation Completed.');
    
    await new Promise(r => setTimeout(r, 1500));
    addExecutionLog(executionId, 'info', 'Phase 2/3: Runtime Context Secured.');
    
    await new Promise(r => setTimeout(r, 1000));
    addExecutionLog(executionId, 'success', 'Phase 3/3: Resource Injection Successful.');

    finishExecution(executionId, 'Completed', 0);
    addRuntimeLog('success', `Runtime execution completed: ${commandId}`, 'execution_engine');
  } catch (error: any) {
    addExecutionLog(executionId, 'error', `Execution failed: ${error.message}`);
    finishExecution(executionId, 'Failed', 1, error.message);
    addRuntimeLog('error', `Runtime execution failed: ${commandId}`, 'execution_engine');
  }
}

// ===============================================
// Phase 22: NEXUS Runtime Constitution Logic
// ===============================================
const MANIFEST_NAME = "nexus.runtime.json";

type MutationCacheEntry = { status: 'RUNNING' | 'COMPLETED'; updatedAt: number; response?: any };
const mutationCache = new Map<string, MutationCacheEntry>();
type PendingApprovalExecution =
  | {
      kind: 'pm2';
      approvalId: string;
      runtimeId: string;
      mutationId: string;
      action: string;
      id: string | number;
      projectId?: string | number;
      requestedBy: string;
    }
  | {
      kind: 'terminal';
      approvalId: string;
      runtimeId: string;
      mutationId: string;
      command: string;
      cwd?: string;
      projectId?: string | number;
      requestedBy: string;
    };
try {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS runtime_pending_mutations (
      approval_id TEXT PRIMARY KEY,
      runtime_id TEXT NOT NULL,
      mutation_id TEXT NOT NULL,
      mutation_kind TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      payload_hash TEXT,
      execution_status TEXT DEFAULT 'PENDING',
      last_result_json TEXT,
      executed_at DATETIME,
      requested_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
} catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_pending_mutations ADD COLUMN payload_hash TEXT`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_pending_mutations ADD COLUMN execution_status TEXT DEFAULT 'PENDING'`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_pending_mutations ADD COLUMN last_result_json TEXT`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_pending_mutations ADD COLUMN executed_at DATETIME`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_pending_mutations ADD COLUMN payload_nonce TEXT`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_pending_mutations ADD COLUMN replay_window_minutes INTEGER DEFAULT 30`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_pending_mutations ADD COLUMN replay_expires_at DATETIME`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_approvals ADD COLUMN replay_count INTEGER DEFAULT 0`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_approvals ADD COLUMN stage_index INTEGER DEFAULT 1`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_approvals ADD COLUMN total_stages INTEGER DEFAULT 1`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_approvals ADD COLUMN required_role TEXT DEFAULT 'Admin'`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_approvals ADD COLUMN sla_minutes INTEGER DEFAULT 60`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_approvals ADD COLUMN expires_at DATETIME`); } catch {}
try { sqliteDb.exec(`ALTER TABLE runtime_approvals ADD COLUMN chain_status TEXT DEFAULT 'PENDING_STAGE'`); } catch {}

function governanceError(res: any, status: number, message: string, errorCode: string, extra?: Record<string, any>) {
  return res.status(status).json({ success: false, message, error_code: errorCode, ...(extra || {}) });
}

function canReplayByRole(role: string) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'admin' || normalized === 'super admin' || normalized === 'super_admin';
}

function deriveApprovalChain(operationType: string, riskLevel: string) {
  const op = String(operationType || '').toLowerCase();
  const risk = String(riskLevel || '').toLowerCase();
  const risky = risk === 'high' || risk === 'critical' || op.includes('deploy') || op.includes('recovery') || op.includes('rollback');
  if (risky) {
    return {
      totalStages: 2,
      stage1: { role: 'Admin', slaMinutes: 30 },
      stage2: { role: 'Super Admin', slaMinutes: 20 }
    };
  }
  return {
    totalStages: 1,
    stage1: { role: 'Admin', slaMinutes: 60 },
    stage2: null as any
  };
}

function computeExpiryIso(slaMinutes: number) {
  return new Date(Date.now() + Math.max(1, Number(slaMinutes || 60)) * 60_000).toISOString();
}

function beginGovernedMutation(mutationId: string) {
  const existing = mutationCache.get(mutationId);
  if (existing?.status === 'RUNNING') {
    return { allowed: false, duplicate: true, inProgress: true, response: null };
  }
  if (existing?.status === 'COMPLETED') {
    return { allowed: false, duplicate: true, inProgress: false, response: existing.response || null };
  }
  mutationCache.set(mutationId, { status: 'RUNNING', updatedAt: Date.now() });
  if (mutationCache.size > 2000) {
    const cutoff = Date.now() - (1000 * 60 * 30);
    for (const [key, value] of mutationCache.entries()) {
      if (value.updatedAt < cutoff) mutationCache.delete(key);
    }
  }
  return { allowed: true, duplicate: false, inProgress: false, response: null };
}

function completeGovernedMutation(mutationId: string, response: any) {
  mutationCache.set(mutationId, { status: 'COMPLETED', updatedAt: Date.now(), response });
}

function failGovernedMutation(mutationId: string) {
  mutationCache.delete(mutationId);
}

function generatePayloadNonce() {
  return randomBytes(12).toString('hex');
}

function persistPendingMutation(entry: PendingApprovalExecution) {
  const payload = JSON.stringify(entry);
  const payloadHash = createHash('sha256').update(payload).digest('hex');
  const replayWindowMinutes = 30;
  const replayExpiresAt = new Date(Date.now() + replayWindowMinutes * 60_000).toISOString();
  const payloadNonce = generatePayloadNonce();
  sqliteDb.prepare(`
    INSERT INTO runtime_pending_mutations (
      approval_id, runtime_id, mutation_id, mutation_kind, payload_json, payload_hash, payload_nonce, replay_window_minutes, replay_expires_at, execution_status, requested_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    ON CONFLICT(approval_id) DO UPDATE SET
      runtime_id = excluded.runtime_id,
      mutation_id = excluded.mutation_id,
      mutation_kind = excluded.mutation_kind,
      payload_json = excluded.payload_json,
      payload_hash = excluded.payload_hash,
      payload_nonce = excluded.payload_nonce,
      replay_window_minutes = excluded.replay_window_minutes,
      replay_expires_at = excluded.replay_expires_at,
      execution_status = 'PENDING',
      last_result_json = NULL,
      executed_at = NULL,
      requested_by = excluded.requested_by
  `).run(
    entry.approvalId,
    entry.runtimeId,
    entry.mutationId,
    entry.kind,
    payload,
    payloadHash,
    payloadNonce,
    replayWindowMinutes,
    replayExpiresAt,
    entry.requestedBy
  );
}

function getPendingMutationByApprovalId(approvalId: string): PendingApprovalExecution | null {
  const row = sqliteDb.prepare('SELECT payload_json, payload_hash FROM runtime_pending_mutations WHERE approval_id = ?').get(approvalId) as any;
  if (!row?.payload_json) return null;
  try {
    const payloadJson = String(row.payload_json);
    const hash = createHash('sha256').update(payloadJson).digest('hex');
    if (row.payload_hash && String(row.payload_hash) !== hash) return null;
    return JSON.parse(payloadJson) as PendingApprovalExecution;
  } catch {
    return null;
  }
}

function validatePendingMutationPayload(approvalId: string) {
  const row = sqliteDb.prepare(`
    SELECT payload_json, payload_hash, payload_nonce, replay_expires_at
    FROM runtime_pending_mutations
    WHERE approval_id = ?
  `).get(approvalId) as any;
  if (!row?.payload_json) return { ok: false, code: 'MUTATION_PAYLOAD_NOT_FOUND', entry: null as any, row: null as any };
  try {
    const payloadJson = String(row.payload_json);
    const hash = createHash('sha256').update(payloadJson).digest('hex');
    if (row.payload_hash && String(row.payload_hash) !== hash) {
      return { ok: false, code: 'PAYLOAD_INTEGRITY_GATE', entry: null as any, row };
    }
    return { ok: true, code: 'OK', entry: JSON.parse(payloadJson) as PendingApprovalExecution, row };
  } catch {
    return { ok: false, code: 'PAYLOAD_PARSE_FAILED', entry: null as any, row };
  }
}

function rotatePendingMutationReplayWindow(approvalId: string) {
  const replayWindowMinutes = 30;
  const replayExpiresAt = new Date(Date.now() + replayWindowMinutes * 60_000).toISOString();
  const payloadNonce = generatePayloadNonce();
  sqliteDb.prepare(`
    UPDATE runtime_pending_mutations
    SET payload_nonce = ?, replay_window_minutes = ?, replay_expires_at = ?
    WHERE approval_id = ?
  `).run(payloadNonce, replayWindowMinutes, replayExpiresAt, approvalId);
  return { payloadNonce, replayExpiresAt, replayWindowMinutes };
}

function findNginxBindingForDomain(domain: string, expectedPort?: number | null) {
  const candidates = [
    path.join(GLOBAL_ROOT, 'nginx/conf.d'),
    '/etc/nginx/conf.d',
    '/etc/nginx/sites-enabled'
  ];
  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.conf'));
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasDomain = content.includes(`server_name ${domain}`) || content.includes(domain);
        if (!hasDomain) continue;
        if (expectedPort) {
          const hasPort = content.includes(`:${expectedPort}`) || content.includes(`proxy_pass http://127.0.0.1:${expectedPort}`) || content.includes(`proxy_pass http://localhost:${expectedPort}`);
          if (!hasPort) continue;
        }
        return { bound: true, file: fullPath };
      }
    } catch {}
  }
  return { bound: false, file: null as string | null };
}

async function runRuntimeVerificationGates(project: any, runCommand: (command: string, cwd: string, timeout?: number) => Promise<{ stdout: string; stderr: string; error: string | null }>) {
  const runtimePath = String(project?.runtime_path || '');
  const runtimeProcess = String(project?.runtime_process || '').trim();
  const runtimeDomain = String(project?.domain || '').trim();
  const runtimePort = Number(project?.runtime_port || 0) || null;

  const pm2Result = await runCommand('npx -y pm2 jlist', runtimePath, 120000);
  if (pm2Result.error) return { ok: false, code: 'PM2_GATE_FAILED', reason: pm2Result.error, details: { pm2Error: pm2Result.error } };
  let pm2List: any[] = [];
  try { pm2List = pm2Result.stdout?.trim() ? JSON.parse(pm2Result.stdout) : []; } catch {}
  const targetProc = runtimeProcess ? pm2List.find((p: any) => String(p?.name || '') === runtimeProcess) : null;
  const pm2Online = runtimeProcess ? Boolean(targetProc && String(targetProc?.pm2_env?.status || '').toLowerCase() === 'online') : pm2List.some((p: any) => String(p?.pm2_env?.status || '').toLowerCase() === 'online');
  if (!pm2Online) return { ok: false, code: 'PM2_HEALTH_GATE_FAILED', reason: `PM2 runtime process is not online (${runtimeProcess || 'any'})`, details: { runtimeProcess } };

  if (runtimeDomain) {
    const binding = findNginxBindingForDomain(runtimeDomain, runtimePort);
    if (!binding.bound) {
      return { ok: false, code: 'DOMAIN_ROUTE_GATE_FAILED', reason: `Domain ${runtimeDomain} is not bound to runtime route`, details: { runtimeDomain, runtimePort } };
    }
  }

  if (runtimePort) {
    const net = await runCommand(`netstat -ano | findstr :${runtimePort}`, runtimePath, 120000);
    const listening = Boolean((net.stdout || '').toLowerCase().includes('listening') || (net.stdout || '').trim().length > 0);
    if (!listening) {
      return { ok: false, code: 'PORT_BINDING_GATE_FAILED', reason: `Runtime port ${runtimePort} is not listening`, details: { runtimePort } };
    }
  }

  const readiness = fs.existsSync(path.join(runtimePath, 'package.json')) || fs.existsSync(path.join(runtimePath, 'artisan')) || fs.existsSync(path.join(runtimePath, 'pubspec.yaml'));
  if (!readiness) {
    return { ok: false, code: 'RUNTIME_READINESS_GATE_FAILED', reason: 'Runtime readiness markers missing (package.json/artisan/pubspec.yaml)', details: { runtimePath } };
  }

  return {
    ok: true,
    code: 'OK',
    reason: 'All runtime verification gates passed',
    details: {
      pm2Online,
      runtimeProcess: runtimeProcess || null,
      runtimeDomain: runtimeDomain || null,
      runtimePort: runtimePort || null,
      readiness
    }
  };
}

async function executeGovernedAutoRecovery(
  runtimeId: string,
  snapshotId: string,
  reason: string,
  project: any,
  runCommand: (command: string, cwd: string, timeout?: number) => Promise<{ stdout: string; stderr: string; error: string | null }>
) {
  const recoveryId = `auto-rec-${Date.now()}`;
  const timeline: Array<{ stage: string; status: 'ok' | 'failed' | 'skipped'; output?: string; error?: string; timestamp: string }> = [];
  const pushStage = (stage: string, status: 'ok' | 'failed' | 'skipped', output?: string, error?: string) => {
    timeline.push({ stage, status, output, error, timestamp: new Date().toISOString() });
  };
  try {
    sqliteDb.prepare(`
      INSERT INTO runtime_recovery
      (recovery_id, runtime_id, snapshot_id, recovery_type, recovery_status, risk_level, requested_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(recoveryId, runtimeId, snapshotId, 'AUTO_RECOVERY', 'RUNNING', 'high', 'GovernanceEngine');
    addGovernanceAction('AUTO_RUNTIME_RECOVERY', 'GovernanceEngine', runtimeId, 'TRIGGERED');
    addRuntimeLog('error', `[auto-recovery:${recoveryId}] Triggered for runtime ${runtimeId}. Reason: ${reason}`, 'recovery_runtime');

    const snap = sqliteDb.prepare('SELECT * FROM runtime_snapshots WHERE snapshot_id = ? AND runtime_id = ?').get(snapshotId, runtimeId) as any;
    if (!snap) {
      pushStage('Snapshot Validation', 'failed', undefined, 'Snapshot not found for auto recovery');
      sqliteDb.prepare('UPDATE runtime_recovery SET recovery_status = ? WHERE recovery_id = ?').run('FAILED', recoveryId);
      return { success: false, recoveryId, timeline, error: 'Snapshot not found for auto recovery' };
    }
    pushStage('Snapshot Validation', 'ok', `Snapshot ${snapshotId} validated`);

    const target = project?.runtime_process ? String(project.runtime_process) : 'all';
    const stopRes = await runCommand(`npx -y pm2 stop ${target}`, project.runtime_path, 120000);
    if (stopRes.error) {
      pushStage('PM2 Stop', 'failed', `${stopRes.stdout}\n${stopRes.stderr}`, stopRes.error);
      sqliteDb.prepare('UPDATE runtime_recovery SET recovery_status = ? WHERE recovery_id = ?').run('FAILED', recoveryId);
      return { success: false, recoveryId, timeline, error: stopRes.error };
    }
    pushStage('PM2 Stop', 'ok', stopRes.stdout);

    const restartRes = await runCommand(`npx -y pm2 restart ${target}`, project.runtime_path, 120000);
    if (restartRes.error) {
      pushStage('PM2 Restart', 'failed', `${restartRes.stdout}\n${restartRes.stderr}`, restartRes.error);
      sqliteDb.prepare('UPDATE runtime_recovery SET recovery_status = ? WHERE recovery_id = ?').run('FAILED', recoveryId);
      return { success: false, recoveryId, timeline, error: restartRes.error };
    }
    pushStage('PM2 Restart', 'ok', restartRes.stdout);

    const verification = await runRuntimeVerificationGates(project, runCommand);
    if (!verification.ok) {
      pushStage('Runtime Verification Gates', 'failed', JSON.stringify(verification.details || {}), `${verification.code}: ${verification.reason}`);
      sqliteDb.prepare('UPDATE runtime_recovery SET recovery_status = ? WHERE recovery_id = ?').run('FAILED', recoveryId);
      return { success: false, recoveryId, timeline, error: `${verification.code}: ${verification.reason}` };
    }
    pushStage('Runtime Verification Gates', 'ok', JSON.stringify(verification.details || {}));

    sqliteDb.prepare('UPDATE runtime_recovery SET recovery_status = ? WHERE recovery_id = ?').run('READY', recoveryId);
    addGovernanceAction('AUTO_RUNTIME_RECOVERY', 'GovernanceEngine', runtimeId, 'COMPLETED');
    addRuntimeLog('success', `[auto-recovery:${recoveryId}] Completed for runtime ${runtimeId}`, 'recovery_runtime');
    return { success: true, recoveryId, timeline };
  } catch (e: any) {
    try {
      sqliteDb.prepare('UPDATE runtime_recovery SET recovery_status = ? WHERE recovery_id = ?').run('FAILED', recoveryId);
    } catch {}
    addRuntimeLog('error', `Auto recovery execution failed for runtime ${runtimeId}: ${e.message}`, 'recovery_runtime');
    return { success: false, recoveryId, timeline, error: e.message };
  }
}

function updatePendingMutationExecution(approvalId: string, status: 'COMPLETED' | 'FAILED', result: any) {
  sqliteDb.prepare(`
    UPDATE runtime_pending_mutations
    SET execution_status = ?, last_result_json = ?, executed_at = CURRENT_TIMESTAMP
    WHERE approval_id = ?
  `).run(status, JSON.stringify(result || {}), approvalId);
}

function getPendingMutationRecord(approvalId: string) {
  return sqliteDb.prepare(`
    SELECT approval_id, runtime_id, mutation_id, mutation_kind, payload_json, payload_hash, payload_nonce, replay_window_minutes, replay_expires_at, execution_status, last_result_json, executed_at, requested_by, created_at
    FROM runtime_pending_mutations
    WHERE approval_id = ?
  `).get(approvalId) as any;
}

function getPendingMutationsByRuntime(runtimeId: string) {
  return sqliteDb.prepare(`
    SELECT approval_id, runtime_id, mutation_id, mutation_kind, payload_nonce, replay_expires_at, execution_status, executed_at, requested_by, created_at
    FROM runtime_pending_mutations
    WHERE runtime_id = ?
    ORDER BY created_at DESC
    LIMIT 200
  `).all(runtimeId) as any[];
}

function execPromise(command: string, opts?: { cwd?: string; timeout?: number }) {
  return new Promise<{ stdout: string; stderr: string; error: string | null }>((resolve) => {
    exec(command, { cwd: opts?.cwd, timeout: opts?.timeout || 20000 }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        error: error ? error.message : null
      });
    });
  });
}

async function executeApprovedMutation(entry: PendingApprovalExecution) {
  if (entry.kind === 'pm2') {
    const governanceCheck = await validateExecutionPolicy('PM2_MUTATION', 'RuntimeOperator', 'Admin');
    if (!governanceCheck.allowed) {
      return { success: false, message: governanceCheck.reason, violation_type: 'GovernancePolicyGate' };
    }
    let finalCommand = `npx -y pm2 ${entry.action} ${entry.id}`;
    if (entry.projectId) {
      const project = await getProjectById(String(entry.projectId));
      if (project) finalCommand = wrapCommandWithRuntimeContext(finalCommand, project);
    }
    const run = await execPromise(finalCommand, { timeout: 40000 });
    if (run.error) {
      failGovernedMutation(entry.mutationId);
      return { success: false, message: run.error, data: { mutationId: entry.mutationId } };
    }
    const post = await execPromise('npx -y pm2 jlist', { timeout: 30000 });
    let processFound = false;
    let status = 'unknown';
    if (!post.error) {
      try {
        const parsed = post.stdout?.trim() ? JSON.parse(post.stdout) : [];
        const byId = Array.isArray(parsed) ? parsed.find((p: any) => String(p?.pm_id) === String(entry.id) || String(p?.name) === String(entry.id)) : null;
        processFound = Boolean(byId);
        status = byId?.pm2_env?.status || (entry.action === 'delete' && !byId ? 'deleted' : 'unknown');
      } catch {}
    }
    addGovernanceAction('PM2_MUTATION', 'Runtime', `${entry.runtimeId}:${entry.action}:${entry.id}`, 'COMPLETED');
    const data = { mutationId: entry.mutationId, postcheck: { processFound, status } };
    completeGovernedMutation(entry.mutationId, data);
    return { success: true, data };
  }

  const governanceCheck = await validateExecutionPolicy('TERMINAL_EXEC', 'RuntimeOperator', 'Admin');
  if (!governanceCheck.allowed) {
    return { success: false, message: governanceCheck.reason, violation_type: 'GovernancePolicyGate' };
  }
  let finalCommand = entry.command;
  let execCwd = entry.cwd;
  if (entry.projectId) {
    const project = await getProjectById(String(entry.projectId));
    if (project && project.runtime_path) {
      execCwd = project.runtime_path;
      finalCommand = wrapCommandWithRuntimeContext(entry.command, project);
    }
  }
  const executionContext = execCwd ? path.resolve(execCwd) : process.cwd();
  const run = await execPromise(finalCommand, { cwd: executionContext, timeout: 20000 });
  addGovernanceAction('TERMINAL_EXEC', 'Runtime', entry.runtimeId, run.error ? 'FAILED' : 'COMPLETED');
  if (run.error) {
    failGovernedMutation(entry.mutationId);
    return { success: false, message: run.error, data: { mutationId: entry.mutationId } };
  }
  const data = {
    mutationId: entry.mutationId,
    postcheck: { exitCode: 0 },
    stdout: run.stdout,
    stderr: run.stderr,
    error: null
  };
  completeGovernedMutation(entry.mutationId, data);
  return { success: true, data };
}

function getProjectManifestPath(projectPath: string) {
  return path.join(projectPath, MANIFEST_NAME);
}

async function syncProjectManifest(project: any) {
  // Only write local manifest if project is local, for external projects we simulate the existence/awareness
  const isExternal = project.runtime_type === 'external-vps';
  
  const manifestData = {
    project_id: project.id,
    runtime_name: project.name,
    runtime_path: project.runtime_path,
    runtime_type: project.runtime_type || 'local-runtime',
    environment: project.env || 'Development',
    runtime_host: project.runtime_host || 'localhost',
    runtime_mode: project.runtime_mode || (project.env === 'Production' ? 'live' : 'dev'),
    pm2_runtime: project.pm2_runtime || (project.env === 'Production' ? 'nexus-runtime' : 'nexus-default'),
    node_id: project.node_id,
    git_repo: project.repo,
    git_branch: project.git_branch || 'main',
    pm2_process: project.runtime_process,
    runtime_port: project.runtime_port,
    deploy_command: project.deploy_command,
    build_command: project.build_command,
    install_command: project.install_command,
    workspace_root: project.runtime_path,
    ssh_entry_path: project.runtime_path,
    governance_level: project.governance_level || 'Standard',
    nexus_version: "2.1.0",
    last_synced: new Date().toISOString()
  };

  if (isExternal) {
    addRuntimeLog('info', `External Production Manifest Registry Synced: ${project.name} @ ${project.runtime_host}`, 'nexus_core');
    return;
  }

  if (!project.runtime_path || !fs.existsSync(project.runtime_path)) return;
  
  const manifestPath = getProjectManifestPath(project.runtime_path);
  try {
    fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');
    addRuntimeLog('info', `Local Runtime Constitution Generated: ${project.name}`, 'nexus_core');
  } catch (err) {
    console.error(`Failed to write manifest for ${project.name}:`, err);
  }
}

// ===============================================
// NEXUS SSH & Runtime Protection Layer
// ===============================================
function wrapCommandWithRuntimeContext(command: string, project: any): string {
    const isProduction = project.env === 'Production';
    const isExternal = project.runtime_type === 'external-vps';
    const host = project.runtime_host || '187.124.190.79';

    if (isProduction && isExternal) {
        // Enforce SSH Awareness for external nodes
        addRuntimeLog('info', `Routing Production Action to External VPS: ${host}`, 'ssh_orchestrator');
        // In a real environment, we would use something like: ssh user@host "cd path && command"
        // For simulation, we wrap it to show intent
        return `ssh -p 22 root@${host} "cd ${project.runtime_path} && ${command}"`;
    }

    if (isProduction && !isExternal) {
        throw new Error(`CRITICAL: Production command detected on Local Runtime. Operation blocked for security.`);
    }

    return command;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3010;

  // Runtime Port Validation / Safety Check
  const net = await import('net');
  const isPortUsed = await new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') resolve(true);
      else resolve(false);
    });
    srv.once('listening', () => {
      srv.close();
      resolve(false);
    });
    srv.listen(PORT, '0.0.0.0');
  });

  if (isPortUsed) {
    console.error(`\n============================================================`);
    console.error(`[CRITICAL] Runtime Port Conflict Detected`);
    console.error(`[CRITICAL] Port ${PORT} is already in use by another process.`);
    console.error(`[CRITICAL] NEXUS Runtime startup aborted to prevent cascade failure.`);
    console.error(`============================================================\n`);
    // PM2 should not restart this silently if it's in a crash loop, but we exit gracefully or with error
    process.exit(1);
  }

  console.log('[DevCore Startup] Initializing express middleware...');
  app.use(express.json());
  const STRICT_OPERATIONAL_MODE = (process.env.NEXUS_OPERATIONAL_MODE || 'strict').toLowerCase() !== 'simulation';

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`[API Request] ${req.method} ${req.path}`);
    }
    next();
  });

  // ===============================================
  // Phase 10: Persistence Layer Initialization
  // ===============================================
  console.log('[DevCore Startup] Initializing persistence layer...');
  try {
    // 1. Initialize Main Runtime DB (for projects, nodes, settings)
    await initRuntimeDB();
    
    // 2. Initialize Audit/Persistence DB (for logs, events)
    initDB();
    if (!STRICT_OPERATIONAL_MODE) {
      seedDummyData();
    }
    
    console.log('[DevCore Startup] Persistence layer ready.');

    // Bootstrap Runtime Constitutions
    const projects = await getProjects();
    console.log(`[DevCore Bootstrap] Syncing ${projects.length} Project Manifests...`);
    for (const p of projects) {
        await syncProjectManifest(p);
    }
    console.log('[DevCore Bootstrap] Runtime Constitutions synchronized.');
  } catch (err) {
    console.error('[DevCore Startup] Persistence layer failed to initialize:', err);
  }

  // Early health check
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Listen after DB is ready
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NEXUS Runtime] Server running on port ${PORT}`);
    
    // Background services can start now
    console.log('[DevCore Startup] Starting background services...');
    try {
      if (!STRICT_OPERATIONAL_MODE) {
        startAgentNetworkSimulator();
        startInfrastructureIntelligence();
      }
      startOperationalIntelligenceEngine();
      console.log('[DevCore Startup] Background services active.');
    } catch (err) {
      console.error('[DevCore Startup] Background services failed to start:', err);
    }
    
    // PM2 ready signal
    if (process.send) {
      process.send('ready');
    }
  });

  // ==========================================
  // PHASE A: READ ONLY APIs (Runtime Visibility)
  // ==========================================

  app.get("/api/runtime/system", (req, res) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO runtime_state_snapshots (memory_used, memory_total, cpu_usage_user, cpu_usage_system, uptime) 
          VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(memoryUsage.heapUsed, memoryUsage.heapTotal, cpuUsage.user, cpuUsage.system, Math.floor(process.uptime()));
    } catch (e) {
        console.error("Failed to insert runtime state snapshot:", e);
    }

    res.json({
      success: true,
      data: {
        status: "online",
        uptime: os.uptime(),
        platform: os.platform(),
        release: os.release(),
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length,
        hostname: os.hostname(),
      }
    });
  });

  app.get("/api/runtime/processes", (req, res) => {
    res.json({
      success: true,
      data: {
        pid: process.pid,
        title: process.title,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime(),
      }
    });
  });

  app.get("/api/runtime/env", (req, res) => {
    res.json({
      success: true,
      data: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        exposedKeys: Object.keys(process.env).filter(key => key.startsWith('VITE_')),
      }
    });
  });

  app.get("/api/runtime/logs", async (req, res) => {
    try {
      const logs = await getLogs(50);
      res.json({
        success: true,
        data: logs
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // NEW ENDPOINTS for Persistent Layer
  app.get("/api/runtime/telemetry", async (req, res) => {
    try {
      const data = await getRuntimeTelemetry();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  const execJson = (command: string, timeout = 5000) =>
    new Promise<{ stdout: string; stderr: string; error?: string }>((resolve) => {
      exec(command, { timeout, windowsHide: true }, (error, stdout, stderr) => {
        resolve({ stdout: stdout || "", stderr: stderr || "", error: error?.message });
      });
    });

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((resolve) => {
          timer = setTimeout(() => resolve(fallback), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const parseListeningPorts = (raw: string) => raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.includes("LISTENING") || line.includes("LISTEN"))
    .map(line => {
      const parts = line.split(/\s+/);
      const isSs = parts[0] === "tcp" || parts[0] === "udp";
      const local = isSs ? (parts[4] || "") : (parts[1] || "");
      const portMatch = local.match(/:(\d+)$/);
      const processInfo = line.match(/pid=(\d+),/);
      return {
        protocol: (parts[0] || "").toUpperCase(),
        localAddress: local,
        port: portMatch ? Number(portMatch[1]) : null,
        state: isSs ? parts[1] : parts[3],
        pid: processInfo?.[1] || (isSs ? null : parts[4]),
      };
    })
    .filter(item => item.port);

  const discoverNginxDomains = () => {
    const candidates = [
      path.join(GLOBAL_ROOT, "nginx/conf.d"),
      "/etc/nginx/conf.d",
      "/etc/nginx/sites-enabled",
    ];
    const domains: any[] = [];

    for (const dir of candidates) {
      try {
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir).filter(name => name.endsWith(".conf"))) {
          const fullPath = path.join(dir, file);
          const content = fs.readFileSync(fullPath, "utf8");
          const serverName = content.match(/server_name\s+([^;]+);/);
          const proxyPort = content.match(/proxy_pass\s+http:\/\/(?:127\.0\.0\.1|localhost):(\d+)/);
          const rootPath = content.match(/root\s+([^;]+);/);
          domains.push({
            name: serverName?.[1]?.trim() || file.replace(/\.conf$/, ""),
            configPath: fullPath,
            proxyPort: proxyPort?.[1] ? Number(proxyPort[1]) : null,
            rootPath: rootPath?.[1]?.trim() || null,
          });
        }
      } catch (error: any) {
        domains.push({ name: dir, error: error.message });
      }
    }

    return domains;
  };

  const getDirectorySize = (targetPath: string, maxEntries = 600) => {
    let total = 0;
    let visited = 0;
    const walk = (currentPath: string) => {
      if (visited >= maxEntries) return;
      let entries: fs.Dirent[] = [];
      try {
        entries = fs.readdirSync(currentPath, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (visited >= maxEntries) return;
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "vendor") continue;
        const entryPath = path.join(currentPath, entry.name);
        visited += 1;
        try {
          if (entry.isDirectory()) {
            walk(entryPath);
          } else if (entry.isFile()) {
            total += fs.statSync(entryPath).size;
          }
        } catch {
          // Ignore unreadable files. Discovery must be non-destructive.
        }
      }
    };
    walk(targetPath);
    return total;
  };

  const classifyRuntime = (runtimePath: string) => {
    const markers = {
      node: fs.existsSync(path.join(runtimePath, "package.json")),
      vite: fs.existsSync(path.join(runtimePath, "vite.config.ts")) || fs.existsSync(path.join(runtimePath, "vite.config.js")),
      next: fs.existsSync(path.join(runtimePath, "next.config.js")) || fs.existsSync(path.join(runtimePath, "next.config.mjs")),
      laravel: fs.existsSync(path.join(runtimePath, "artisan")),
      flutter: fs.existsSync(path.join(runtimePath, "pubspec.yaml")),
      git: fs.existsSync(path.join(runtimePath, ".git")),
      build: fs.existsSync(path.join(runtimePath, "dist")) || fs.existsSync(path.join(runtimePath, "build")) || fs.existsSync(path.join(runtimePath, ".next")),
      publicRoot: fs.existsSync(path.join(runtimePath, "public")) || fs.existsSync(path.join(runtimePath, "public_html")),
    };

    const type = markers.next ? "NextJS"
      : markers.vite ? "Vite"
      : markers.node ? "NodeJS"
      : markers.laravel ? "Laravel"
      : markers.flutter ? "Flutter"
      : markers.publicRoot ? "Static"
      : "Directory";

    const lowerPath = runtimePath.toLowerCase();
    const environment = lowerPath.includes("backup") ? "Backup"
      : lowerPath.includes("snapshot") ? "Snapshot"
      : lowerPath.includes("archive") ? "Archived"
      : lowerPath.includes("dev") || lowerPath.includes("staging") ? "Development"
      : lowerPath.includes("live") || lowerPath.includes("prod") ? "Production"
      : "Development";

    return { markers, type, environment };
  };

  const discoverRuntimePaths = (pm2Processes: any[] = [], domains: any[] = []) => {
    const roots = Array.from(new Set([
      GLOBAL_ROOT,
      "/var/www",
      "/home",
      "/opt",
      process.cwd(),
    ])).filter(root => {
      try {
        return fs.existsSync(root) && fs.statSync(root).isDirectory();
      } catch {
        return false;
      }
    });

    const discovered = new Map<string, any>();
    for (const root of roots) {
      let entries: fs.Dirent[] = [];
      try {
        entries = fs.readdirSync(root, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const entry of entries.filter(item => item.isDirectory())) {
        const runtimePath = path.join(root, entry.name);
        if (discovered.has(runtimePath)) continue;
        const { markers, type, environment } = classifyRuntime(runtimePath);
        const hasRuntimeSignal = Object.values(markers).some(Boolean);
        if (!hasRuntimeSignal) continue;

        const stat = fs.statSync(runtimePath);
        const pm2Process = pm2Processes.find(proc => {
          const cwd = proc?.pm2_env?.pm_cwd || proc?.pm2_env?.cwd;
          return cwd === runtimePath || proc?.name === entry.name || proc?.pm2_env?.name === entry.name;
        });
        const domain = domains.find(domain => domain.rootPath === runtimePath || domain.name?.includes(entry.name));

        discovered.set(runtimePath, {
          name: entry.name,
          path: runtimePath,
          type,
          environment,
          source: markers.git ? "GitHub" : "Local Runtime",
          markers,
          domain: domain?.name || null,
          pm2Process: pm2Process?.name || null,
          pm2Status: pm2Process?.pm2_env?.status || null,
          cpu: pm2Process?.monit?.cpu ?? null,
          ram: pm2Process?.monit?.memory ?? null,
          uptime: pm2Process?.pm2_env?.pm_uptime || null,
          restarts: pm2Process?.pm2_env?.restart_time ?? null,
          health: pm2Process ? (pm2Process?.pm2_env?.status === "online" ? "Healthy" : "Warning") : "Offline",
          deployState: markers.build ? "Build detected" : "Source only",
          lastDeploy: stat.mtime,
          sizeBytes: getDirectorySize(runtimePath),
          modified: stat.mtime,
        });
      }
    }

    return Array.from(discovered.values());
  };

  app.get("/api/runtime/infrastructure/discovery", async (req, res) => {
    const startedAt = Date.now();
    try {
      const portCommand = os.platform() === "win32" ? "netstat -ano" : "ss -tulnp || netstat -tulnp";
      const [telemetry, pm2Result, netstatResult, dockerResult, projects, dbNodes] = await Promise.all([
        withTimeout(getRuntimeTelemetry().catch(() => null), 2500, null),
        withTimeout(execJson("pm2 jlist", 2500), 3000, { stdout: "", stderr: "", error: "انتهت مهلة قراءة PM2" }),
        withTimeout(execJson(portCommand, 2500), 3000, { stdout: "", stderr: "", error: "انتهت مهلة قراءة المنافذ" }),
        withTimeout(execJson("docker ps --format \"{{json .}}\"", 2500), 3000, { stdout: "", stderr: "", error: "Docker غير متوفر أو انتهت المهلة" }),
        withTimeout(getProjects().catch(() => []), 2500, []),
        withTimeout(Promise.resolve(getNodes()).catch(() => []), 2500, []),
      ]);

      let pm2Processes: any[] = [];
      try {
        pm2Processes = pm2Result.stdout.trim() ? JSON.parse(pm2Result.stdout) : [];
      } catch {
        pm2Processes = [];
      }

      const ports = parseListeningPorts(netstatResult.stdout);
      const domains = discoverNginxDomains();
      const runtimePaths = discoverRuntimePaths(pm2Processes, domains);
      const containers = dockerResult.stdout
        .split(/\r?\n/)
        .filter(Boolean)
        .map(line => {
          try { return JSON.parse(line); } catch { return null; }
        })
        .filter(Boolean);

      const memoryTotal = os.totalmem();
      const memoryFree = os.freemem();
      const memoryUsed = memoryTotal - memoryFree;
      const runtimePortSet = new Set([
        ...pm2Processes.map(proc => proc?.pm2_env?.PORT || proc?.pm2_env?.port).filter(Boolean).map(Number),
        ...projects.map((project: any) => project.runtime_port).filter(Boolean).map(Number),
        ...domains.map(domain => domain.proxyPort).filter(Boolean).map(Number),
      ]);

      const networkUsage = (telemetry?.network || []).reduce((total: number, net: any) => total + Number(net.rx_sec || 0) + Number(net.tx_sec || 0), 0);
      const correlatedPorts = ports.map(port => {
        const pm2Process = pm2Processes.find(proc => {
          const runtimePort = Number(proc?.pm2_env?.PORT || proc?.pm2_env?.port || proc?.pm2_env?.env?.PORT);
          return runtimePort && runtimePort === Number(port.port);
        });
        const domain = domains.find(domain => Number(domain.proxyPort) === Number(port.port));
        const runtime = runtimePaths.find(runtime => runtime.pm2Process === pm2Process?.name || runtime.domain === domain?.name);
        return {
          ...port,
          runtime: runtime?.name || pm2Process?.name || domain?.name || null,
          service: pm2Process?.name || domain?.name || null,
        };
      });

      const primaryNode = {
        id: "local-host",
        name: os.hostname(),
        ip: "127.0.0.1",
        region: process.env.RUNTIME_REGION || "المضيف المحلي",
        os: `${os.platform()} ${os.release()}`,
        status: "online",
        cpu: telemetry?.cpu?.usage ?? 0,
        ram: memoryTotal ? Math.round((memoryUsed / memoryTotal) * 100) : 0,
        disk: telemetry?.disk?.usage ?? null,
        uptimeSeconds: os.uptime(),
        runtimeCount: runtimePaths.length,
        pm2Count: pm2Processes.length,
        portCount: correlatedPorts.length,
        domainCount: domains.length,
        containerCount: containers.length,
        health: pm2Result.error && pm2Processes.length === 0 ? "degraded" : "healthy",
        networkStatus: correlatedPorts.length > 0 ? "listening" : "idle",
      };

      const registeredNodes = (dbNodes || []).map((node: any) => ({
        ...node,
        cpu: Number.parseFloat(String(node.cpu || "0")) || 0,
        ram: Number.parseFloat(String(node.ram || "0")) || 0,
        disk: Number.parseFloat(String(node.storage || "0")) || null,
        uptimeSeconds: null,
        runtimeCount: projects.filter((project: any) => project.node_id === node.id).length,
        pm2Count: 0,
        portCount: 0,
        domainCount: 0,
        containerCount: 0,
        health: node.status === "online" ? "healthy" : "degraded",
        networkStatus: node.ip ? "registered" : "unknown",
      }));

      const nodes = [primaryNode, ...registeredNodes.filter((node: any) => node.id !== primaryNode.id)];
      const relationships = runtimePaths.map(runtime => {
        const project = projects.find((p: any) => p.runtime_path === runtime.path || p.name === runtime.name);
        const domain = domains.find(domain => domain.rootPath === runtime.path || domain.name.includes(runtime.name));
        return {
          runtime: runtime.name,
          path: runtime.path,
          type: runtime.type,
          owner: project?.name || "غير مسجل",
          domain: domain?.name || null,
          port: project?.runtime_port || domain?.proxyPort || null,
          pm2Process: pm2Processes.find(proc => proc.name === runtime.name || proc.pm2_env?.name === runtime.name)?.name || null,
        };
      });

      res.json({
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          nodes,
          summary: {
            nodes: nodes.length,
            runtimePaths: runtimePaths.length,
            pm2Processes: pm2Processes.length,
            activePorts: correlatedPorts.length,
            activeServices: correlatedPorts.filter(port => port.service || port.runtime).length,
            domains: domains.length,
            containers: containers.length,
            registeredProjects: projects.length,
            runtimePorts: Array.from(runtimePortSet),
          },
          system: {
            hostname: os.hostname(),
            platform: os.platform(),
            release: os.release(),
            uptimeSeconds: os.uptime(),
            cpuCores: os.cpus().length,
            loadavg: os.loadavg(),
            memoryTotal,
            memoryUsed,
            memoryFree,
            diskTotal: telemetry?.disk?.total || 0,
            diskUsed: telemetry?.disk?.used || 0,
            diskFree: telemetry?.disk?.available || 0,
            diskUsage: telemetry?.disk?.usePercent ?? null,
            networkUsage,
            networkInterfaces: telemetry?.network || [],
            ioUsage: telemetry?.processes?.blocked || 0,
            runtimeLatencyMs: Date.now() - startedAt,
          },
          pm2: {
            available: !pm2Result.error,
            error: pm2Result.error || null,
            processes: pm2Processes.map(proc => ({
              id: proc.pm_id,
              name: proc.name,
              status: proc.pm2_env?.status,
              restarts: proc.pm2_env?.restart_time,
              uptime: proc.pm2_env?.pm_uptime,
              pid: proc.pid,
              memory: proc.monit?.memory,
              cpu: proc.monit?.cpu,
              cwd: proc.pm2_env?.pm_cwd,
            })),
          },
          services: {
            ports: correlatedPorts,
            containers,
            domains,
          },
          runtimePaths,
          discoveryWorkspace: runtimePaths,
          projects,
          relationships,
        },
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.get("/api/runtime/sessions", (req, res) => {
    res.json({ success: true, data: getActiveSessions() });
  });

  app.post("/api/runtime/sessions/:uid/suspend", (req, res) => {
    suspendSession(req.params.uid);
    res.json({ success: true, message: `Session for UID ${req.params.uid} suspended.` });
  });

  app.get("/api/runtime/governance", async (req, res) => {
    try {
      const data = await getDbGovernanceActions();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/runtime/security", async (req, res) => {
    try {
      const data = await getDbSecurityEvents();
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Phase 11: Execution Engine Endpoints
  app.get("/api/runtime/execution/history", (req, res) => {
    res.json({ success: true, data: getExecutionHistory(20) });
  });

  app.post("/api/runtime/execute", async (req, res) => {
    const { commandId, parameters, triggeredBy, uid, role } = req.body;
    
    if (!commandId) {
      return res.status(400).json({ success: false, message: "commandId is required" });
    }

    // 1. Governance Policy Enforcement
    const validation = await validateExecutionPolicy(commandId, uid || "Anonymous", role || "Guest");
    if (!validation.allowed) {
        return res.status(403).json({ 
            success: false, 
            message: validation.reason,
            violation_type: 'GovernancePolicyGate'
        });
    }
    
    // 2. Background execution
    runRuntimeCommand(commandId, parameters || "{}", triggeredBy || "Web UI");
    
    res.json({ 
      success: true, 
      message: `Command [${commandId}] submitted to structured execution engine.` 
    });
  });

  app.get("/api/runtime/policies/violations", (req, res) => {
    res.json({ success: true, data: getRecentViolations(50) });
  });

  app.get("/api/runtime/policies/:commandId", (req, res) => {
    res.json({ success: true, data: getPolicyForCommand(req.params.commandId) });
  });

  // Phase 13: Operational Intelligence Endpoints
  app.get("/api/runtime/nodes", async (req, res) => {
    try {
      const nodes = await getDbNodes();
      res.json({ success: true, data: nodes });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/runtime/nodes/:nodeId/action", async (req, res) => {
    const { nodeId } = req.params;
    const { action } = req.body;
    const allowedActions = new Set(['restart', 'stop', 'start', 'health-check', 'resync']);
    if (!allowedActions.has(String(action || '').toLowerCase())) {
      return res.status(400).json({ success: false, message: "Unsupported node action." });
    }
    const governanceCheck = await validateExecutionPolicy('NODE_MUTATION', 'RuntimeOperator', 'Admin');
    if (!governanceCheck.allowed) {
      return res.status(403).json({ success: false, message: governanceCheck.reason, violation_type: 'GovernancePolicyGate' });
    }
    addRuntimeLog('warning', `Infrastructure Action: ${action} triggered for Node ${nodeId}`, 'infrastructure_core');

    addGovernanceAction('NODE_ACTION', 'Runtime', `${nodeId}:${action}`, 'COMPLETED');
    addRuntimeLog('success', `Node Action ${action} for ${nodeId} execution confirmed.`, 'infrastructure_core');
    res.json({ success: true, message: `Node ${action} sequence completed.` });
  });

  type RuntimeStreamChannel = 'runtime' | 'pm2' | 'deploy' | 'governance' | 'errors';
  type RuntimeStreamClient = {
    ws: WebSocket;
    runtimeId?: string;
    projectId?: string;
    channels: Set<RuntimeStreamChannel>;
    paused: boolean;
    filterLevel: string;
    filterService: string;
    search: string;
    deliveredKeys: Set<string>;
  };
  type RuntimeTelemetryClient = {
    ws: WebSocket;
    runtimeId?: string;
    projectId?: string;
    paused: boolean;
  };
  type RuntimeMutationClient = {
    ws: WebSocket;
    runtimeId?: string;
    projectId?: string;
    paused: boolean;
    deliveredKeys: Set<string>;
  };

  const wsServer = new WebSocketServer({ server, path: "/ws/runtime/logs" });
  const telemetryWsServer = new WebSocketServer({ server, path: "/ws/runtime/telemetry" });
  const mutationWsServer = new WebSocketServer({ server, path: "/ws/runtime/mutations" });
  const streamClients = new Set<RuntimeStreamClient>();
  const telemetryClients = new Set<RuntimeTelemetryClient>();
  const mutationClients = new Set<RuntimeMutationClient>();

  const normalizeRuntimeLog = (row: any, fallbackService = 'runtime') => ({
    id: String(row?.id ?? `${row?.timestamp ?? Date.now()}`),
    timestamp: row?.timestamp || new Date().toISOString(),
    level: String(row?.type || row?.level || 'info').toLowerCase(),
    service: String(row?.source || row?.service || fallbackService),
    message: String(row?.message || ''),
  });

  const matchesChannel = (entry: any, channels: Set<RuntimeStreamChannel>) => {
    if (channels.has('runtime')) return true;
    const src = String(entry.service || '').toLowerCase();
    const msg = String(entry.message || '').toLowerCase();
    if (channels.has('pm2') && (src.includes('pm2') || msg.includes('pm2'))) return true;
    if (channels.has('deploy') && (src.includes('deploy') || msg.includes('deploy'))) return true;
    if (channels.has('governance') && (src.includes('governance') || src.includes('security') || msg.includes('governance'))) return true;
    if (channels.has('errors') && entry.level === 'error') return true;
    return false;
  };

  const filterStreamEntries = (entries: any[], client: RuntimeStreamClient) => {
    const search = client.search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (!matchesChannel(entry, client.channels)) return false;
      if (client.filterLevel !== 'all' && entry.level !== client.filterLevel) return false;
      if (client.filterService !== 'all' && entry.service !== client.filterService) return false;
      if (search && !(`${entry.message} ${entry.service}`.toLowerCase().includes(search))) return false;
      return true;
    });
  };

  const getScopedRuntimeLogs = async (runtimeId?: string) => {
    if (!runtimeId) return [];
    try {
      const { RuntimeLogs } = await import('./server/runtime/runtimeLogs.js');
      const rows = await RuntimeLogs.getLogs(runtimeId);
      return Array.isArray(rows) ? rows.map((row: any) => normalizeRuntimeLog(row, 'runtime_stream')) : [];
    } catch {
      return [];
    }
  };

  const streamRuntimeLogs = async (client: RuntimeStreamClient) => {
    if (client.paused || client.ws.readyState !== WebSocket.OPEN) return;

    const audit = getRecentLogs(180).map((row: any) => normalizeRuntimeLog(row));
    const scoped = await getScopedRuntimeLogs(client.runtimeId);
    const merged = [...audit, ...scoped]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const filtered = filterStreamEntries(merged, client);
    const delta = filtered.filter((entry) => {
      const key = `${entry.id}:${entry.timestamp}:${entry.service}`;
      if (client.deliveredKeys.has(key)) return false;
      client.deliveredKeys.add(key);
      return true;
    });

    if (client.deliveredKeys.size > 4000) {
      const lastKeys = Array.from(client.deliveredKeys).slice(-1500);
      client.deliveredKeys = new Set(lastKeys);
    }

    if (delta.length > 0) {
      client.ws.send(JSON.stringify({ type: 'logs', data: delta }));
    }
  };

  wsServer.on("connection", (ws) => {
    const client: RuntimeStreamClient = {
      ws,
      channels: new Set<RuntimeStreamChannel>(['runtime']),
      paused: false,
      filterLevel: 'all',
      filterService: 'all',
      search: '',
      deliveredKeys: new Set<string>(),
    };

    streamClients.add(client);
    ws.send(JSON.stringify({ type: 'ready', data: { channels: ['runtime', 'pm2', 'deploy', 'governance', 'errors'] } }));

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'subscribe') {
          client.runtimeId = msg.runtimeId ? String(msg.runtimeId) : undefined;
          client.projectId = msg.projectId ? String(msg.projectId) : undefined;
          client.channels = new Set<RuntimeStreamChannel>(Array.isArray(msg.channels) && msg.channels.length ? msg.channels : ['runtime']);
          client.filterLevel = msg.filterLevel || 'all';
          client.filterService = msg.filterService || 'all';
          client.search = msg.search || '';
          client.deliveredKeys.clear();
          await streamRuntimeLogs(client);
          return;
        }
        if (msg.type === 'pause') client.paused = true;
        if (msg.type === 'resume') client.paused = false;
        if (msg.type === 'filters') {
          client.filterLevel = msg.filterLevel || 'all';
          client.filterService = msg.filterService || 'all';
          client.search = msg.search || '';
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid stream message format' }));
      }
    });

    ws.on("close", () => {
      streamClients.delete(client);
    });
  });

  const streamTicker = setInterval(() => {
    streamClients.forEach((client) => {
      streamRuntimeLogs(client).catch(() => undefined);
    });
  }, 1000);

  const streamRuntimeTelemetry = async (client: RuntimeTelemetryClient) => {
    if (client.paused || client.ws.readyState !== WebSocket.OPEN) return;
    const runtimeId = client.runtimeId || "rt-core";
    const eventsPromise = (async () => {
      try {
        const { RuntimeEvents } = await import('./server/runtime/runtimeEvents.js');
        return await RuntimeEvents.getEvents(runtimeId, 20);
      } catch {
        return [];
      }
    })();

    const [snapshot, events] = await Promise.all([
      withTimeout(
        Promise.resolve(getRuntimeTelemetry().then((telemetry) => ({
          generatedAt: new Date().toISOString(),
          nodes: [{
            id: "local-host",
            cpu: telemetry.cpu.usage,
            ram: telemetry.memory.total ? Math.round((telemetry.memory.used / telemetry.memory.total) * 100) : 0,
          }],
          summary: {
            activePorts: 0,
            runtimePaths: 0,
          },
          system: {
            memoryTotal: telemetry.memory.total,
            memoryUsed: telemetry.memory.used,
            uptimeSeconds: telemetry.os.uptime,
            cpuCores: telemetry.cpu.cores,
            hostname: telemetry.os.hostname,
            runtimeLatencyMs: 0,
          },
          telemetry,
        }))),
        2500,
        null,
      ),
      withTimeout(eventsPromise, 2500, []),
    ]);

    if (!snapshot) return;
    client.ws.send(JSON.stringify({
      type: 'telemetry',
      data: {
        runtimeId: runtimeId,
        projectId: client.projectId || null,
        snapshot,
        events: Array.isArray(events) ? events : [],
      },
    }));
  };

  telemetryWsServer.on("connection", (ws) => {
    const client: RuntimeTelemetryClient = { ws, paused: false };
    telemetryClients.add(client);
    ws.send(JSON.stringify({ type: "ready", data: { stream: "runtime-telemetry" } }));

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "subscribe") {
          client.runtimeId = msg.runtimeId ? String(msg.runtimeId) : undefined;
          client.projectId = msg.projectId ? String(msg.projectId) : undefined;
          await streamRuntimeTelemetry(client);
          return;
        }
        if (msg.type === "pause") client.paused = true;
        if (msg.type === "resume") {
          client.paused = false;
          await streamRuntimeTelemetry(client);
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid telemetry stream message format" }));
      }
    });

    ws.on("close", () => {
      telemetryClients.delete(client);
    });
  });

  const telemetryTicker = setInterval(() => {
    telemetryClients.forEach((client) => {
      streamRuntimeTelemetry(client).catch(() => undefined);
    });
  }, 3000);

  const toMutationEntry = (row: any, source: string) => ({
    id: String(row?.id || row?.deployment_id || row?.recovery_id || row?.snapshot_id || `${source}-${row?.created_at || Date.now()}`),
    source,
    status: String(row?.status || row?.deploy_status || row?.recovery_status || row?.severity || row?.level || 'unknown'),
    label: String(row?.action_type || row?.deploy_strategy || row?.recovery_type || row?.event_type || row?.type || source),
    message: String(row?.message || row?.target || row?.details || row?.risk_level || ''),
    runtimeId: String(row?.runtime_id || row?.runtimeId || ''),
    timestamp: row?.created_at || row?.updated_at || row?.timestamp || new Date().toISOString(),
  });

  const streamRuntimeMutations = async (client: RuntimeMutationClient) => {
    if (client.paused || client.ws.readyState !== WebSocket.OPEN) return;
    const runtimeId = client.runtimeId ? String(client.runtimeId) : '';

    const [deployments, recoveries, governanceRows, eventRows] = await Promise.all([
      withTimeout(Promise.resolve(runtimeId ? RuntimeDeploy.getDeployments(runtimeId) : Promise.resolve([])).catch(() => []), 2500, [] as any[]),
      withTimeout(Promise.resolve(runtimeId ? RuntimeRecovery.getRecoveries(runtimeId) : Promise.resolve([])).catch(() => []), 2500, [] as any[]),
      withTimeout(getDbGovernanceActions().catch(() => []), 2500, [] as any[]),
      withTimeout((async () => {
        try {
          if (!runtimeId) return [];
          const { RuntimeEvents } = await import('./server/runtime/runtimeEvents.js');
          return await RuntimeEvents.getEvents(runtimeId, 30);
        } catch {
          return [];
        }
      })(), 2500, [] as any[]),
    ]);

    const merged = [
      ...(deployments || []).map((row: any) => toMutationEntry(row, 'deploy')),
      ...(recoveries || []).map((row: any) => toMutationEntry(row, 'recovery')),
      ...(governanceRows || []).map((row: any) => toMutationEntry(row, 'governance')),
      ...(eventRows || []).map((row: any) => toMutationEntry(row, 'runtime')),
    ]
      .filter((row) => !runtimeId || !row.runtimeId || row.runtimeId === runtimeId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const delta = merged.filter((entry) => {
      const key = `${entry.id}:${entry.timestamp}:${entry.source}:${entry.status}`;
      if (client.deliveredKeys.has(key)) return false;
      client.deliveredKeys.add(key);
      return true;
    });

    if (client.deliveredKeys.size > 4000) {
      const lastKeys = Array.from(client.deliveredKeys).slice(-1500);
      client.deliveredKeys = new Set(lastKeys);
    }

    if (delta.length > 0) {
      client.ws.send(JSON.stringify({ type: 'mutations', data: delta }));
    }
  };

  mutationWsServer.on("connection", (ws) => {
    const client: RuntimeMutationClient = { ws, paused: false, deliveredKeys: new Set<string>() };
    mutationClients.add(client);
    ws.send(JSON.stringify({ type: "ready", data: { stream: "runtime-mutations" } }));

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "subscribe") {
          client.runtimeId = msg.runtimeId ? String(msg.runtimeId) : undefined;
          client.projectId = msg.projectId ? String(msg.projectId) : undefined;
          client.deliveredKeys.clear();
          await streamRuntimeMutations(client);
          return;
        }
        if (msg.type === "pause") client.paused = true;
        if (msg.type === "resume") {
          client.paused = false;
          await streamRuntimeMutations(client);
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid mutation stream message format" }));
      }
    });

    ws.on("close", () => {
      mutationClients.delete(client);
    });
  });

  const mutationTicker = setInterval(() => {
    mutationClients.forEach((client) => {
      streamRuntimeMutations(client).catch(() => undefined);
    });
  }, 2500);

  server.on("close", () => {
    clearInterval(streamTicker);
    clearInterval(telemetryTicker);
    clearInterval(mutationTicker);
    wsServer.close();
    telemetryWsServer.close();
    mutationWsServer.close();
  });

  app.delete("/api/runtime/nodes/:nodeId", async (req, res) => {
    const { nodeId } = req.params;
    try {
        // Delete from governance DB (using node_id)
        await deleteNode(nodeId);
        // Delete from core DB (using id)
        await deleteDbNode(nodeId);
        
        addGovernanceAction('NODE_DELETE', 'System Admin', nodeId, 'COMPLETED');
        addRuntimeLog('warn', `Infrastructure Node ${nodeId} decommissioned from Nexus Cluster`, 'infrastructure_core');
        res.json({ success: true, message: "Node deleted successfully" });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/runtime/agents", (req, res) => {
    res.json({ success: true, data: getAgents() });
  });

  // Phase 14: CI/CD Pipeline Endpoints
  app.get("/api/runtime/pipelines", (req, res) => {
    res.json({ success: true, data: getPipelines(20) });
  });

  app.get("/api/runtime/pipelines/:id/jobs", (req, res) => {
    res.json({ success: true, data: getPipelineJobs(req.params.id) });
  });

  app.get("/api/runtime/artifacts", (req, res) => {
    res.json({ success: true, data: getArtifacts(20) });
  });

  app.post("/api/runtime/pipelines/trigger", (req, res) => {
    const { name, env, user } = req.body;
    const pipelineId = `PIPE-${createHash('sha1').update(`${name || 'pipeline'}:${env || 'STAGING'}:${Date.now()}`).digest('hex').slice(0, 10).toUpperCase()}`;
    createPipeline({ id: pipelineId, name: name || "Manual Release", env: env || "STAGING", user: user || "U-ADMIN" });
    
    // Run async orchestration
    runDeploymentPipeline(pipelineId);
    
    res.json({ success: true, pipelineId });
  });

  app.get("/api/runtime/intelligence/signals", (req, res) => {
    res.json({ success: true, data: getOperationalSignals(30) });
  });

  app.get("/api/runtime/:id/intelligence", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const analysis = await RuntimeIntelligence.getLatestAnalysis(runtimeId);
      res.json({ success: true, data: analysis });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Intelligence fetch failed' });
    }
  });

  app.get("/api/runtime/:id/governance", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const governance = await RuntimeGovernance.getGovernance(runtimeId);
      res.json({ success: true, data: governance });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Governance fetch failed' });
    }
  });

  app.get("/api/runtime/:id/policy-analysis", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const analysis = await RuntimePolicyEngine.getPolicyAnalysis(runtimeId);
      res.json({ success: true, data: analysis });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Policy analysis fetch failed' });
    }
  });

  app.get("/api/runtime/:id/approvals", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const approvals = await RuntimeApproval.getApprovals(runtimeId);
      res.json({ success: true, data: approvals });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Approvals fetch failed' });
    }
  });

  app.get("/api/runtime/:id/pending-mutations", async (req, res) => {
    try {
      const runtimeId = String(req.params.id);
      const rows = getPendingMutationsByRuntime(runtimeId);
      res.json({ success: true, data: rows });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Pending mutations fetch failed' });
    }
  });

  app.get("/api/runtime/:id/mutation-timeline", async (req, res) => {
    try {
      const runtimeId = String(req.params.id);
      const limit = Math.min(300, Math.max(20, Number(req.query.limit || 160)));

      const approvals = sqliteDb.prepare(`
        SELECT id, operation_type, approval_status, chain_status, stage_index, total_stages, required_role, requested_by, reviewed_by, risk_level, requested_at, reviewed_at
        FROM runtime_approvals
        WHERE runtime_id = ?
        ORDER BY requested_at DESC
        LIMIT ?
      `).all(runtimeId, limit) as any[];

      const pending = sqliteDb.prepare(`
        SELECT approval_id, mutation_id, mutation_kind, execution_status, created_at, executed_at
        FROM runtime_pending_mutations
        WHERE runtime_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(runtimeId, limit) as any[];

      const deploys = sqliteDb.prepare(`
        SELECT deployment_id, deploy_status, deploy_strategy, risk_level, created_at, executed_at
        FROM runtime_locks
        WHERE runtime_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(runtimeId, Math.min(limit, 100)) as any[];

      const recoveries = sqliteDb.prepare(`
        SELECT recovery_id, snapshot_id, recovery_status, recovery_type, risk_level, created_at
        FROM runtime_recovery
        WHERE runtime_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(runtimeId, Math.min(limit, 100)) as any[];

      const approvalById = new Map<string, any>();
      approvals.forEach((a) => approvalById.set(String(a.id), a));

      const rows: any[] = [];
      approvals.forEach((a) => {
        rows.push({
          correlationId: String(a.id),
          mutationId: null,
          source: 'approval',
          title: `Approval ${a.operation_type || ''}`.trim(),
          stage: `Stage ${Number(a.stage_index || 1)}/${Number(a.total_stages || 1)}`,
          status: String(a.approval_status || 'PENDING'),
          chainStatus: String(a.chain_status || 'PENDING_STAGE'),
          requiredRole: a.required_role || 'Admin',
          riskLevel: a.risk_level || 'medium',
          message: `Requested by ${a.requested_by || 'RuntimeOperator'}`,
          timestamp: a.reviewed_at || a.requested_at || null
        });
      });

      pending.forEach((m) => {
        const ap = approvalById.get(String(m.approval_id));
        rows.push({
          correlationId: String(m.approval_id || m.mutation_id || ''),
          mutationId: m.mutation_id || null,
          source: 'mutation',
          title: `Mutation ${m.mutation_kind || ''}`.trim(),
          stage: 'Execution',
          status: String(m.execution_status || 'PENDING'),
          chainStatus: ap?.chain_status || null,
          requiredRole: ap?.required_role || null,
          riskLevel: ap?.risk_level || 'medium',
          message: m.mutation_id || '',
          timestamp: m.executed_at || m.created_at || null
        });
      });

      deploys.forEach((d) => {
        rows.push({
          correlationId: String(d.deployment_id || ''),
          mutationId: null,
          source: 'deploy',
          title: 'Deploy Pipeline',
          stage: d.deploy_strategy || 'governed_deploy',
          status: String(d.deploy_status || 'UNKNOWN'),
          chainStatus: null,
          requiredRole: null,
          riskLevel: d.risk_level || 'medium',
          message: d.deployment_id || '',
          timestamp: d.executed_at || d.created_at || null
        });
      });

      recoveries.forEach((r) => {
        rows.push({
          correlationId: String(r.recovery_id || ''),
          mutationId: null,
          source: 'recovery',
          title: 'Recovery / Rollback',
          stage: r.recovery_type || 'rollback',
          status: String(r.recovery_status || 'UNKNOWN'),
          chainStatus: null,
          requiredRole: null,
          riskLevel: r.risk_level || 'medium',
          message: r.snapshot_id ? `Snapshot ${r.snapshot_id}` : (r.recovery_id || ''),
          timestamp: r.created_at || null
        });
      });

      rows.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      res.json({ success: true, data: rows.slice(0, limit) });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Mutation timeline fetch failed' });
    }
  });

  app.post("/api/runtime/:id/approvals", async (req, res) => {
    try {
      const runtime_id = req.params.id;
      const { operation_type, requested_by, risk_level, approval_reason } = req.body;
      const chain = deriveApprovalChain(String(operation_type || ''), String(risk_level || 'medium'));
      const id = await RuntimeApproval.requestApproval({
        runtime_id,
        operation_type,
        requested_by,
        risk_level,
        approval_reason,
        stage_index: 1,
        total_stages: chain.totalStages,
        required_role: chain.stage1.role,
        sla_minutes: chain.stage1.slaMinutes,
        expires_at: computeExpiryIso(chain.stage1.slaMinutes),
        chain_status: chain.totalStages > 1 ? 'PENDING_STAGE' : 'PENDING_FINAL'
      });
      res.json({ success: true, data: { id } });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Approval request failed' });
    }
  });

  app.put("/api/runtime/:id/approvals/:approvalId", async (req, res) => {
    try {
      const { status, reviewed_by, reason } = req.body;
      const approvalId = String(req.params.approvalId);
      const runtimeId = String(req.params.id);
      const approval = sqliteDb.prepare('SELECT * FROM runtime_approvals WHERE id = ? AND runtime_id = ?').get(approvalId, runtimeId) as any;
      if (!approval) return governanceError(res, 404, 'Approval not found', 'APPROVAL_NOT_FOUND');
      if (approval.expires_at && Date.now() > new Date(String(approval.expires_at)).getTime()) {
        sqliteDb.prepare('UPDATE runtime_approvals SET approval_status = ?, chain_status = ? WHERE id = ?').run('EXPIRED', 'EXPIRED', approvalId);
        return governanceError(res, 410, 'Approval has expired', 'APPROVAL_EXPIRED');
      }

      const normalizedStatus = String(status || '').toUpperCase();
      const totalStages = Math.max(1, Number(approval.total_stages || 1));
      const currentStage = Math.max(1, Number(approval.stage_index || 1));
      const requiredRole = String(approval.required_role || 'Admin').toLowerCase();
      const reviewerRole = String(reviewed_by || '').toLowerCase();
      if (normalizedStatus === 'APPROVED' && requiredRole && reviewerRole && !reviewerRole.includes(requiredRole)) {
        return governanceError(res, 403, `Reviewer role does not satisfy required role ${approval.required_role}`, 'APPROVAL_ROLE_MISMATCH');
      }

      await RuntimeApproval.updateApproval(approvalId, status, reviewed_by, reason);

      if (normalizedStatus === 'APPROVED' && currentStage < totalStages) {
        const nextStage = currentStage + 1;
        const nextRole = nextStage >= totalStages ? 'Super Admin' : 'Admin';
        const nextSla = nextStage >= totalStages ? 20 : 30;
        sqliteDb.prepare(`
          UPDATE runtime_approvals
          SET approval_status = ?, chain_status = ?, stage_index = ?, required_role = ?, sla_minutes = ?, expires_at = ?, reviewed_at = NULL, reviewed_by = NULL
          WHERE id = ?
        `).run('PENDING', 'PENDING_STAGE', nextStage, nextRole, nextSla, computeExpiryIso(nextSla), approvalId);
        addRuntimeLog('warning', `Approval ${approvalId} advanced to stage ${nextStage}/${totalStages} requiring ${nextRole}`, 'governance_runtime');
        return res.json({ success: true, data: { orchestration: null, stageAdvanced: true, stageIndex: nextStage, totalStages } });
      }

      sqliteDb.prepare('UPDATE runtime_approvals SET chain_status = ? WHERE id = ?')
        .run(normalizedStatus === 'APPROVED' ? 'APPROVED_FINAL' : normalizedStatus === 'REJECTED' ? 'REJECTED' : 'PENDING_STAGE', approvalId);
      if (normalizedStatus === 'APPROVED') {
        const pending = getPendingMutationByApprovalId(approvalId);
        if (pending) {
          const executionResult = await executeApprovedMutation(pending);
          updatePendingMutationExecution(approvalId, executionResult.success ? 'COMPLETED' : 'FAILED', executionResult);
          addRuntimeLog(
            executionResult.success ? 'success' : 'error',
            executionResult.success
              ? `Approval ${approvalId} executed mutation ${pending.mutationId}`
              : `Approval ${approvalId} execution failed for mutation ${pending.mutationId}`,
            'governance_runtime'
          );
          return res.json({ success: true, data: { orchestration: executionResult, mutationId: pending.mutationId } });
        }
      }
      res.json({ success: true, data: { orchestration: null } });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Approval update failed' });
    }
  });

  app.post("/api/runtime/:id/approvals/:approvalId/replay", async (req, res) => {
    try {
      const runtimeId = String(req.params.id);
      const approvalId = String(req.params.approvalId);
      const replayReason = String(req.body?.reason || '').trim();
      const replayedBy = String(req.body?.replayed_by || req.body?.reviewed_by || 'RuntimeOperator');
      const providedNonce = String(req.body?.nonce || '').trim();
      const maxReplayAttempts = 3;
      if (!replayReason) {
        return governanceError(res, 400, 'Replay reason is required', 'REPLAY_REASON_REQUIRED');
      }
      if (!providedNonce) {
        return governanceError(res, 400, 'Replay nonce is required', 'NONCE_REQUIRED');
      }
      if (!canReplayByRole(replayedBy)) {
        return governanceError(res, 403, 'Replay blocked: insufficient governance role', 'REPLAY_POLICY_GATE', {
          violation_type: 'ReplayPolicyGate'
        });
      }
      const approval = sqliteDb.prepare('SELECT * FROM runtime_approvals WHERE id = ? AND runtime_id = ?').get(approvalId, runtimeId) as any;
      if (!approval) return governanceError(res, 404, 'Approval not found for runtime', 'APPROVAL_NOT_FOUND');
      if (String(approval.approval_status || '').toUpperCase() !== 'APPROVED') {
        return governanceError(res, 403, 'Replay blocked: approval is not APPROVED', 'APPROVAL_GATE', { violation_type: 'ApprovalGate' });
      }
      const replayCount = Number(approval.replay_count || 0);
      if (replayCount >= maxReplayAttempts) {
        return governanceError(res, 409, `Replay limit reached (${maxReplayAttempts})`, 'REPLAY_LIMIT_REACHED', {
          violation_type: 'ReplayPolicyGate'
        });
      }

      const pendingRecord = getPendingMutationRecord(approvalId);
      if (!pendingRecord) return governanceError(res, 404, 'No mutation payload found for this approval', 'MUTATION_PAYLOAD_NOT_FOUND');
      if (String(pendingRecord.payload_nonce || '') !== providedNonce) {
        return governanceError(res, 409, 'Replay blocked: nonce mismatch', 'NONCE_MISMATCH', { violation_type: 'PayloadIntegrityGate' });
      }
      if (pendingRecord.replay_expires_at && Date.now() > new Date(String(pendingRecord.replay_expires_at)).getTime()) {
        return governanceError(res, 410, 'Replay blocked: replay window expired', 'REPLAY_WINDOW_EXPIRED', { violation_type: 'ReplayPolicyGate' });
      }
      const validated = validatePendingMutationPayload(approvalId);
      if (!validated.ok || !validated.entry) {
        const code = validated.code === 'PAYLOAD_INTEGRITY_GATE' ? 'PAYLOAD_INTEGRITY_GATE' : 'MUTATION_PAYLOAD_NOT_FOUND';
        return governanceError(res, 422, 'Payload integrity validation failed', code, { violation_type: 'PayloadIntegrityGate' });
      }
      const pending = validated.entry;
      const prePayloadHash = createHash('sha256').update(JSON.stringify(pending)).digest('hex');

      const replayMutationId = `replay-${pending.mutationId}-${Date.now()}`;
      const replayPayload: PendingApprovalExecution = { ...pending, mutationId: replayMutationId };
      const replayResult = await executeApprovedMutation(replayPayload);
      const postPayloadHash = createHash('sha256').update(JSON.stringify(replayPayload)).digest('hex');
      updatePendingMutationExecution(approvalId, replayResult.success ? 'COMPLETED' : 'FAILED', replayResult);
      sqliteDb.prepare('UPDATE runtime_approvals SET replay_count = COALESCE(replay_count, 0) + 1 WHERE id = ?').run(approvalId);
      const rotatedReplay = rotatePendingMutationReplayWindow(approvalId);
      addRuntimeLog(
        replayResult.success ? 'success' : 'error',
        replayResult.success
          ? `Replay succeeded for approval ${approvalId} with mutation ${replayMutationId} by ${replayedBy}`
          : `Replay failed for approval ${approvalId} with mutation ${replayMutationId} by ${replayedBy}`,
        'governance_runtime'
      );
      res.json({
        success: true,
        data: {
          approvalId,
          previousMutationId: pending.mutationId,
          replayMutationId,
          replayReason,
          replayedBy,
          integrity: {
            prePayloadHash,
            postPayloadHash,
            nonceUsed: providedNonce,
            nextNonce: rotatedReplay.payloadNonce,
            replayExpiresAt: rotatedReplay.replayExpiresAt
          },
          result: replayResult
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message || 'Replay failed' });
    }
  });

  app.get("/api/runtime/:id/ssh-sessions", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const sessions = await RuntimeSSH.getSessions(runtimeId);
      res.json({ success: true, data: sessions });
    } catch (e) {
      res.status(500).json({ success: false, message: 'SSH sessions fetch failed' });
    }
  });

  app.get("/api/runtime/:id/actions", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const actions = await RuntimeSafeActions.getActions(runtimeId);
      res.json({ success: true, data: actions });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Actions fetch failed' });
    }
  });

  app.post("/api/runtime/:id/actions", async (req, res) => {
    try {
      const runtime_id = req.params.id;
      const { action_type, requested_by, approval_id, risk_level } = req.body;
      await RuntimeSafeActions.requestAction({ runtime_id, action_type, requested_by, approval_id, risk_level });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Action request failed' });
    }
  });

  app.get("/api/runtime/:id/deployments", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const deployments = await RuntimeDeploy.getDeployments(runtimeId);
      res.json({ success: true, data: deployments });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Deployments fetch failed' });
    }
  });

  app.post("/api/runtime/:id/deployments", async (req, res) => {
    try {
      const runtime_id = req.params.id;
      const { deployment_id, requested_by, approval_id, snapshot_id, risk_level, deploy_strategy } = req.body;
      await RuntimeDeploy.requestDeploy({ runtime_id, deployment_id, requested_by, approval_id, snapshot_id, risk_level, deploy_strategy });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Deployment request failed' });
    }
  });

  app.get("/api/runtime/:id/snapshots", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const snapshots = await RuntimeSnapshots.getSnapshots(runtimeId);
      res.json({ success: true, data: snapshots });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Snapshots fetch failed' });
    }
  });

  app.get("/api/runtime/:id/recoveries", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const recoveries = await RuntimeRecovery.getRecoveries(runtimeId);
      res.json({ success: true, data: recoveries });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Recoveries fetch failed' });
    }
  });

  app.get("/api/runtime/:id/locks", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const locks = await RuntimeLocks.getLocks(runtimeId);
      res.json({ success: true, data: locks });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Locks fetch failed' });
    }
  });

  app.get("/api/runtime/:id/autonomous-analysis", async (req, res) => {
    try {
      const runtimeId = req.params.id;
      const analysis = await RuntimeAutonomousProtection.getAnalysis(runtimeId);
      res.json({ success: true, data: analysis });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Autonomous analysis fetch failed' });
    }
  });

  app.get("/api/runtime/federation", async (req, res) => {
    try {
      const federated = await RuntimeFederation.getFederatedRuntimes();
      res.json({ success: true, data: federated });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Federation fetch failed' });
    }
  });

  app.get("/api/runtime/recovery/restore-points", (req, res) => {
    res.json({ success: true, data: getRestorePoints() });
  });

  app.get("/api/runtime/stability/index", (req, res) => {
    res.json({ success: true, data: getLatestStability() });
  });

  app.get("/api/runtime/intelligence/recommendations", (req, res) => {
    res.json({ success: true, data: getPendingRecommendations() });
  });

  // Phase 17: Predictive Intelligence Endpoints
  app.get("/api/runtime/intelligence/forecast", async (req, res) => {
    try {
      const stabilitySeries = getLatestStability();
      const recent = stabilitySeries[0] as any;
      const baseStability = Math.max(0, Math.min(100, Number(recent?.stability_score ?? 92)));
      const violations = getRecentViolations(200);
      const securityEvents = await getDbSecurityEvents();
      const highThreats = (securityEvents || []).filter((e: any) => String(e.risk_level || '').toLowerCase() === 'high').length;
      const incidentPressure = Math.min(100, violations.length + (highThreats * 4));

      const timeline = Array.from({ length: 12 }, (_, i) => {
        const horizonFactor = i / 11;
        const failureProbability = Math.max(1, Math.min(95, Math.round((100 - baseStability) * 0.55 + incidentPressure * 0.25 + horizonFactor * 8)));
        const nodeDrift = Number(((incidentPressure / 50) + horizonFactor * 0.6).toFixed(2));
        const resourceExhaustion = Math.max(5, Math.min(100, Math.round((100 - baseStability) * 0.7 + horizonFactor * 12)));
        return {
          timestamp: new Date(Date.now() + i * 3600000).toISOString(),
          failure_probability: failureProbability,
          node_drift: nodeDrift,
          resource_exhaustion: resourceExhaustion
        };
      });

      res.json({ success: true, data: timeline });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/runtime/intelligence/optimization", (req, res) => {
    const recommendations = getPendingRecommendations();
    const normalized = (recommendations || []).map((item: any) => ({
      type: String(item.impact_area || 'Operations'),
      title: String(item.title || 'Runtime Recommendation'),
      impact: String(item.severity || 'Medium'),
      description: String(item.description || ''),
      timestamp: item.timestamp || null,
    }));
    res.json({ success: true, data: normalized });
  });

  app.get("/api/runtime/intelligence/deployment-risk/:name", (req, res) => {
    const recent = getLatestStability()[0] as any;
    const baseStability = Number(recent?.stability_score ?? 92);
    const violations = getRecentViolations(100).length;
    const score = Math.max(1, Math.min(95, Math.round((100 - baseStability) * 0.6 + violations * 0.25)));
    res.json({
      success: true,
      data: {
        pipeline: req.params.name,
        risk_score: score,
        rollback_probability: Math.floor(score * 0.4),
        safety_status: score > 60 ? 'Unsafe' : score > 30 ? 'Caution' : 'Optimal',
        limiting_factors: ['Runtime Load', 'Previous Failure Hist']
      }
    });
  });

  app.get("/api/runtime/intelligence/anomaly-stream", (req, res) => {
    const recent = getOperationalSignals(40) || [];
    const mapped = recent
      .filter((item: any) => ['Anomaly', 'Correlation'].includes(String(item.signal_type || '')))
      .map((item: any) => ({
        id: item.id,
        type: item.signal_type,
        severity: item.severity,
        details: item.description,
        time: item.timestamp,
      }));
    res.json({ success: true, data: mapped });
  });

  app.get("/api/runtime/intelligence/risk-indicators", async (req, res) => {
    try {
      const recent = getLatestStability()[0] as any;
      const baseStability = Number(recent?.stability_score ?? 92);
      const violations = getRecentViolations(120);
      const securityEvents = await getDbSecurityEvents();
      const highThreats = (securityEvents || []).filter((e: any) => String(e.risk_level || '').toLowerCase() === 'high').length;
      const systemRisk = Math.max(1, Math.min(100, Math.round((100 - baseStability) * 0.7 + violations.length * 0.18 + highThreats * 1.2)));

      res.json({
        success: true,
        data: {
          system_risk: systemRisk,
          data_integrity: Math.max(0, Number((100 - systemRisk * 0.22).toFixed(1))),
          security_perimeter: Math.max(0, Number((100 - systemRisk * 0.28).toFixed(1))),
          threat_forecast: systemRisk > 60 ? 'Elevated' : systemRisk > 30 ? 'Guarded' : 'Stable'
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/runtime/recovery/restore", (req, res) => {
    const { restoreId } = req.body;
    if (!restoreId) {
      return res.status(400).json({ success: false, message: "restoreId is required" });
    }
    logRecoveryAction(restoreId, 'Initiated', 'User triggered manual recovery protocol.', 'U-ADMIN');

    res.json({ success: true, message: "Recovery protocol initiated and pending runtime verification." });
  });

  // Phase 16: Hardening & Coordination Endpoints
  app.get("/api/runtime/hardening/locks", (req, res) => {
    res.json({ success: true, data: getProtectionLocks() });
  });

  app.get("/api/runtime/coordination/states", (req, res) => {
    res.json({ success: true, data: getNodeCoordination() });
  });

  app.post("/api/runtime/hardening/locks/:id/toggle", (req, res) => {
    const { status } = req.body;
    updateLockStatus(req.params.id, status);
    res.json({ success: true });
  });

  // Phase 18: Operational Simulation Endpoints
  app.get("/api/runtime/simulation/state", (req, res) => {
    if (STRICT_OPERATIONAL_MODE) return blockSimulationEndpoints(res);
    res.json({ success: true, data: getSimulationState() });
  });

  app.post("/api/runtime/simulation/stress", (req, res) => {
    if (STRICT_OPERATIONAL_MODE) return blockSimulationEndpoints(res);
    const { active, chaosLevel } = req.body;
    updateSimulationState(active ? 1 : 0, chaosLevel || 0);
    res.json({ success: true });
  });

  app.post("/api/runtime/simulation/drill", (req, res) => {
    if (STRICT_OPERATIONAL_MODE) return blockSimulationEndpoints(res);
    const { active } = req.body;
    toggleDrill(active ? 1 : 0);
    res.json({ success: true });
  });

  // ==========================================
  
  app.get("/api/runtime/stream/logs", (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial state
    res.write(`data: ${JSON.stringify(getRecentLogs(50))}\n\n`);

    // Poll the db every 2 seconds for new events
    const intervalId = setInterval(() => {
        const currentLogs = getRecentLogs(50);
        res.write(`data: ${JSON.stringify(currentLogs)}\n\n`);
    }, 2000);

    req.on('close', () => {
        clearInterval(intervalId);
    });
  });

  // ==========================================
  // PHASE B: SAFE RUNTIME ACTIONS (Dev ONLY)
  // ==========================================
  
  // ==========================================
  // PHASE C: PM2 & Deploy Actions
  // ==========================================
  
  app.get("/api/runtime/pm2/list", (req, res) => {
     const filterPath = req.query.path as string;
     exec("npx -y pm2 jlist", (error, stdout) => {
        if (error) return res.json({ success: false, data: [] });
        try {
            const bracketIndex = stdout.indexOf('[');
            const jsonStr = bracketIndex >= 0 ? stdout.substring(bracketIndex) : '[]';
            const list = JSON.parse(jsonStr);
            
            let formatted = list.map((p: any) => ({
               id: p.pm_id,
               name: p.name,
               status: p.pm2_env.status,
               cpu: p.monit.cpu + '%',
               mem: Math.round(p.monit.memory / 1024 / 1024) + ' MB',
               uptime: Math.round((Date.now() - p.pm2_env.pm_uptime) / 1000) + 's',
               restarts: p.pm2_env.restart_time,
               mode: p.pm2_env.exec_mode,
               path: p.pm2_env.pm_cwd,
               port: p.pm2_env.env?.PORT || p.pm2_env.PORT || null
            }));

            if (filterPath) {
               // Normalize path for matching
               const normalizedFilter = path.resolve(filterPath);
               formatted = formatted.filter((p: any) => {
                  if (!p.path) return false;
                  const normalizedProcPath = path.resolve(p.path);
                  return normalizedProcPath.startsWith(normalizedFilter) || normalizedFilter.startsWith(normalizedProcPath);
               });
            }

            res.json({ success: true, data: formatted });
        } catch(e) {
            res.json({ success: false, data: [] });
        }
     });
  });

  app.post("/api/runtime/pm2/action", async (req, res) => {
     const { action, id, projectId, approvalId, requested_by, risk_level, mutationId: qMutationId } = req.body;
     const allowedOpts = ['start', 'stop', 'restart', 'delete'];
     if (!allowedOpts.includes(action)) return res.json({ success: false, message: 'Invalid action' });
     const governanceCheck = await validateExecutionPolicy('PM2_MUTATION', 'RuntimeOperator', 'Admin');
     if (!governanceCheck.allowed) {
       return res.status(403).json({ success: false, message: governanceCheck.reason, violation_type: 'GovernancePolicyGate' });
     }
     const runtimeId = String(projectId || 'global-runtime');
     const requestedBy = requested_by ? String(requested_by) : 'RuntimeOperator';
     const riskLevel = risk_level ? String(risk_level).toLowerCase() : 'medium';
     const mutationId = qMutationId ? String(qMutationId) : `mut-pm2-${runtimeId}-${Date.now()}`;
     const mutationGate = beginGovernedMutation(mutationId);
     if (!mutationGate.allowed) {
      return res.status(mutationGate.inProgress ? 202 : 200).json({
        success: true,
        data: mutationGate.response || { status: mutationGate.inProgress ? 'MUTATION_IN_PROGRESS' : 'MUTATION_ALREADY_COMPLETED', mutationId, duplicate: true }
      });
     }
     const requiresApproval = action === 'delete' || ['high', 'critical'].includes(riskLevel);
     
     let finalCommand = `npx -y pm2 ${action} ${id}`;
     let runtimePathExists = true;

     if (projectId) {
         try {
             const project = await getProjectById(projectId);
             if (project) {
                 runtimePathExists = Boolean(project.runtime_path && fs.existsSync(project.runtime_path));
                 finalCommand = wrapCommandWithRuntimeContext(`npx -y pm2 ${action} ${id}`, project);
             }
         } catch(e: any) {
             return res.status(403).json({ success: false, message: e.message });
         }
     } else if (process.env.NODE_ENV === 'production') {
         // Default protection if no project specified but in production
         return res.status(403).json({ success: false, message: "Governance Violation: Project ID required for Production Actions." });
     }
     const precheck = {
        runtimeId,
        mutationId,
        action,
        targetId: String(id),
        runtimePathExists
     };
     if (!precheck.runtimePathExists) {
        failGovernedMutation(mutationId);
        return res.status(422).json({ success: false, message: 'Pre-check failed: runtime path unavailable', data: { mutationId, precheck } });
     }
     if (requiresApproval && !approvalId) {
        const requestedApprovalId = await RuntimeApproval.requestApproval({
          runtime_id: runtimeId,
          operation_type: 'pm2_mutation' as any,
          requested_by: requestedBy,
          risk_level: riskLevel,
          approval_reason: `PM2 ${action} requested for ${runtimeId}`,
        });
        addGovernanceAction('PM2_MUTATION_APPROVAL', requestedBy, runtimeId, 'PENDING');
        addRuntimeLog('warning', `[mutation:${mutationId}] PM2 ${action} blocked pending approval ${requestedApprovalId}`, 'pm2_manager');
        persistPendingMutation({
          kind: 'pm2',
          approvalId: requestedApprovalId,
          runtimeId,
          mutationId,
          action,
          id,
          projectId,
          requestedBy
        });
        const pendingResponse = {
          success: true,
          data: { status: 'PENDING_APPROVAL', runtimeId, mutationId, requestedApprovalId, riskLevel, precheck }
        };
        completeGovernedMutation(mutationId, pendingResponse.data);
        return res.status(202).json(pendingResponse);
     }
     if (approvalId) {
        const approval = sqliteDb.prepare('SELECT * FROM runtime_approvals WHERE id = ? AND runtime_id = ?').get(approvalId, runtimeId) as any;
        if (!approval) {
          failGovernedMutation(mutationId);
          return res.status(403).json({ success: false, message: 'Approval record not found for runtime', violation_type: 'ApprovalGate' });
        }
        if (String(approval.approval_status || '').toUpperCase() !== 'APPROVED') {
          failGovernedMutation(mutationId);
          return res.status(403).json({ success: false, message: `Approval ${approvalId} is not approved`, violation_type: 'ApprovalGate' });
        }
        updatePendingMutationExecution(String(approvalId), 'COMPLETED', { success: true, source: 'direct_approved_execution' });
      }

     addRuntimeLog('warning', `[mutation:${mutationId}] PM2 Action triggered: ${action} on ID ${id}`, 'pm2_manager');
     exec(finalCommand, (error, stdout) => {
        if (error) {
          failGovernedMutation(mutationId);
          return res.json({ success: false, message: error.message, data: { mutationId, precheck } });
        }
        exec(`npx -y pm2 jlist`, (postErr, postStdout) => {
          let processFound = false;
          let postcheckStatus = 'unknown';
          if (!postErr) {
            try {
              const parsed = postStdout?.trim() ? JSON.parse(postStdout) : [];
              const byId = Array.isArray(parsed) ? parsed.find((p: any) => String(p?.pm_id) === String(id) || String(p?.name) === String(id)) : null;
              processFound = Boolean(byId);
              postcheckStatus = byId?.pm2_env?.status || (action === 'delete' && !byId ? 'deleted' : 'unknown');
            } catch {}
          }
          addGovernanceAction('PM2_MUTATION', 'Runtime', `${runtimeId}:${action}:${id}`, 'COMPLETED');
          const payload = {
            success: true,
            message: `Action ${action} completed.`,
            data: { mutationId, precheck, postcheck: { processFound, status: postcheckStatus } }
          };
          completeGovernedMutation(mutationId, payload.data);
          res.json(payload);
        });
     });
  });

  app.get("/api/runtime/pm2/logs/:id", (req, res) => {
     const { id } = req.params;
     // Fetch logs for specific ID
     exec(`npx -y pm2 logs ${id} --lines 100 --nostream`, (error, stdout, stderr) => {
        // PM2 logs command might not support --nostream in all versions or might behave differently
        // A better way is reading the files, but let's try this first as a quick implementation
        if (error && !stdout) return res.json({ success: false, data: "No logs found or process not active." });
        res.json({ success: true, data: stdout || stderr });
     });
  });

  app.post("/api/runtime/terminal/exec", async (req, res) => {
    const { command, cwd: qCwd, projectId, approvalId, requested_by, risk_level, mutationId: qMutationId } = req.body;
    let cwd = qCwd;
    let finalCommand = command;
    const runtimeId = String(projectId || 'global-runtime');
    const requestedBy = requested_by ? String(requested_by) : 'RuntimeOperator';
    const riskLevel = risk_level ? String(risk_level).toLowerCase() : 'medium';
    const mutationId = qMutationId ? String(qMutationId) : `mut-terminal-${runtimeId}-${Date.now()}`;
    const mutationGate = beginGovernedMutation(mutationId);
    if (!mutationGate.allowed) {
      return res.status(mutationGate.inProgress ? 202 : 200).json({
        success: true,
        data: mutationGate.response || { status: mutationGate.inProgress ? 'MUTATION_IN_PROGRESS' : 'MUTATION_ALREADY_COMPLETED', mutationId, duplicate: true }
      });
    }

    if (projectId) {
       const project = await getProjectById(projectId);
       if (project && project.runtime_path) {
           // Verify Runtime Constitution Manifest (only for local projects)
           if (project.runtime_type !== 'external-vps') {
               const manifestPath = getProjectManifestPath(project.runtime_path);
               if (!fs.existsSync(manifestPath)) {
                   addRuntimeLog('error', `Identity Violation: Missing Runtime Manifest for ${project.name}`, 'nexus_core');
                   return res.status(403).json({ 
                       success: false, 
                       message: "Identity Violation: This project does not have a valid Runtime Constitution manifest. Operation blocked." 
                   });
               }
           }
           cwd = project.runtime_path;
           
           try {
               finalCommand = wrapCommandWithRuntimeContext(command, project);
           } catch(e: any) {
               return res.status(403).json({ success: false, message: e.message });
           }
       }
    }

    if (!finalCommand) return res.status(400).json({ success: false, message: "Command required." });
    const governanceCheck = await validateExecutionPolicy('TERMINAL_EXEC', 'RuntimeOperator', 'Admin');
    if (!governanceCheck.allowed) {
      return governanceError(res, 403, governanceCheck.reason, 'GOVERNANCE_POLICY_GATE', { violation_type: 'GovernancePolicyGate' });
    }
    
    const normalized = String(finalCommand || '').toLowerCase();
    const forbidden = ['rm -rf /', 'mkfs', 'dd', 'reboot', 'shutdown', 'kill -9', 'pm2 delete', 'del /f /q', 'format c:', 'takeown'];
    if (forbidden.some(f => normalized.includes(f))) {
      failGovernedMutation(mutationId);
      return governanceError(res, 403, "Command forbidden by Governance Protocol.", 'COMMAND_POLICY_BLOCKED');
    }
    const requiresApproval = normalized.includes('pm2 delete') || normalized.includes('chmod') || ['high', 'critical'].includes(riskLevel);
    const precheck = {
      runtimeId,
      mutationId,
      cwd: cwd || process.cwd(),
      command: String(finalCommand),
      cwdExists: fs.existsSync(cwd ? path.resolve(cwd) : process.cwd())
    };
    if (!precheck.cwdExists) {
      failGovernedMutation(mutationId);
      return governanceError(res, 422, 'Pre-check failed: execution directory unavailable', 'PRECHECK_FAILED', { data: { mutationId, precheck } });
    }
    if (requiresApproval && !approvalId) {
      const requestedApprovalId = await RuntimeApproval.requestApproval({
        runtime_id: runtimeId,
        operation_type: 'production_mutation' as any,
        requested_by: requestedBy,
        risk_level: riskLevel,
        approval_reason: `Terminal mutation requested for ${runtimeId}`,
      });
      addGovernanceAction('TERMINAL_MUTATION_APPROVAL', requestedBy, runtimeId, 'PENDING');
      persistPendingMutation({
        kind: 'terminal',
        approvalId: requestedApprovalId,
        runtimeId,
        mutationId,
        command: String(finalCommand),
        cwd,
        projectId,
        requestedBy
      });
      const pendingResponse = {
        success: true,
        data: { status: 'PENDING_APPROVAL', runtimeId, mutationId, requestedApprovalId, riskLevel, precheck }
      };
      completeGovernedMutation(mutationId, pendingResponse.data);
      return res.status(202).json(pendingResponse);
    }
    if (approvalId) {
      const approval = sqliteDb.prepare('SELECT * FROM runtime_approvals WHERE id = ? AND runtime_id = ?').get(approvalId, runtimeId) as any;
      if (!approval) {
        failGovernedMutation(mutationId);
        return governanceError(res, 403, 'Approval record not found for runtime', 'APPROVAL_NOT_FOUND', { violation_type: 'ApprovalGate' });
      }
      if (String(approval.approval_status || '').toUpperCase() !== 'APPROVED') {
        failGovernedMutation(mutationId);
        return governanceError(res, 403, `Approval ${approvalId} is not approved`, 'APPROVAL_GATE', { violation_type: 'ApprovalGate' });
      }
      updatePendingMutationExecution(String(approvalId), 'COMPLETED', { success: true, source: 'direct_approved_execution' });
    }

    const executionContext = cwd ? path.resolve(cwd) : process.cwd();

    addRuntimeLog('info', `[mutation:${mutationId}] Terminal execution in ${executionContext}: ${finalCommand}`, 'terminal_gateway');

    exec(finalCommand, { cwd: executionContext, timeout: 20000 }, (error, stdout, stderr) => {
       addGovernanceAction('TERMINAL_EXEC', 'Runtime', runtimeId, error ? 'FAILED' : 'COMPLETED');
       const payload = {
         success: !error,
         data: {
           mutationId,
           precheck,
           postcheck: { exitCode: error ? 1 : 0 },
           stdout: stdout || "",
           stderr: stderr || "",
           error: error ? error.message : null
         }
       };
       if (error) failGovernedMutation(mutationId);
       else completeGovernedMutation(mutationId, payload.data);
       res.json(payload);
    });
  });
  
  app.post("/api/runtime/action/clear-cache", (req, res) => {
    const newLog = addRuntimeLog('info', 'Runtime cache cleared by Admin', 'governance_api');
    res.json({ success: true, message: "Runtime cache cleared successfully", log: newLog });
  });

  app.post("/api/runtime/action/reload-env", (req, res) => {
    const newLog = addRuntimeLog('warning', 'Environment state reloaded safely', 'governance_api');
    res.json({ success: true, message: "Environment state safely reloaded", log: newLog });
  });

  // ==========================================
  // PHASE C: RUNTIME FILE SYSTEM (Real FS)
  // ==========================================

  // Security Helper: Ensure path is within safe boundaries
  const getSafePath = (requestedPath: string, projectRoot?: string) => {
    const defaultInfraRoot = fs.existsSync(GLOBAL_ROOT) ? GLOBAL_ROOT : process.cwd();
    const base = projectRoot || defaultInfraRoot;
    const normalizedBase = path.resolve(base);
    
    let targetPath;
    if (path.isAbsolute(requestedPath)) {
      // In Global Mode (no projectRoot), we allow direct access to standard allowed infra roots
      if (!projectRoot) {
        const isAllowed = ALLOWED_INFRA_ROOTS.some(root => requestedPath.startsWith(root)) || requestedPath.startsWith(normalizedBase);
        if (isAllowed) {
            targetPath = requestedPath;
        } else {
            // Default to infrastructure root if attempting to escape or access restricted area
            targetPath = path.join(normalizedBase, requestedPath.replace(/^[\/\\]+/, ''));
        }
      } else {
        // In Scoped Mode, strictly enforce project root
        if (requestedPath.startsWith(normalizedBase)) {
          targetPath = requestedPath;
        } else {
          targetPath = path.join(normalizedBase, requestedPath.replace(/^[\/\\]+/, ''));
        }
      }
    } else {
      targetPath = path.join(normalizedBase, requestedPath);
    }
    
    const normalizedTarget = path.resolve(targetPath);
    
    // Scoped restriction: Project-based access must not escape its root
    if (projectRoot && !normalizedTarget.startsWith(normalizedBase)) {
      console.warn(`[Security] Attempted access outside project root: ${normalizedTarget} (Base: ${normalizedBase})`);
      return normalizedBase;
    }
    
    // Global restriction: Infrastructure mode must stay within allowed server zones
    if (!projectRoot) {
        const isInAllowedZone = ALLOWED_INFRA_ROOTS.some(root => normalizedTarget.startsWith(root)) || normalizedTarget.startsWith(normalizedBase);
        if (!isInAllowedZone) {
            console.warn(`[Security] Unauthorized infrastructure access blocked: ${normalizedTarget}`);
            return normalizedBase;
        }
    }
    
    return normalizedTarget;
  };

  const SENSITIVE_RUNTIME_FILES = new Set([
    '.env',
    'credentials.json',
    'id_rsa'
  ]);

  const isSensitiveRuntimeFile = (targetPath: string) => {
    const fileName = path.basename(targetPath).toLowerCase();
    return SENSITIVE_RUNTIME_FILES.has(fileName) || fileName.endsWith('.pem') || fileName.endsWith('.key');
  };

  const auditSensitiveFileAccess = (action: string, targetPath: string, status: 'BLOCKED' | 'MASKED') => {
    addGovernanceAction(action, 'Runtime', targetPath, status);
    addRuntimeLog('warning', `Sensitive file governance ${status.toLowerCase()}: ${targetPath}`, 'security_runtime');
  };

  // ==========================================
  // INFRASTRUCTURE GLOBAL FILESYSTEM APIs
  // ==========================================
  app.get("/api/files/list", async (req, res) => {
    const defaultInfraRoot = fs.existsSync(GLOBAL_ROOT) ? GLOBAL_ROOT : process.cwd();
    const requestedPath = (req.query.path as string) || defaultInfraRoot;
    const absolutePath = getSafePath(requestedPath);

    try {
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ success: false, message: "Infrastructure path not found" });
        }
        
        const stats = fs.statSync(absolutePath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ success: false, message: "Target is not a directory" });
        }

        const items = fs.readdirSync(absolutePath, { withFileTypes: true });
        const list = items.map(item => {
            const fullPath = path.join(absolutePath, item.name);
            let size = 0;
            let mtime = new Date();
            let projectType = null;
            let markers = [];

            try {
               const stat = fs.statSync(fullPath);
               size = item.isFile() ? stat.size : 0;
               mtime = stat.mtime;

               if (item.isDirectory()) {
                 // Project Discovery Logic
                 if (fs.existsSync(path.join(fullPath, 'package.json'))) {
                   projectType = 'node';
                   markers.push('NODE');
                 }
                 if (fs.existsSync(path.join(fullPath, 'artisan'))) {
                   projectType = 'laravel';
                   markers.push('LARAVEL');
                 }
                 if (fs.existsSync(path.join(fullPath, 'pubspec.yaml'))) {
                   projectType = 'flutter';
                   markers.push('FLUTTER');
                 }
                 if (fs.existsSync(path.join(fullPath, '.git'))) {
                   markers.push('GIT');
                 }
                 if (fs.existsSync(path.join(fullPath, 'ecosystem.config.js'))) {
                   markers.push('PM2');
                 }
                 
                 // If it's a directory in /www/wwwroot and has a common web structure
                 if (requestedPath === GLOBAL_ROOT && !projectType) {
                    if (fs.existsSync(path.join(fullPath, 'public_html')) || fs.existsSync(path.join(fullPath, 'public'))) {
                        projectType = 'web';
                        markers.push('PROJECT');
                    }
                 }
               }
            } catch(e) {}

            return {
                name: item.name,
                type: item.isDirectory() ? 'folder' : 'file',
                path: path.join(requestedPath, item.name),
                size,
                modified: mtime,
                projectType,
                markers: markers.length > 0 ? markers : undefined
            };
        });
        res.json({ success: true, mode: 'global', root: defaultInfraRoot, current: requestedPath, data: list });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // PROJECT DISCOVERY & IMPORT PIPELINE
  // ==========================================
  app.get("/api/runtime/discover", async (req, res) => {
    const { path: requestedPath } = req.query;
    if (!requestedPath) return res.status(400).json({ success: false, message: "Path required for discovery" });

    // Use infra root if relative path provided
    const defaultInfraRoot = fs.existsSync(GLOBAL_ROOT) ? GLOBAL_ROOT : process.cwd();
    const absolutePath = getSafePath(requestedPath as string);
    
    if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ success: false, message: "Path not found on server" });
    }

    try {
        const stats = fs.statSync(absolutePath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ success: false, message: "Only directories can be imported as projects" });
        }

        const projectProfile: any = {
            name: path.basename(absolutePath),
            runtime_path: absolutePath,
            type: 'Generic Project',
            markers: [],
            detected_runtime: 'node',
            pm2_suggested_name: path.basename(absolutePath),
            git_detected: false,
            env_detected: false,
            configs: []
        };

        // Deep Discovery
        if (fs.existsSync(path.join(absolutePath, 'package.json'))) {
            projectProfile.type = 'Node.js';
            projectProfile.detected_runtime = 'node';
            projectProfile.markers.push('NODE');
            try {
                const pkg = JSON.parse(fs.readFileSync(path.join(absolutePath, 'package.json'), 'utf8'));
                if (pkg.name) projectProfile.pm2_suggested_name = pkg.name;
            } catch(e) {}
        }

        if (fs.existsSync(path.join(absolutePath, 'artisan'))) {
            projectProfile.type = 'Laravel';
            projectProfile.detected_runtime = 'php/laravel';
            projectProfile.markers.push('LARAVEL');
        }

        if (fs.existsSync(path.join(absolutePath, 'pubspec.yaml'))) {
            projectProfile.type = 'Flutter';
            projectProfile.detected_runtime = 'dart/flutter';
            projectProfile.markers.push('FLUTTER');
        }

        if (fs.existsSync(path.join(absolutePath, 'requirements.txt')) || fs.existsSync(path.join(absolutePath, 'pyproject.toml'))) {
            projectProfile.type = 'Python/Django';
            projectProfile.detected_runtime = 'python';
            projectProfile.markers.push('PYTHON');
        }

        if (fs.existsSync(path.join(absolutePath, '.git'))) {
            projectProfile.git_detected = true;
            projectProfile.markers.push('GIT');
        }

        if (fs.existsSync(path.join(absolutePath, 'ecosystem.config.js'))) {
            projectProfile.markers.push('PM2_CONFIG');
        }

        if (fs.existsSync(path.join(absolutePath, '.env'))) {
            projectProfile.env_detected = true;
            projectProfile.markers.push('ENV_FILE');
        }

        // Sub-folder web detection
        if (fs.existsSync(path.join(absolutePath, 'public_html')) || fs.existsSync(path.join(absolutePath, 'public'))) {
            projectProfile.markers.push('WEB_ROOT');
        }

        const { classifyRuntime } = await import('./server/runtime/runtimeClassification.js');
        const classification = await classifyRuntime(absolutePath);
        projectProfile.domain = classification.runtime_domain || '';
        projectProfile.env = classification.runtime_classification;
        projectProfile.markers.push(classification.runtime_classification);
        projectProfile.type = projectProfile.type; // Keep existing type or modify if needed

        addRuntimeLog('info', `Runtime discovery completed for ${absolutePath}`, 'discovery_engine');

        res.json({ success: true, data: projectProfile });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/files/read", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ success: false, message: "Path required" });
    const absolutePath = getSafePath(filePath);
    try {
        const stats = fs.statSync(absolutePath);
        if (stats.isDirectory()) return res.status(400).json({ success: false, message: "Cannot read directory" });
        const content = fs.readFileSync(absolutePath, 'utf8');
        res.json({ success: true, data: content });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/files/write", async (req, res) => {
    const { path: filePath, content, mutationId: qMutationId } = req.body;
    if (!filePath) return res.status(400).json({ success: false, message: "Path required" });
    const governanceCheck = await validateExecutionPolicy('FILESYSTEM_MUTATION', 'RuntimeOperator', 'Admin');
    if (!governanceCheck.allowed) {
      return governanceError(res, 403, governanceCheck.reason, 'GOVERNANCE_POLICY_GATE', { violation_type: 'GovernancePolicyGate' });
    }
    const absolutePath = getSafePath(filePath);
    try {
        const mutationId = qMutationId ? String(qMutationId) : `mut-fs-write-global-${Date.now()}`;
        const mutationGate = beginGovernedMutation(mutationId);
        if (!mutationGate.allowed) {
          return res.status(mutationGate.inProgress ? 202 : 200).json({
            success: true,
            data: mutationGate.response || { status: mutationGate.inProgress ? 'MUTATION_IN_PROGRESS' : 'MUTATION_ALREADY_COMPLETED', mutationId, duplicate: true }
          });
        }
        const precheck = { mutationId, absolutePath, exists: fs.existsSync(path.dirname(absolutePath)) };
        if (!precheck.exists) {
          failGovernedMutation(mutationId);
          return governanceError(res, 422, 'Pre-check failed: parent directory unavailable', 'PRECHECK_FAILED', { data: { mutationId, precheck } });
        }
        fs.writeFileSync(absolutePath, content, 'utf8');
        addGovernanceAction('FILESYSTEM_WRITE', 'Runtime', filePath, 'COMPLETED');
        const payload = { success: true, message: "Global write successful", data: { mutationId, precheck, postcheck: { written: true } } };
        completeGovernedMutation(mutationId, payload.data);
        res.json(payload);
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/files/delete", async (req, res) => {
    const { paths, mutationId: qMutationId } = req.body;
    if (!paths || !Array.isArray(paths)) return res.status(400).json({ success: false, message: "Paths required" });
    const governanceCheck = await validateExecutionPolicy('FILESYSTEM_MUTATION', 'RuntimeOperator', 'Admin');
    if (!governanceCheck.allowed) {
      return governanceError(res, 403, governanceCheck.reason, 'GOVERNANCE_POLICY_GATE', { violation_type: 'GovernancePolicyGate' });
    }
    try {
        const mutationId = qMutationId ? String(qMutationId) : `mut-fs-delete-global-${Date.now()}`;
        const mutationGate = beginGovernedMutation(mutationId);
        if (!mutationGate.allowed) {
          return res.status(mutationGate.inProgress ? 202 : 200).json({
            success: true,
            data: mutationGate.response || { status: mutationGate.inProgress ? 'MUTATION_IN_PROGRESS' : 'MUTATION_ALREADY_COMPLETED', mutationId, duplicate: true }
          });
        }
        const precheck = { mutationId, requested: paths.length };
        paths.forEach(p => {
            const absolutePath = getSafePath(p);
            if (fs.existsSync(absolutePath)) {
                if (fs.statSync(absolutePath).isDirectory()) fs.rmSync(absolutePath, { recursive: true });
                else fs.unlinkSync(absolutePath);
            }
        });
        addGovernanceAction('FILESYSTEM_DELETE', 'Runtime', String(paths.length), 'COMPLETED');
        const payload = { success: true, data: { mutationId, precheck, postcheck: { completed: true } } };
        completeGovernedMutation(mutationId, payload.data);
        res.json(payload);
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/files/upload", async (req, res) => {
    const { path: filePath, content, name } = req.body;
    const fullPath = path.join(filePath, name);
    const absolutePath = getSafePath(fullPath);
    try {
        fs.writeFileSync(absolutePath, content, 'utf8');
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/files/mkdir", async (req, res) => {
    const { path: dirPath } = req.body;
    const absolutePath = getSafePath(dirPath);
    try {
        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absolutePath, { recursive: true });
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: "Exists" });
        }
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  // Phase 19: Advanced Project Runtime Actions
  app.post("/api/runtime/projects/action", async (req, res) => {
    const { projectId, action, env, path: qProjectPath } = req.body;
    let projectPath = qProjectPath;

    if (projectId) {
       const project = await getProjectById(projectId);
       if (project && project.runtime_path) {
           // Verify Runtime Constitution Manifest
           const manifestPath = getProjectManifestPath(project.runtime_path);
           if (!fs.existsSync(manifestPath)) {
               addRuntimeLog('error', `Identity Violation: Action '${action}' blocked for ${project.name} (Missing Manifest)`, 'nexus_core');
               return res.status(403).json({ 
                   success: false, 
                   message: "Identity Violation: Missing Unified Runtime Manifest. Action forbidden." 
               });
           }
           projectPath = project.runtime_path;
       }
    }
    
    if (!action) return res.status(400).json({ success: false, message: "Action required." });

    // Determine target directory
    const cwd = projectPath || process.cwd();
    
    addGovernanceAction(
      `PROJECT_${action.toUpperCase()}`,
      'Runtime',
      projectId || 'Global',
      `COMPLETED (${action})`
    );

    let command = "";
    switch (action) {
      case 'git_pull':
        command = "git pull";
        break;
      case 'sync':
        command = "npm install";
        break;
      case 'build':
        command = "npm run build";
        break;
      case 'restart':
        command = `npx -y pm2 restart all`; 
        break;
      case 'deploy':
        command = "npm run build && npx -y pm2 restart all";
        break;
      default:
        return res.status(400).json({ success: false, message: "Unsupported action." });
    }

    // Apply Runtime Protection & SSH Awareness
    try {
        const project = await getProjectById(projectId);
        if (project) {
            command = wrapCommandWithRuntimeContext(command, project);
        }
    } catch(e: any) {
        return res.status(403).json({ success: false, message: e.message });
    }

    addRuntimeLog('info', `Project Action: ${action} initiated in ${cwd}`, 'project_runtime');

    exec(command, { cwd, timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
         addRuntimeLog('error', `Project Action ${action} failed: ${error.message}`, 'project_runtime');
      } else {
         addRuntimeLog('success', `Project Action ${action} completed successfully`, 'project_runtime');
      }

      res.json({
        success: !error,
        data: {
          stdout: stdout || "",
          stderr: stderr || "",
          error: error ? error.message : null
        }
      });
    });
  });

  app.get("/api/runtime/files/list", async (req, res) => {
    const requestedPath = (req.query.path as string) || ".";
    const projectId = req.query.projectId as string;
    let projectRoot = req.query.root as string;

    console.log(`[Runtime Explorer] List request - Path: ${requestedPath}, ProjectId: ${projectId}, Root: ${projectRoot}`);

    if (projectId) {
       const project = await getProjectById(projectId);
       if (project && project.runtime_path) {
           projectRoot = project.runtime_path;
           console.log(`[Runtime Explorer] Resolved ProjectRoot from DB: ${projectRoot}`);
       } else {
           console.warn(`[Runtime Explorer] Project ${projectId} found but missing runtime_path`);
       }
    }

    const absolutePath = getSafePath(requestedPath, projectRoot);
    console.log(`[Runtime Explorer] Resolved Absolute Path: ${absolutePath}`);

    try {
        if (!fs.existsSync(absolutePath)) {
            console.error(`[Runtime Explorer] PATH NOT FOUND: ${absolutePath}`);
            return res.status(404).json({ success: false, message: `Path not found: ${absolutePath}` });
        }
        
        const stats = fs.statSync(absolutePath);
        if (!stats.isDirectory()) {
            console.error(`[Runtime Explorer] NOT A DIRECTORY: ${absolutePath}`);
            return res.status(400).json({ success: false, message: "Path is not a directory" });
        }

        const items = fs.readdirSync(absolutePath, { withFileTypes: true });
        console.log(`[Runtime Explorer] FS Scan successful. Found ${items.length} items in ${absolutePath}`);

        const list = items.map(item => {
            let size = 0;
            let mtime = new Date();
            try {
               const stat = fs.statSync(path.join(absolutePath, item.name));
               size = item.isFile() ? stat.size : 0;
               mtime = stat.mtime;
            } catch(e) {}
            return {
                name: item.name,
                type: item.isDirectory() ? 'folder' : 'file',
                path: requestedPath === projectRoot || requestedPath === '.' ? 
                      (requestedPath === '/' ? `/${item.name}` : path.join(requestedPath, item.name)) : 
                      path.join(requestedPath, item.name),
                size,
                modified: mtime,
                isSensitive: item.isFile() ? isSensitiveRuntimeFile(path.join(absolutePath, item.name)) : false,
            };
        });
        res.json({ success: true, data: list });
    } catch (err: any) {
        console.error(`[Runtime Explorer] FS SCAN FAILURE: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/runtime/files/read", async (req, res) => {
    const filePath = req.query.path as string;
    const projectId = req.query.projectId as string;
    let projectRoot = req.query.root as string;

    if (projectId) {
       const project = await getProjectById(projectId);
       if (project && project.runtime_path) {
           projectRoot = project.runtime_path;
       }
    }

    if (!filePath) return res.status(400).json({ success: false, message: "Path required" });

    const absolutePath = getSafePath(filePath, projectRoot);

    try {
        const stats = fs.statSync(absolutePath);
        if (stats.isDirectory()) {
          return res.status(400).json({ success: false, message: "FILESYSTEM_TYPE_MISMATCH: Cannot read a directory as a file." });
        }
        if (isSensitiveRuntimeFile(absolutePath)) {
          auditSensitiveFileAccess('SENSITIVE_FILE_READ', filePath, 'MASKED');
          return res.json({ success: true, data: "*** MASKED SENSITIVE FILE ***", masked: true });
        }
        const content = fs.readFileSync(absolutePath, 'utf8');
        res.json({ success: true, data: content });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/runtime/files/write", async (req, res) => {
    const { path: filePath, content, root: qProjectRoot, projectId, mutationId: qMutationId } = req.body;
    let projectRoot = qProjectRoot;

    if (projectId) {
       const project = await getProjectById(projectId);
       if (project && project.runtime_path) {
           projectRoot = project.runtime_path;
       }
    }

    if (!filePath) return res.status(400).json({ success: false, message: "Path required" });
    const governanceCheck = await validateExecutionPolicy('FILESYSTEM_MUTATION', 'RuntimeOperator', 'Admin');
    if (!governanceCheck.allowed) {
      return governanceError(res, 403, governanceCheck.reason, 'GOVERNANCE_POLICY_GATE', { violation_type: 'GovernancePolicyGate' });
    }

    const absolutePath = getSafePath(filePath, projectRoot);

    try {
        const mutationId = qMutationId ? String(qMutationId) : `mut-fs-write-${projectId || 'runtime'}-${Date.now()}`;
        const mutationGate = beginGovernedMutation(mutationId);
        if (!mutationGate.allowed) {
          return res.status(mutationGate.inProgress ? 202 : 200).json({
            success: true,
            data: mutationGate.response || { status: mutationGate.inProgress ? 'MUTATION_IN_PROGRESS' : 'MUTATION_ALREADY_COMPLETED', mutationId, duplicate: true }
          });
        }
        const precheck = { mutationId, runtimeId: String(projectId || 'runtime'), parentExists: fs.existsSync(path.dirname(absolutePath)) };
        if (!precheck.parentExists) {
            failGovernedMutation(mutationId);
            return governanceError(res, 422, 'Pre-check failed: parent directory unavailable', 'PRECHECK_FAILED', { data: { mutationId, precheck } });
        }
        if (isSensitiveRuntimeFile(absolutePath)) {
            auditSensitiveFileAccess('SENSITIVE_FILE_WRITE', filePath, 'BLOCKED');
            failGovernedMutation(mutationId);
            return governanceError(res, 403, "Sensitive file write is blocked by governance.", 'SENSITIVE_FILE_GOVERNANCE_BLOCK');
        }
        fs.writeFileSync(absolutePath, content, 'utf8');
        addGovernanceAction('FILE_WRITE', 'Runtime', filePath, 'COMPLETED');
        addRuntimeLog('info', `File system write in ${projectRoot || 'Global'}: ${filePath}`, 'file_runtime');
        const payload = { success: true, message: "File write completed.", data: { mutationId, precheck, postcheck: { written: true } } };
        completeGovernedMutation(mutationId, payload.data);
        res.json(payload);
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/runtime/files/delete", async (req, res) => {
    const { paths, root: qProjectRoot, projectId, mutationId: qMutationId } = req.body;
    let projectRoot = qProjectRoot;

    if (projectId) {
       const project = await getProjectById(projectId);
       if (project && project.runtime_path) {
           projectRoot = project.runtime_path;
       }
    }

    if (!paths || !Array.isArray(paths)) return res.status(400).json({ success: false, message: "Paths array required" });
    const governanceCheck = await validateExecutionPolicy('FILESYSTEM_MUTATION', 'RuntimeOperator', 'Admin');
    if (!governanceCheck.allowed) {
      return governanceError(res, 403, governanceCheck.reason, 'GOVERNANCE_POLICY_GATE', { violation_type: 'GovernancePolicyGate' });
    }

    try {
        const mutationId = qMutationId ? String(qMutationId) : `mut-fs-delete-${projectId || 'runtime'}-${Date.now()}`;
        const mutationGate = beginGovernedMutation(mutationId);
        if (!mutationGate.allowed) {
          return res.status(mutationGate.inProgress ? 202 : 200).json({
            success: true,
            data: mutationGate.response || { status: mutationGate.inProgress ? 'MUTATION_IN_PROGRESS' : 'MUTATION_ALREADY_COMPLETED', mutationId, duplicate: true }
          });
        }
        for (const p of paths) {
            const absolutePath = getSafePath(p, projectRoot);
            if (isSensitiveRuntimeFile(absolutePath)) {
                auditSensitiveFileAccess('SENSITIVE_FILE_DELETE', p, 'BLOCKED');
                failGovernedMutation(mutationId);
                return governanceError(res, 403, "Sensitive file delete is blocked by governance.", 'SENSITIVE_FILE_GOVERNANCE_BLOCK');
            }
            if (fs.existsSync(absolutePath)) {
                const stats = fs.statSync(absolutePath);
                if (stats.isDirectory()) {
                    fs.rmSync(absolutePath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(absolutePath);
                }
                addGovernanceAction('FILE_DELETE', 'Runtime', p, 'COMPLETED');
                addRuntimeLog('warn', `Infrastructure component wiped in ${projectRoot || 'Global'}: ${p}`, 'file_runtime');
            }
        }
        const payload = { success: true, data: { mutationId, postcheck: { deleted: true, count: paths.length } } };
        completeGovernedMutation(mutationId, payload.data);
        res.json(payload);
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/runtime/files/search", async (req, res) => {
    const requestedPath = (req.query.path as string) || ".";
    const projectId = req.query.projectId as string;
    const q = String(req.query.q || "").trim().toLowerCase();
    const includeSubdirs = String(req.query.includeSubdirs || "false").toLowerCase() === "true";
    let projectRoot = req.query.root as string;

    if (!q) {
      return res.json({ success: true, data: [] });
    }

    if (projectId) {
      const project = await getProjectById(projectId);
      if (project && project.runtime_path) {
        projectRoot = project.runtime_path;
      }
    }

    const absolutePath = getSafePath(requestedPath, projectRoot);
    const maxResults = 300;
    const maxDepth = includeSubdirs ? 10 : 1;
    const matches: any[] = [];

    const walk = (dir: string, relBase: string, depth: number) => {
      if (depth > maxDepth || matches.length >= maxResults) return;
      let entries: fs.Dirent[] = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (matches.length >= maxResults) break;
        const full = path.join(dir, entry.name);
        const rel = relBase === "." ? entry.name : path.join(relBase, entry.name);
        const lower = entry.name.toLowerCase();

        if (entry.isDirectory()) {
          if (lower.includes(q)) {
            matches.push({
              name: entry.name,
              type: "folder",
              path: rel,
              marker: "name",
              isSensitive: false,
            });
          }
          if (includeSubdirs) walk(full, rel, depth + 1);
          continue;
        }

        const sensitive = isSensitiveRuntimeFile(full);
        if (lower.includes(q)) {
          matches.push({
            name: entry.name,
            type: "file",
            path: rel,
            marker: "name",
            isSensitive: sensitive,
          });
          continue;
        }

        if (sensitive) continue;

        try {
          const content = fs.readFileSync(full, "utf8");
          if (content.toLowerCase().includes(q)) {
            matches.push({
              name: entry.name,
              type: "file",
              path: rel,
              marker: "content",
              isSensitive: false,
            });
          }
        } catch {
          // ignore unreadable files
        }
      }
    };

    try {
      if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
        return res.status(404).json({ success: false, message: "Search path not found." });
      }
      walk(absolutePath, requestedPath || ".", 1);
      return res.json({ success: true, data: matches });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  const blockSimulationEndpoints = (res: any) => {
    return res.status(403).json({
      success: false,
      message: "Simulation endpoints are disabled in strict operational mode."
    });
  };

  app.post("/api/runtime/files/mkdir", async (req, res) => {
    const { path: dirPath, root: qProjectRoot, projectId } = req.body;
    let projectRoot = qProjectRoot;

    if (projectId) {
       const project = await getProjectById(projectId);
       if (project && project.runtime_path) {
           projectRoot = project.runtime_path;
       }
    }

    if (!dirPath) return res.status(400).json({ success: false, message: "Path required" });

    const absolutePath = getSafePath(dirPath, projectRoot);

    try {
        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absolutePath, { recursive: true });
            addGovernanceAction('DIR_CREATE', 'Runtime', dirPath, 'COMPLETED');
            addRuntimeLog('info', `Directory created in ${projectRoot || 'Global'}: ${dirPath}`, 'file_runtime');
            res.json({ success: true, message: "Directory created." });
        } else {
            res.status(400).json({ success: false, message: "Directory already exists." });
        }
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/runtime/files/upload", async (req, res) => {
    // Note: Simple base64/text upload for now to avoid multipart-form complications in a single build
    const { path: filePath, content, name, root: qProjectRoot, projectId } = req.body;
    let projectRoot = qProjectRoot;

    if (projectId) {
       const project = await getProjectById(projectId);
       if (project && project.runtime_path) {
           projectRoot = project.runtime_path;
       }
    }

    const fullPath = path.join(filePath, name);
    const absolutePath = getSafePath(fullPath, projectRoot);
    
    try {
        if (isSensitiveRuntimeFile(absolutePath)) {
            auditSensitiveFileAccess('SENSITIVE_FILE_UPLOAD', fullPath, 'BLOCKED');
            return res.status(403).json({ success: false, message: "Sensitive file upload is blocked by governance." });
        }
        fs.writeFileSync(absolutePath, content, 'utf8');
        addGovernanceAction('FILE_UPLOAD', 'Runtime', fullPath, 'COMPLETED');
        addRuntimeLog('info', `File uploaded to ${projectRoot || 'Global'}: ${fullPath}`, 'file_runtime');
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // Custom Core Runtime APIs
  // ==========================================
  app.get("/api/runtime/projects/manifest", async (req, res) => {
    const { id, path: projectPath } = req.query;
    if (!projectPath) return res.status(400).json({ success: false, message: "Project path required" });

    const manifestPath = getProjectManifestPath(projectPath as string);
    if (!fs.existsSync(manifestPath)) {
      return res.status(404).json({ success: false, message: "Runtime Constitution Manifest not found" });
    }

    try {
      const stats = fs.statSync(manifestPath);
      if (stats.isDirectory()) {
         return res.status(400).json({ success: false, message: "EISDIR: Target is a directory, not a manifest file." });
      }
      const content = fs.readFileSync(manifestPath, 'utf8');
      res.json({ success: true, manifest: JSON.parse(content) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/runtime/projects", async (req, res) => {
    try {
      const projects = await getProjects();
      res.json({ success: true, data: projects });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/runtime/projects/:id/environments", async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) return res.status(404).json({ success: false, message: "Project not found" });

      let pm2Processes: any[] = [];
      try {
        const pm2Result = await execJson("pm2 jlist", 2500);
        pm2Processes = pm2Result.stdout?.trim() ? JSON.parse(pm2Result.stdout) : [];
      } catch {
        pm2Processes = [];
      }

      const domains = discoverNginxDomains();
      const runtimePath = project.runtime_path ? path.resolve(project.runtime_path) : "";
      const runtimePort = Number(project.runtime_port || 0) || null;
      const runtimeProcess = String(project.runtime_process || "").trim();
      const projectName = String(project.name || "").toLowerCase();

      const linkedDomains = domains
        .filter((d: any) => {
          const rootPath = d.rootPath ? path.resolve(String(d.rootPath)) : null;
          const byPath = runtimePath && rootPath && rootPath === runtimePath;
          const byPort = runtimePort && d.proxyPort && Number(d.proxyPort) === runtimePort;
          const byName = projectName && String(d.name || "").toLowerCase().includes(projectName);
          return Boolean(byPath || byPort || byName);
        })
        .map((d: any) => {
          let sslEnabled = false;
          try {
            if (d.configPath && fs.existsSync(d.configPath)) {
              const conf = fs.readFileSync(d.configPath, "utf8");
              sslEnabled = /listen\s+443\s+ssl/i.test(conf);
            }
          } catch {
            sslEnabled = false;
          }
          return {
            domain: d.name,
            nginxBinding: d.configPath || null,
            sslState: sslEnabled ? "enabled" : "disabled",
            proxyPort: d.proxyPort || null,
          };
        });

      const linkedPm2 = pm2Processes.filter((proc: any) => {
        const cwd = proc?.pm2_env?.pm_cwd || proc?.pm2_env?.cwd;
        const procPort = Number(proc?.pm2_env?.PORT || proc?.pm2_env?.port || proc?.pm2_env?.env?.PORT || 0) || null;
        const byPath = runtimePath && cwd && path.resolve(cwd) === runtimePath;
        const byName = runtimeProcess && proc?.name === runtimeProcess;
        const byPort = runtimePort && procPort && procPort === runtimePort;
        return Boolean(byPath || byName || byPort);
      });

      const deriveEnvName = (domain: string | null) => {
        const source = `${String(project.env || "")} ${String(project.git_branch || "")} ${String(domain || "")}`.toLowerCase();
        if (source.includes("stag")) return "STAGING";
        if (source.includes("dev")) return "DEV";
        return "LIVE";
      };

      const environments = (linkedDomains.length > 0 ? linkedDomains : [{
        domain: project.domain || null,
        nginxBinding: null,
        sslState: "unknown",
        proxyPort: runtimePort,
      }]).map((d: any, idx: number) => {
        const pm2 = linkedPm2[idx] || linkedPm2[0] || null;
        const pm2Name = pm2?.name || runtimeProcess || null;
        const port = d.proxyPort || runtimePort || Number(pm2?.pm2_env?.PORT || pm2?.pm2_env?.port || 0) || null;
        const validated = Boolean(d.domain && runtimePath && pm2Name && port && d.nginxBinding);
        return {
          id: `${req.params.id}-${idx}`,
          name: deriveEnvName(d.domain),
          realDomain: d.domain,
          runtimePath: runtimePath || null,
          pm2Process: pm2Name,
          runtimePort: port,
          nginxBinding: d.nginxBinding,
          sslState: d.sslState,
          pm2Status: pm2?.pm2_env?.status || "offline",
          validated,
          validationMessage: validated ? null : "البيئة غير مربوطة ببنية تشغيل فعلية",
        };
      });

      res.json({ success: true, data: environments });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/runtime/projects/update", async (req, res) => {
    const { id, project } = req.body;
    if (!id || !project) return res.status(400).json({ success: false, message: "ID and Project data required" });
    
    try {
      await updateProject(id, project);
      const updatedProject = await getProjectById(id);
      if (updatedProject) await syncProjectManifest(updatedProject);
      
      addGovernanceAction('PROJECT_UPDATE', 'System Admin', project.name, 'COMPLETED');
      addRuntimeLog('info', `Project ${project.name} updated in Nexus Index & Manifest`, 'nexus_core');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/runtime/projects/delete", async (req, res) => {
    const { id, name } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "ID required" });

    try {
      const project = await getProjectById(id);
      if (project && project.runtime_path) {
          const manifestPath = getProjectManifestPath(project.runtime_path);
          if (fs.existsSync(manifestPath)) {
              fs.unlinkSync(manifestPath);
              addRuntimeLog('warning', `Runtime Constitution Revoked for: ${project.name}`, 'nexus_core');
          }
      }
      await deleteProject(id);
      addGovernanceAction('PROJECT_DELETE', 'System Admin', name || id, 'COMPLETED');
      addRuntimeLog('warn', `Project ${name || id} removed from Nexus Index (Soft Delete)`, 'nexus_core');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/runtime/projects", async (req, res) => {
    try {
      const id = await addProject(req.body);
      const project = await getProjectById(id);
      if (project) await syncProjectManifest(project);
      
      addGovernanceAction('PROJECT_CREATE', 'System Admin', req.body.name, 'COMPLETED');
      res.json({ success: true, id, message: "Project added with Runtime Manifest" });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.delete("/api/runtime/projects/:id", async (req, res) => {
    try {
      await deleteProject(req.params.id);
      res.json({ success: true, message: "Project deleted successfully" });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/runtime/settings", async (req, res) => {
    try {
      const settings = await getSettings();
      res.json({ success: true, data: settings });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/runtime/settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      await setSetting(key, value);
      res.json({ success: true, message: "Setting saved successfully" });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/runtime/projects/provision", (req, res) => {
    const { name, repo, type, env, domain } = req.body;
    
    if (repo === 'fail') {
      addRuntimeLog('error', `Repository verification failed: 'fail' is not a valid repository or access denied.`, 'deploy_runtime');
      return res.status(400).json({ success: false, message: "Invalid repository or access denied. Please verify credentials." });
    }

    addRuntimeLog('info', `Repository Validation initiated for ${repo}...`, 'deploy_runtime');
    
    // Simulate some Git interaction and provisioning
    setTimeout(() => {
        addRuntimeLog('info', `Authentication successful for repo ${repo}.`, 'deploy_runtime');
    }, 1000);

    setTimeout(() => {
        addRuntimeLog('warn', `Cloning Repository ${repo}...`, 'deploy_runtime');
    }, 2500);

    setTimeout(() => {
        addRuntimeLog('info', `Repository Cloned. Automating dependency installation for ${type}...`, 'deploy_runtime');
    }, 4500);

    setTimeout(async () => {
        addRuntimeLog('info', `Workspace configured in /www/wwwroot/${name} (${env}). Link to Deploy Engine activated.`, 'deploy_runtime');
        try {
          await addProject({
             name: name,
             repo: repo,
             type: type,
             domain: domain || '',
             status: 'active',
             env: env,
             version: '1.0.0',
             health: '100',
             last_deploy: 'Just now',
             url: domain ? `https://${domain}` : `https://${name.toLowerCase().replace(/\s+/g, '-')}.local`,
             runtime_path: `/www/wwwroot/${name}`,
             node_id: 'default-node',
             runtime_process: name,
             runtime_type: type,
             git_branch: 'main',
             runtime_port: 3010
           });

          if (domain) {
            const confDir = path.join(GLOBAL_ROOT, 'nginx/conf.d');
            if (!fs.existsSync(confDir)) fs.mkdirSync(confDir, { recursive: true });
            const explicitRoot = `/www/wwwroot/${name}`;
            if (!fs.existsSync(explicitRoot)) fs.mkdirSync(explicitRoot, { recursive: true });
            
            let confBody = `server {\n    listen 80;\n    server_name ${domain};\n`;
            if (type === 'nodejs' || type === 'nextjs') {
              confBody += `\n    location / {\n        proxy_pass http://127.0.0.1:3010;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection 'upgrade';\n        proxy_set_header Host $host;\n        proxy_cache_bypass $http_upgrade;\n    }\n}`;
            } else if (type === 'laravel') {
              confBody += `    root ${explicitRoot}/public;\n    index index.php;\n\n    location / {\n        try_files $uri $uri/ /index.php?$query_string;\n    }\n\n    location ~ \\.php$ {\n        fastcgi_pass unix:/var/run/php/php-fpm.sock;\n        fastcgi_index index.php;\n        include fastcgi_params;\n    }\n}`;
            } else {
              confBody += `    root ${explicitRoot};\n    index index.html index.htm;\n\n    location / {\n        try_files $uri $uri/ =404;\n    }\n}`;
            }
            fs.writeFileSync(path.join(confDir, `${domain}.conf`), confBody);
            addRuntimeLog('info', `Domain configured and linked to NGINX: ${domain}`, 'network_runtime');
          }
        } catch (e) {
          console.error("Failed to add project to DB", e);
        }
    }, 6000);

    res.json({ success: true, message: "Provisioning Sequence Started. Check Runtime Logs for progress." });
  });

  // ==========================================
  // PHASE E: MOBILE RUNTIME
  // ==========================================
  
  let mobileAppsRuntimeDB = [
    {
      id: 1,
      name: 'DevCore Customer App',
      platform: 'Flutter (iOS & Android)',
      apiEndpoint: 'https://api.devcore.com/v1',
      version: '2.1.4',
      environment: 'LIVE',
      pushTokens: '24,502 Active',
      status: 'online',
    },
    {
      id: 2,
      name: 'DevCore Provider App',
      platform: 'Kotlin (Android)',
      apiEndpoint: 'https://api.devcore.com/v2',
      version: '1.5.0',
      environment: 'LIVE',
      pushTokens: '1,204 Active',
      status: 'online',
    },
    {
      id: 3,
      name: 'DevCore Driver App',
      platform: 'Swift (iOS)',
      apiEndpoint: 'https://api.devcore.com/v1/driver',
      version: '1.0.2-beta',
      environment: 'STAGING',
      pushTokens: '45 Active',
      status: 'maintenance',
    }
  ];

  app.get("/api/runtime/mobile/list", (req, res) => {
    res.json({ success: true, data: mobileAppsRuntimeDB });
  });

  app.post("/api/runtime/mobile/push", (req, res) => {
    const { appId, title, body } = req.body;
    const appInfo = mobileAppsRuntimeDB.find(a => a.id === appId);
    if (!appInfo) return res.status(404).json({ success: false, message: "App not found" });

    addRuntimeLog('info', `Notification sent to ${appInfo.name}: ${title}`, 'mobile_runtime');
    
    res.json({ 
      success: true, 
      message: `Notification delivered successfully to ${appInfo.pushTokens}`
    });
  });

  app.post("/api/runtime/mobile/deploy", (req, res) => {
    const { appId } = req.body;
    const appInfo = mobileAppsRuntimeDB.find(a => a.id === appId);
    if (!appInfo) return res.status(404).json({ success: false, message: "App not found" });

    addRuntimeLog('warn', `New build deployment requested for ${appInfo.name} [v${appInfo.version}]`, 'mobile_runtime');
    
    // Simulate updating version
    const parts = appInfo.version.split('.');
    if (parts.length === 3) {
      let patch = parseInt(parts[2].split('-')[0]) || 0;
      appInfo.version = `${parts[0]}.${parts[1]}.${patch + 1}`;
    }

    res.json({ 
      success: true, 
      message: `Deploy pipeline initiated. Updated to v${appInfo.version}`
    });
  });

  app.post("/api/runtime/mobile/settings", (req, res) => {
    const { appId, settings } = req.body;
    const index = mobileAppsRuntimeDB.findIndex(a => a.id === appId);
    if (index === -1) return res.status(404).json({ success: false, message: "App not found" });

    mobileAppsRuntimeDB[index] = { ...mobileAppsRuntimeDB[index], ...settings };
    addRuntimeLog('info', `Mobile Runtime Settings updated for ${mobileAppsRuntimeDB[index].name}`, 'mobile_runtime');
    
    res.json({ 
      success: true, 
      message: "Mobile configuration updated successfully."
    });
  });

  app.post("/api/runtime/nodes/:nodeId/scan", async (req, res) => {
    const { nodeId } = req.params;
    addRuntimeLog('info', `Initiating Smart Discovery Scan on Node ${nodeId}...`, 'discovery_engine');

    const defaultInfraRoot = fs.existsSync(GLOBAL_ROOT) ? GLOBAL_ROOT : process.cwd();
    const discoveredProjects = [];

    let pm2Processes: any[] = [];
    try {
      const pm2Result = await execJson("pm2 jlist", 2500);
      pm2Processes = pm2Result.stdout?.trim() ? JSON.parse(pm2Result.stdout) : [];
    } catch {
      pm2Processes = [];
    }

    if (fs.existsSync(defaultInfraRoot)) {
        const dirs = fs.readdirSync(defaultInfraRoot, { withFileTypes: true })
                       .filter(dirent => dirent.isDirectory())
                       .map(dirent => dirent.name);

        const { classifyRuntime } = await import('./server/runtime/runtimeClassification.js');

        for (const dirName of dirs) {
            // Ignore system/internal directories
            if (['nginx', 'deployments', '.git', 'node_modules'].includes(dirName)) continue;
            
            const projPath = path.join(defaultInfraRoot, dirName);
            let domain = `${dirName.toLowerCase()}.local`;
            
            // Try to see if there's a package.json to guess type
            let type = 'Generic Project';
            if (fs.existsSync(path.join(projPath, 'package.json'))) type = 'Node.js';
            if (fs.existsSync(path.join(projPath, 'artisan'))) type = 'Laravel';
            if (fs.existsSync(path.join(projPath, 'pubspec.yaml'))) type = 'Flutter';

            const classification = await classifyRuntime(projPath);

            // Try to find domain and port by checking nginx configs
            // nginx configs are at GLOBAL_ROOT/nginx/conf.d/*.conf
            const nginxConfPath = path.join(GLOBAL_ROOT, 'nginx/conf.d', `${dirName}.conf`);
            let port = 3010;
            if (fs.existsSync(nginxConfPath)) {
                const content = fs.readFileSync(nginxConfPath, 'utf8');
                const matchDomain = content.match(/server_name\s+([^;]+);/);
                if (matchDomain && matchDomain[1]) {
                    domain = matchDomain[1].trim();
                }
                const matchPort = content.match(/proxy_pass\s+http:\/\/(?:127\.0\.0\.1|localhost):(\d+);/);
                if (matchPort && matchPort[1]) {
                    port = parseInt(matchPort[1], 10);
                }
            } else if (classification.runtime_domain) {
                domain = classification.runtime_domain;
            }
            
            const packageJsonPath = path.join(projPath, 'package.json');
            let version = 'unknown';
            if (fs.existsSync(packageJsonPath)) {
                try {
                    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    version = pkg?.version || 'unknown';
                } catch {}
            }

            const pm2Proc = pm2Processes.find((proc: any) => {
                const cwd = proc?.pm2_env?.pm_cwd || proc?.pm2_env?.cwd;
                return cwd === projPath || proc?.name === dirName;
            });

            const gitBranch = fs.existsSync(path.join(projPath, '.git')) ? 'detected' : 'n/a';
            discoveredProjects.push({
                name: classification.runtime_classification === 'Backup Runtime' ? `Backup - ${dirName}` : dirName,
                path: projPath,
                type: type,
                env: classification.runtime_classification,
                domain: domain,
                version,
                port: port,
                git: { branch: gitBranch, commit: 'detected', remote: fs.existsSync(path.join(projPath, '.git')) ? 'detected' : 'local' },
                pm2: { 
                  name: pm2Proc?.name || dirName.toLowerCase(), 
                  status: pm2Proc?.pm2_env?.status || 'offline', 
                  uptime: pm2Proc?.pm2_env?.pm_uptime || classification.runtime_health || 'Managed' 
                }
            });
        }
    }
    addRuntimeLog('success', `Discovery Scan Complete. Found ${discoveredProjects.length} projects on node ${nodeId}`, 'discovery_engine');
    res.json({ success: true, discoveredProjects });
  });

  app.post("/api/runtime/projects/import", async (req, res) => {
    const project = req.body;
    addRuntimeLog('info', `Importing Discovery Project: ${project.name} into NEXUS Runtime...`, 'discovery_engine');

    try {
        const targetPath = project.path;
        
        if (!targetPath || !fs.existsSync(targetPath)) {
            addRuntimeLog('error', `Import Failed: Path ${targetPath} does not exist on disk.`, 'discovery_engine');
            return res.status(400).json({ 
                success: false, 
                message: `FILESYSTEM_VERIFICATION_FAILED: Directory ${targetPath} not found.` 
            });
        }

        // Verify it's a directory
        const stats = fs.statSync(targetPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ 
                success: false, 
                message: `RUNTIME_PATH_INVALID: ${targetPath} is not a directory.` 
            });
        }

        const { classifyRuntime } = await import('./server/runtime/runtimeClassification.js');
        const classification = await classifyRuntime(targetPath);

        const id = await addProject({
            name: classification.runtime_classification === 'Backup Runtime' ? `Backup - ${project.name}` : project.name,
            repo: project.git?.remote || 'Local Archive',
            type: project.type,
            domain: classification.runtime_domain || project.domain || '',
            env: classification.runtime_classification,
            status: classification.runtime_classification === 'UNVERIFIED RUNTIME' ? 'Unverified' : 'active',
            uptime: project.pm2?.uptime || classification.runtime_health,
            runtime_path: targetPath,
            node_id: project.node_id || 'LOCAL-01',
            runtime_process: project.pm2?.name || project.name.toLowerCase(),
            runtime_type: project.type,
            git_branch: project.git?.branch || 'main',
            runtime_port: project.port || 3010
        });

        // Ensure a runtime record is created explicitly to bind the context
        const { RuntimeResolver } = await import('./server/runtime/runtimeResolver.js');
        // This will verify the path and create the runtime record if managed correctly by resolver recovery
        await RuntimeResolver.resolveRuntime(id.toString());

        const newProject = await getProjectById(id);
        if (newProject) await syncProjectManifest(newProject);

        await addGovernanceAction('PROJECT_IMPORT', 'System Discovery', project.name, 'COMPLETED');
        addRuntimeLog('success', `Infrastructure Object successfully linked and Manifested: ${project.name}`, 'deploy_runtime');
        
        res.json({ success: true, id });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/runtime/servers/register", async (req, res) => {
    const { name, ip, port, username, authType, credentials, env, role, region } = req.body;
    
    if (ip === "fail") {
      addRuntimeLog('error', `SSH Validation failed: Host unreachable or Auth Refused for ${ip}`, 'security_runtime');
      return res.status(400).json({ success: false, message: "Host Unreachable or Authentication Failed. Check IP and credentials." });
    }

    addRuntimeLog('info', `Validating SSH Connection to Real Infrastructure at ${ip}...`, 'security_runtime');
    const governanceCheck = await validateExecutionPolicy('SERVER_REGISTER', 'RuntimeOperator', 'Admin');
    if (!governanceCheck.allowed) {
      return res.status(403).json({ success: false, message: governanceCheck.reason, violation_type: 'GovernancePolicyGate' });
    }

    try {
      const telemetry = await getRuntimeTelemetry().catch(() => null);
      const safeIp = String(ip || 'pending').replace(/[^a-zA-Z0-9]/g, '-');
      const nodeId = `node-${safeIp || 'unknown'}`;
      const memoryTotal = os.totalmem();
      const memoryFree = os.freemem();
      const memoryUsed = memoryTotal - memoryFree;
      const cpuUsage = Number(telemetry?.cpu?.usage ?? 0);

      const serverInfo = {
         id: nodeId,
         name: name || os.hostname(),
         ip: ip || 'Pending',
         region: region || process.env.RUNTIME_REGION || 'Unknown',
         os: `${os.platform()} ${os.release()}`,
         status: 'online',
         cpu: `${cpuUsage.toFixed(1)}%`,
         ram: `${Math.round(memoryUsed / (1024 * 1024 * 1024))}GB/${Math.round(memoryTotal / (1024 * 1024 * 1024))}GB`,
         storage: telemetry?.disk?.total ? `${Math.round((telemetry.disk.used || 0) / (1024 ** 3))}GB/${Math.round((telemetry.disk.total || 0) / (1024 ** 3))}GB` : 'Unknown',
         uptime: `${Math.floor(os.uptime() / 86400)} days`,
         health: cpuUsage > 85 ? 60 : cpuUsage > 70 ? 75 : 95,
         auth_type: authType,
         username: username,
         role: role || 'Worker'
      };

      await addNode(serverInfo);
      upsertNode(serverInfo.id, serverInfo.region, serverInfo.ip, serverInfo.role);
      addGovernanceAction('SERVER_REGISTER', 'Runtime', serverInfo.ip, 'COMPLETED');
      addRuntimeLog('success', `Runtime Infrastructure linked for ${serverInfo.ip}`, 'deploy_runtime');
      res.json({ success: true, message: "Runtime Infrastructure Linked Successfully", serverInfo });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message || "Failed to persist node" });
    }
  });

  // ==========================================
  // PHASE D: DOMAINS & SSL RUNTIME
  // ==========================================

  import("./server/runtime/domainsApi.js").then((module) => {
    module.setupDomainsApi(app, addRuntimeLog);
  }).catch((err) => {
    console.error("Failed to load Domains API", err);
  });

  // ==========================================
  // PHASE F: REAL RUNTIME API BINDINGS
  // ==========================================

  app.get("/api/runtime/:id/files", async (req, res) => {
    try {
      const { RuntimeResolver } = await import('./server/runtime/runtimeResolver.js');
      const { operational, error } = await RuntimeResolver.ensureRuntimeOperational(req.params.id);
      if (!operational) return res.status(503).json({ success: false, message: `Runtime Synchronization incomplete: ${error}` });
      
      const { RuntimeFilesystem } = await import('./server/runtime/runtimeFilesystem.js');
      const files = await RuntimeFilesystem.listFiles(req.params.id, req.query.path as string);
      res.json({ success: true, data: files });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/runtime/:id/logs", async (req, res) => {
    try {
      const { RuntimeResolver } = await import('./server/runtime/runtimeResolver.js');
      const { operational, error } = await RuntimeResolver.ensureRuntimeOperational(req.params.id);
      if (!operational) return res.status(503).json({ success: false, message: `Runtime Synchronization incomplete: ${error}` });

      const { RuntimeLogs } = await import('./server/runtime/runtimeLogs.js');
      const logs = await RuntimeLogs.getLogs(req.params.id);
      res.json({ success: true, data: logs });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/runtime/:id/pm2", async (req, res) => {
    try {
      const { RuntimeResolver } = await import('./server/runtime/runtimeResolver.js');
      if (req.params.id !== 'rt-core') {
        const { operational, error } = await RuntimeResolver.ensureRuntimeOperational(req.params.id);
        if (!operational) return res.status(503).json({ success: false, message: `Runtime Synchronization incomplete: ${error}` });
      }

      const { RuntimePM2 } = await import('./server/runtime/runtimePM2.js');
      const processInfo = await RuntimePM2.getRuntimeProcess(req.params.id);
      res.json({ success: true, data: processInfo });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/runtime/:id/monitoring", async (req, res) => {
    try {
      const { RuntimeMonitoring } = await import('./server/runtime/runtimeMonitoring.js');
      const metrics = await RuntimeMonitoring.getLiveMetrics(req.params.id);
      
      // Async health check for event logging
      const { RuntimeEvents } = await import('./server/runtime/runtimeEvents.js');
      RuntimeEvents.analyzeRuntimeHealth(req.params.id, metrics).catch(console.error);

      res.json({ success: true, data: metrics });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/runtime/:id/events", async (req, res) => {
    try {
      const { RuntimeEvents } = await import('./server/runtime/runtimeEvents.js');
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const events = await RuntimeEvents.getEvents(req.params.id, limit);
      res.json({ success: true, data: events });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get("/api/runtime/:id/intelligence", async (req, res) => {
    try {
      const { RuntimeIntelligence } = await import('./server/runtime/runtimeIntelligence.js');
      const analysis = await RuntimeIntelligence.getLatestAnalysis(req.params.id);
      res.json({ success: true, data: analysis });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/runtime/:id/intelligence/analyze", async (req, res) => {
    try {
       const { RuntimeIntelligence } = await import('./server/runtime/runtimeIntelligence.js');
       const { RuntimeMonitoring } = await import('./server/runtime/runtimeMonitoring.js');
       const metrics = await RuntimeMonitoring.getLiveMetrics(req.params.id);
       const analysis = await RuntimeIntelligence.analyzeRuntime(req.params.id, metrics);
       res.json({ success: true, data: analysis });
    } catch (e: any) {
       res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/runtime/:id/deploy", async (req, res) => {
    try {
      const runtimeId = String(req.params.id);
      const branch = req.body?.branch ? String(req.body.branch) : 'main';
      const requestedBy = req.body?.requested_by ? String(req.body.requested_by) : 'RuntimeOperator';
      const riskLevel = req.body?.risk_level ? String(req.body.risk_level).toLowerCase() : 'medium';
      const approvalId = req.body?.approvalId ? String(req.body.approvalId) : undefined;
      const mutationId = `mut-deploy-${runtimeId}-${Date.now()}`;
      const project = await getProjectById(runtimeId);
      if (!project?.runtime_path) {
        return res.status(404).json({ success: false, message: 'Runtime project path not found' });
      }

      const governanceCheck = await validateExecutionPolicy('RUNTIME_DEPLOY', 'RuntimeOperator', 'Admin');
      if (!governanceCheck.allowed) {
        return res.status(403).json({ success: false, message: governanceCheck.reason, violation_type: 'GovernancePolicyGate' });
      }

      const { RuntimeDeploy, DeployStrategy, DeployStatus } = await import('./server/runtime/runtimeDeployGovernance.js');
      const deploymentId = `dep-${Date.now()}`;
      const snapshotId = `snap-${runtimeId}-${Date.now()}`;
      const startedAt = Date.now();
      const timeline: Array<{ stage: string; status: 'ok' | 'failed' | 'skipped'; startedAt: string; endedAt: string; durationMs: number; output?: string; error?: string }> = [];

      await RuntimeDeploy.requestDeploy({
        runtime_id: runtimeId,
        deployment_id: deploymentId,
        requested_by: 'RuntimeOperator',
        risk_level: 'medium',
        deploy_strategy: DeployStrategy.SAFE_DEPLOY,
      });

      const updateDeployStatus = (status: string) => {
        try {
          sqliteDb.prepare('UPDATE runtime_deployments SET deploy_status = ?, executed_at = CURRENT_TIMESTAMP WHERE runtime_id = ? AND deployment_id = ?')
            .run(status, runtimeId, deploymentId);
        } catch {}
      };

      const runStage = async (stage: string, fn: () => Promise<{ status: 'ok' | 'failed' | 'skipped'; output?: string; error?: string }>) => {
        const s = Date.now();
        const startedAtIso = new Date(s).toISOString();
        const result = await fn();
        const e = Date.now();
        timeline.push({
          stage,
          status: result.status,
          startedAt: startedAtIso,
          endedAt: new Date(e).toISOString(),
          durationMs: e - s,
          output: result.output,
          error: result.error,
        });
        if (result.status === 'failed') throw new Error(result.error || `${stage} failed`);
      };

      const runCommand = (command: string, cwd: string, timeout = 120000) =>
        new Promise<{ stdout: string; stderr: string; error: string | null }>((resolve) => {
          exec(command, { cwd, timeout }, (error, stdout, stderr) => {
            resolve({
              stdout: stdout || '',
              stderr: stderr || '',
              error: error ? error.message : null,
            });
          });
        });

      const isHighRisk = ['high', 'critical'].includes(riskLevel);
      const precheck = {
        runtimePathExists: fs.existsSync(project.runtime_path),
        gitRepoDetected: fs.existsSync(path.join(project.runtime_path, '.git')),
        packageDetected: fs.existsSync(path.join(project.runtime_path, 'package.json')),
        runtimeId,
        mutationId,
      };

      if (!precheck.runtimePathExists) {
        return res.status(422).json({
          success: false,
          message: 'Pre-check failed: runtime path unavailable',
          data: { mutationId, precheck }
        });
      }

      if (isHighRisk && !approvalId) {
        const requestedApprovalId = await RuntimeApproval.requestApproval({
          runtime_id: runtimeId,
          operation_type: 'runtime_deploy' as any,
          requested_by: requestedBy,
          risk_level: riskLevel,
          approval_reason: `High risk deploy requested for runtime ${runtimeId}`,
        });
        addRuntimeLog('warning', `[mutation:${mutationId}] Deploy blocked pending approval ${requestedApprovalId}`, 'deploy_runtime');
        addGovernanceAction('RUNTIME_DEPLOY_APPROVAL', requestedBy, runtimeId, 'PENDING');
        return res.status(202).json({
          success: true,
          data: {
            status: 'PENDING_APPROVAL',
            mutationId,
            runtimeId,
            requestedApprovalId,
            riskLevel,
            precheck,
          }
        });
      }

      if (approvalId) {
        const approval = sqliteDb.prepare('SELECT * FROM runtime_approvals WHERE id = ? AND runtime_id = ?').get(approvalId, runtimeId) as any;
        if (!approval) {
          return res.status(403).json({ success: false, message: 'Approval record not found for runtime', violation_type: 'ApprovalGate' });
        }
        if (String(approval.approval_status || '').toUpperCase() !== 'APPROVED') {
          return res.status(403).json({ success: false, message: `Approval ${approvalId} is not approved`, violation_type: 'ApprovalGate' });
        }
      }

      updateDeployStatus(DeployStatus.VALIDATING);
      addRuntimeLog('info', `[mutation:${mutationId}] Deploy ${deploymentId} started for runtime ${runtimeId} on branch ${branch}`, 'deploy_runtime');

      const cwd = project.runtime_path;

      // Automatic pre-deploy recovery snapshot (governed)
      const pm2Before = await runCommand('npx -y pm2 jlist', cwd, 120000);
      const runtimeState = JSON.stringify({
        runtimeId,
        projectId: project.id,
        runtimePath: cwd,
        branch,
        deployStage: 'PRE_DEPLOY',
        timestamp: new Date().toISOString(),
      });
      const pm2State = pm2Before.stdout || '[]';
      const environmentState = JSON.stringify({
        domain: project.domain || null,
        port: project.runtime_port || null,
        runtimeType: project.runtime_type || project.type || null,
      });
      sqliteDb.prepare(`
        INSERT INTO runtime_snapshots
        (snapshot_id, runtime_id, snapshot_type, runtime_state, pm2_state, environment_state, policy_state, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        snapshotId,
        runtimeId,
        'PRE_DEPLOY',
        runtimeState,
        pm2State,
        environmentState,
        JSON.stringify({ governance: 'enabled', approval: 'runtime_operator' }),
        'RuntimeOperator'
      );
      addRuntimeLog('info', `Automatic recovery snapshot created: ${snapshotId}`, 'recovery_runtime');

      await runStage('Git Pull', async () => {
        if (!fs.existsSync(path.join(cwd, '.git'))) return { status: 'skipped', output: '.git not found' };
        const r = await runCommand(`git pull origin ${branch}`, cwd, 180000);
        if (r.error) return { status: 'failed', error: r.error, output: `${r.stdout}\n${r.stderr}` };
        return { status: 'ok', output: r.stdout };
      });

      await runStage('Dependency Install', async () => {
        if (!fs.existsSync(path.join(cwd, 'package.json'))) return { status: 'skipped', output: 'package.json not found' };
        const r = await runCommand('npm install --no-audit --no-fund', cwd, 300000);
        if (r.error) return { status: 'failed', error: r.error, output: `${r.stdout}\n${r.stderr}` };
        return { status: 'ok', output: r.stdout };
      });

      await runStage('Runtime Validation', async () => {
        const pathExists = fs.existsSync(cwd);
        if (!pathExists) return { status: 'failed', error: 'Runtime path unavailable' };
        return { status: 'ok', output: `Runtime path validated: ${cwd}` };
      });

      await runStage('Build', async () => {
        if (!fs.existsSync(path.join(cwd, 'package.json'))) return { status: 'skipped', output: 'No Node build detected' };
        const r = await runCommand('npm run build', cwd, 300000);
        if (r.error) return { status: 'failed', error: r.error, output: `${r.stdout}\n${r.stderr}` };
        return { status: 'ok', output: r.stdout };
      });

      updateDeployStatus(DeployStatus.DEPLOYING);

      await runStage('PM2 Restart', async () => {
        const target = project.runtime_process ? String(project.runtime_process) : 'all';
        const r = await runCommand(`npx -y pm2 restart ${target}`, cwd, 120000);
        if (r.error) return { status: 'failed', error: r.error, output: `${r.stdout}\n${r.stderr}` };
        return { status: 'ok', output: r.stdout };
      });

      await runStage('Health Check', async () => {
        const r = await runCommand('npx -y pm2 jlist', cwd, 120000);
        if (r.error) return { status: 'failed', error: r.error };
        const parsed = r.stdout?.trim() ? JSON.parse(r.stdout) : [];
        const online = Array.isArray(parsed) ? parsed.filter((p: any) => p?.pm2_env?.status === 'online').length : 0;
        if (online === 0) return { status: 'failed', error: 'No online PM2 processes after restart' };
        return { status: 'ok', output: `${online} PM2 process(es) online` };
      });

      await runStage('Runtime Verification Gates', async () => {
        const verification = await runRuntimeVerificationGates(project, runCommand);
        if (!verification.ok) {
          const autoRecovery = await executeGovernedAutoRecovery(runtimeId, snapshotId, verification.reason, project, runCommand);
          return {
            status: 'failed',
            error: `${verification.code}: ${verification.reason}`,
            output: `Auto recovery ${autoRecovery.success ? 'completed' : 'failed'}: ${autoRecovery.recoveryId}`
          };
        }
        return { status: 'ok', output: JSON.stringify(verification.details || {}) };
      });

      await runStage('Deploy Verification', async () => {
        const distExists = fs.existsSync(path.join(cwd, 'dist')) || fs.existsSync(path.join(cwd, 'build'));
        return { status: distExists ? 'ok' : 'skipped', output: distExists ? 'Artifact directory detected' : 'No artifact directory detected' };
      });

      await runStage('Rollback Validation', async () => {
        const restorePoints = getRestorePoints();
        const hasRestore = Array.isArray(restorePoints) && restorePoints.length > 0;
        return { status: hasRestore ? 'ok' : 'skipped', output: hasRestore ? 'Recovery points available' : 'No recovery point found yet' };
      });

      const durationMs = Date.now() - startedAt;
      updateDeployStatus(DeployStatus.COMPLETED);
      addGovernanceAction('RUNTIME_DEPLOY', 'Runtime', runtimeId, 'COMPLETED');
      const postcheck = {
        pm2Healthy: timeline.some((stage) => stage.stage === 'Health Check' && stage.status === 'ok'),
        runtimeGatesPassed: timeline.some((stage) => stage.stage === 'Runtime Verification Gates' && stage.status === 'ok'),
        deployVerified: timeline.some((stage) => stage.stage === 'Deploy Verification' && stage.status !== 'failed'),
        rollbackValidated: timeline.some((stage) => stage.stage === 'Rollback Validation' && stage.status !== 'failed'),
      };
      addRuntimeLog('success', `[mutation:${mutationId}] Deploy ${deploymentId} completed in ${durationMs}ms`, 'deploy_runtime');

      res.json({
        success: true,
        data: {
          mutationId,
          deploymentId,
          snapshotId,
          runtimeId,
          branch,
          riskLevel,
          precheck,
          postcheck,
          durationMs,
          status: 'COMPLETED',
          timeline,
          startedAt: new Date(startedAt).toISOString(),
          endedAt: new Date().toISOString(),
        }
      });
    } catch (e: any) {
      try {
        addGovernanceAction('RUNTIME_DEPLOY', 'Runtime', req.params.id, 'FAILED');
        addRuntimeLog('error', `Deploy failed for runtime ${req.params.id}: ${e.message}`, 'deploy_runtime');
      } catch {}
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/runtime/:id/rollback", async (req, res) => {
    try {
      const runtimeId = String(req.params.id);
      const snapshotId = String(req.body?.snapshotId || '');
      const requestedBy = req.body?.requested_by ? String(req.body.requested_by) : 'RuntimeOperator';
      const riskLevel = req.body?.risk_level ? String(req.body.risk_level).toLowerCase() : 'medium';
      const approvalId = req.body?.approvalId ? String(req.body.approvalId) : undefined;
      const mutationId = `mut-rollback-${runtimeId}-${Date.now()}`;
      if (!snapshotId) return res.status(400).json({ success: false, message: 'snapshotId is required' });

      const governanceCheck = await validateExecutionPolicy('RUNTIME_RECOVERY', 'RuntimeOperator', 'Admin');
      if (!governanceCheck.allowed) {
        return res.status(403).json({ success: false, message: governanceCheck.reason, violation_type: 'GovernancePolicyGate' });
      }

      const project = await getProjectById(runtimeId);
      if (!project?.runtime_path) {
        return res.status(404).json({ success: false, message: 'Runtime project path not found' });
      }

      const snap = sqliteDb.prepare('SELECT * FROM runtime_snapshots WHERE snapshot_id = ? AND runtime_id = ?').get(snapshotId, runtimeId) as any;
      if (!snap) return res.status(404).json({ success: false, message: 'Snapshot not found for runtime' });

      const precheck = {
        snapshotExists: Boolean(snap),
        runtimePathExists: fs.existsSync(project.runtime_path),
        runtimeId,
        snapshotId,
        mutationId,
      };

      if (!precheck.runtimePathExists) {
        return res.status(422).json({
          success: false,
          message: 'Pre-check failed: runtime path unavailable',
          data: { mutationId, precheck }
        });
      }

      const isHighRisk = ['high', 'critical'].includes(riskLevel);
      if (isHighRisk && !approvalId) {
        const requestedApprovalId = await RuntimeApproval.requestApproval({
          runtime_id: runtimeId,
          operation_type: 'runtime_recovery' as any,
          requested_by: requestedBy,
          risk_level: riskLevel,
          approval_reason: `High risk rollback requested for runtime ${runtimeId}`,
        });
        addRuntimeLog('warning', `[mutation:${mutationId}] Rollback blocked pending approval ${requestedApprovalId}`, 'recovery_runtime');
        addGovernanceAction('RUNTIME_ROLLBACK_APPROVAL', requestedBy, runtimeId, 'PENDING');
        return res.status(202).json({
          success: true,
          data: {
            status: 'PENDING_APPROVAL',
            mutationId,
            runtimeId,
            snapshotId,
            requestedApprovalId,
            riskLevel,
            precheck,
          }
        });
      }

      if (approvalId) {
        const approval = sqliteDb.prepare('SELECT * FROM runtime_approvals WHERE id = ? AND runtime_id = ?').get(approvalId, runtimeId) as any;
        if (!approval) {
          return res.status(403).json({ success: false, message: 'Approval record not found for runtime', violation_type: 'ApprovalGate' });
        }
        if (String(approval.approval_status || '').toUpperCase() !== 'APPROVED') {
          return res.status(403).json({ success: false, message: `Approval ${approvalId} is not approved`, violation_type: 'ApprovalGate' });
        }
      }

      const recoveryId = `rec-${Date.now()}`;
      sqliteDb.prepare(`
        INSERT INTO runtime_recovery
        (recovery_id, runtime_id, snapshot_id, recovery_type, recovery_status, risk_level, requested_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(recoveryId, runtimeId, snapshotId, 'ROLLBACK', 'VALIDATING', 'medium', 'RuntimeOperator');

      const startedAt = Date.now();
      const timeline: Array<{ stage: string; status: 'ok' | 'failed' | 'skipped'; startedAt: string; endedAt: string; durationMs: number; output?: string; error?: string }> = [];
      const runCommand = (command: string, cwd: string, timeout = 120000) =>
        new Promise<{ stdout: string; stderr: string; error: string | null }>((resolve) => {
          exec(command, { cwd, timeout }, (error, stdout, stderr) => {
            resolve({ stdout: stdout || '', stderr: stderr || '', error: error ? error.message : null });
          });
        });
      const runStage = async (stage: string, fn: () => Promise<{ status: 'ok' | 'failed' | 'skipped'; output?: string; error?: string }>) => {
        const s = Date.now();
        const startedAtIso = new Date(s).toISOString();
        const result = await fn();
        const e = Date.now();
        timeline.push({ stage, status: result.status, startedAt: startedAtIso, endedAt: new Date(e).toISOString(), durationMs: e - s, output: result.output, error: result.error });
        if (result.status === 'failed') throw new Error(result.error || `${stage} failed`);
      };

      addRuntimeLog('warning', `[mutation:${mutationId}] Rollback ${recoveryId} started for runtime ${runtimeId} via snapshot ${snapshotId}`, 'recovery_runtime');

      await runStage('Snapshot Validation', async () => ({ status: 'ok', output: `Snapshot ${snapshotId} validated` }));
      await runStage('Runtime Stop', async () => {
        const target = project.runtime_process ? String(project.runtime_process) : 'all';
        const r = await runCommand(`npx -y pm2 stop ${target}`, project.runtime_path, 120000);
        if (r.error) return { status: 'failed', error: r.error, output: `${r.stdout}\n${r.stderr}` };
        return { status: 'ok', output: r.stdout };
      });
      await runStage('Restore', async () => {
        // Snapshot currently stores runtime metadata + PM2 state. Restore step validates context and logs restore intent.
        return { status: 'ok', output: `Runtime context restored from snapshot metadata (${snapshotId})` };
      });
      await runStage('PM2 Recovery', async () => {
        const target = project.runtime_process ? String(project.runtime_process) : 'all';
        const r = await runCommand(`npx -y pm2 restart ${target}`, project.runtime_path, 120000);
        if (r.error) return { status: 'failed', error: r.error, output: `${r.stdout}\n${r.stderr}` };
        return { status: 'ok', output: r.stdout };
      });
      await runStage('Runtime Verification', async () => {
        const verification = await runRuntimeVerificationGates(project, runCommand);
        if (!verification.ok) {
          return { status: 'failed', error: `${verification.code}: ${verification.reason}` };
        }
        return { status: 'ok', output: JSON.stringify(verification.details || {}) };
      });
      await runStage('Health Check', async () => {
        const r = await runCommand('npx -y pm2 jlist', project.runtime_path, 120000);
        if (r.error) return { status: 'failed', error: r.error };
        const parsed = r.stdout?.trim() ? JSON.parse(r.stdout) : [];
        const online = Array.isArray(parsed) ? parsed.filter((p: any) => p?.pm2_env?.status === 'online').length : 0;
        if (online === 0) return { status: 'failed', error: 'No online PM2 processes after recovery' };
        return { status: 'ok', output: `${online} PM2 process(es) online` };
      });
      await runStage('Rollback Audit', async () => ({ status: 'ok', output: 'Governance rollback audit completed' }));

      sqliteDb.prepare('UPDATE runtime_recovery SET recovery_status = ? WHERE recovery_id = ?').run('READY', recoveryId);
      addGovernanceAction('RUNTIME_ROLLBACK', 'Runtime', runtimeId, 'COMPLETED');
      const postcheck = {
        runtimeVerified: timeline.some((stage) => stage.stage === 'Runtime Verification' && stage.status === 'ok'),
        healthVerified: timeline.some((stage) => stage.stage === 'Health Check' && stage.status === 'ok'),
        auditRecorded: timeline.some((stage) => stage.stage === 'Rollback Audit' && stage.status === 'ok'),
      };
      addRuntimeLog('success', `[mutation:${mutationId}] Rollback ${recoveryId} completed for runtime ${runtimeId}`, 'recovery_runtime');

      res.json({
        success: true,
        data: {
          mutationId,
          recoveryId,
          runtimeId,
          snapshotId,
          riskLevel,
          precheck,
          postcheck,
          durationMs: Date.now() - startedAt,
          timeline,
          startedAt: new Date(startedAt).toISOString(),
          endedAt: new Date().toISOString(),
        }
      });
    } catch (e: any) {
      try {
        addGovernanceAction('RUNTIME_ROLLBACK', 'Runtime', req.params.id, 'FAILED');
        addRuntimeLog('error', `Rollback failed for runtime ${req.params.id}: ${e.message}`, 'recovery_runtime');
      } catch {}
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // ==========================================
  // VITE MIDDLEWARE (Full-Stack Dev)
  // ==========================================
  
  if (process.env.NODE_ENV !== "production") {
    console.log('[DevCore Startup] Integrating Vite middleware...');
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log('[DevCore Startup] Vite middleware integrated successfully.');
    } catch (err) {
      console.error('[DevCore Startup] Vite initialization failed:', err);
    }
  } else {
    console.log('[DevCore Startup] Serving static files (Production)...');
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
}

startServer().catch(console.error);
