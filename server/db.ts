import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(path.join(dataDir, 'runtime_persistence.db'));

db.pragma('journal_mode = WAL');

// Initialize schema
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS runtimes (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      server_id TEXT,
      runtime_name TEXT,
      runtime_path TEXT,
      runtime_port INTEGER,
      runtime_type TEXT,
      pm2_name TEXT,
      environment TEXT,
      branch TEXT,
      status TEXT,
      ssh_host TEXT,
      ssh_port INTEGER,
      ssh_user TEXT,
      logs_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      source TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runtime_policy_analysis (
      runtime_id TEXT NOT NULL,
      policy_state TEXT NOT NULL,
      allowed_operations TEXT NOT NULL,
      restricted_operations TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      recommendations TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runtime_governance (
      runtime_id TEXT NOT NULL,
      policy_type TEXT NOT NULL,
      policy_value TEXT NOT NULL,
      enforcement_level TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runtime_autonomous_analysis (
      runtime_id TEXT NOT NULL,
      forecast_type TEXT,
      risk_projection TEXT,
      stability_projection TEXT,
      recommended_protection_level TEXT,
      future_risk_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runtime_federation (
      runtime_id TEXT PRIMARY KEY,
      cluster_name TEXT,
      node_group TEXT,
      federation_status TEXT,
      last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runtime_locks (
      runtime_id TEXT NOT NULL,
      deployment_id TEXT PRIMARY KEY,
      requested_by TEXT,
      approval_id TEXT,
      snapshot_id TEXT,
      deploy_status TEXT NOT NULL,
      risk_level TEXT,
      deploy_strategy TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS runtime_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      runtime_id TEXT NOT NULL,
      snapshot_type TEXT,
      runtime_state TEXT,
      pm2_state TEXT,
      environment_state TEXT,
      policy_state TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runtime_recovery (
      recovery_id TEXT PRIMARY KEY,
      runtime_id TEXT NOT NULL,
      snapshot_id TEXT,
      recovery_type TEXT,
      recovery_status TEXT,
      risk_level TEXT,
      requested_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runtime_actions (
      runtime_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      requested_by TEXT,
      approval_id TEXT,
      execution_status TEXT NOT NULL,
      execution_result TEXT,
      risk_level TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS runtime_ssh_sessions (
      session_id TEXT PRIMARY KEY,
      runtime_id TEXT NOT NULL,
      created_by TEXT,
      session_status TEXT NOT NULL,
      access_level TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS runtime_approvals (
      id TEXT PRIMARY KEY,
      runtime_id TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      requested_by TEXT,
      approval_status TEXT NOT NULL,
      risk_level TEXT,
      approval_reason TEXT,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      reviewed_by TEXT
    );

    CREATE TABLE IF NOT EXISTS runtime_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runtime_analysis (
      id TEXT PRIMARY KEY,
      runtime_id TEXT NOT NULL,
      health_score INTEGER NOT NULL,
      risk_score INTEGER NOT NULL,
      state TEXT NOT NULL,
      recommendations TEXT,
      detected_patterns TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS governance_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      target TEXT,
      status TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS security_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      threat_type TEXT NOT NULL,
      source_ip TEXT,
      action_taken TEXT,
      risk_level TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS active_sessions (
      session_id TEXT PRIMARY KEY,
      uid TEXT NOT NULL,
      role TEXT NOT NULL,
      ip TEXT,
      device TEXT,
      status TEXT,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runtime_state_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memory_used BIGINT,
      memory_total BIGINT,
      cpu_usage_user BIGINT,
      cpu_usage_system BIGINT,
      uptime BIGINT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS readiness_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      check_type TEXT NOT NULL,
      result TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Phase 11: Runtime Execution Engine
    CREATE TABLE IF NOT EXISTS command_registry (
      command_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      scope TEXT NOT NULL, -- e.g., 'kernel', 'ai', 'security'
      validation_regex TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS execution_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_id TEXT NOT NULL,
      parameters TEXT,
      status TEXT NOT NULL, -- 'Pending', 'Running', 'Completed', 'Failed'
      triggered_by TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME,
      exit_code INTEGER,
      error_message TEXT
    );

    CREATE TABLE IF NOT EXISTS runtime_execution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      execution_id INTEGER NOT NULL,
      log_level TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Phase 13: Runtime Agents & Operational Intelligence
    CREATE TABLE IF NOT EXISTS runtime_agents (
      agent_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      node_id TEXT NOT NULL,
      scope TEXT NOT NULL, -- 'kernel', 'api', 'security', 'ai'
      status TEXT DEFAULT 'ONLINE', -- 'ONLINE', 'DEGRADED', 'STALE', 'DISCONNECTED', 'MAINTENANCE'
      version TEXT,
      agent_token TEXT, -- Security Layer
      last_heartbeat DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agent_heartbeats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      cpu_usage REAL,
      memory_usage REAL,
      uptime_seconds INTEGER,
      process_count INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runtime_nodes (
      node_id TEXT PRIMARY KEY,
      region TEXT DEFAULT 'Local-Cluster',
      ip_address TEXT,
      role TEXT DEFAULT 'Worker',
      status TEXT DEFAULT 'Active'
    );

    -- Phase 14: CI/CD Runtime Infrastructure
    CREATE TABLE IF NOT EXISTS deployment_pipelines (
      pipeline_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'queued', -- 'queued', 'validating', 'building', 'deploying', 'completed', 'failed', 'rollback'
      target_env TEXT NOT NULL, -- 'DEV', 'STAGING', 'LIVE'
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deployment_jobs (
      job_id INTEGER PRIMARY KEY AUTOINCREMENT,
      pipeline_id TEXT NOT NULL,
      stage TEXT NOT NULL, -- 'validation', 'build', 'artifact_push', 'runtime_deploy'
      status TEXT DEFAULT 'pending', -- 'pending', 'running', 'success', 'failed'
      logs TEXT,
      started_at DATETIME,
      finished_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS deployment_artifacts (
      artifact_id TEXT PRIMARY KEY,
      pipeline_id TEXT NOT NULL,
      version TEXT NOT NULL,
      checksum TEXT,
      metadata TEXT, -- JSON configuration
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rollback_checkpoints (
      checkpoint_id TEXT PRIMARY KEY,
      pipeline_id TEXT NOT NULL,
      artifact_id TEXT NOT NULL,
      status TEXT DEFAULT 'READY',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Phase 16: Production Hardening & Coordination
    CREATE TABLE IF NOT EXISTS production_protection_locks (
      lock_id TEXT PRIMARY KEY,
      resource_type TEXT NOT NULL, -- 'KERNEL', 'NETWORK', 'DB', 'AGENT_CLUSTER'
      status TEXT DEFAULT 'LOCKED', -- 'LOCKED', 'UNLOCKED', 'BYPASSED'
      authority_required TEXT DEFAULT 'LEVEL-5',
      last_audit_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS node_coordination_states (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       node_id TEXT NOT NULL,
       sync_status TEXT DEFAULT 'SYNCHRONIZED',
       drift_value REAL DEFAULT 0.0,
       last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Phase 15: Runtime Recovery & Stability Infrastructure
    CREATE TABLE IF NOT EXISTS runtime_restore_points (
      restore_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      scope TEXT NOT NULL, -- 'Full', 'Kernel', 'Security', 'Policy'
      state_snapshot TEXT, -- JSON snapshot of vital config
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recovery_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restore_id TEXT NOT NULL,
      status TEXT DEFAULT 'Initiated', -- 'Initiated', 'Validating', 'Success', 'Failed'
      logs TEXT,
      executed_by TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS infrastructure_stability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      score INTEGER DEFAULT 100, -- 0-100 stability index
      factor TEXT, -- 'High Latency', 'Frequent Violations', 'Agent Drift'
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_infrastructure_stability_timestamp ON infrastructure_stability(timestamp);

    CREATE TABLE IF NOT EXISTS runtime_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT DEFAULT 'Low', -- 'Low', 'Medium', 'Critical'
      impact_area TEXT, -- 'Security', 'Performance', 'Stability'
      status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPLIED', 'DISMISSED'
      suggested_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Phase 13.5: Operational Intelligence & Correlation
    CREATE TABLE IF NOT EXISTS runtime_agent_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      level TEXT DEFAULT 'INFO',
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operational_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'Anomaly', 'Drift', 'Correlation', 'Threat'
      severity TEXT DEFAULT 'Low',
      source TEXT,
      details TEXT,
      is_resolved INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Phase 12: Runtime Policy Engine
    CREATE TABLE IF NOT EXISTS runtime_policies (
      policy_id TEXT PRIMARY KEY,
      command_id TEXT NOT NULL,
      required_role TEXT DEFAULT 'Developer',
      min_authority_level INTEGER DEFAULT 1,
      allowed_environments TEXT DEFAULT 'DEV', -- CSV list
      risk_level TEXT DEFAULT 'Low',
      cooldown_seconds INTEGER DEFAULT 60,
      requires_audit_reason INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS policy_violations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT NOT NULL,
      command_id TEXT NOT NULL,
      violation_type TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS simulation_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      is_stress_mode INTEGER DEFAULT 0,
      is_drill_active INTEGER DEFAULT 0,
      chaos_level INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO simulation_state (id, is_stress_mode) VALUES (1, 0);
  `);
}

// ===============================================
// Phase 18: Operational Simulation & Stress Testing
// ===============================================
export function getSimulationState() {
  return db.prepare('SELECT * FROM simulation_state WHERE id = 1').get() as any;
}

export function updateSimulationState(isStress: number, chaosLevel: number = 0) {
  db.prepare('UPDATE simulation_state SET is_stress_mode = ?, chaos_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(isStress, chaosLevel);
  addRuntimeLog(isStress ? 'warning' : 'info', `Operational Simulation State: ${isStress ? 'STRESS_MODE ACTIVE' : 'Normal'} (Chaos: ${chaosLevel}%)`, 'simulation_engine');
}

export function toggleDrill(active: number) {
  db.prepare('UPDATE simulation_state SET is_drill_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(active);
  addRuntimeLog(active ? 'warning' : 'success', `Recovery Drill ${active ? 'INITIATED' : 'FINALIZED'}`, 'simulation_engine');
}

// ===============================================
// Phase 16: Hardening & Coordination Helpers
// ===============================================
export function getProtectionLocks() {
  return db.prepare(`SELECT * FROM production_protection_locks`).all();
}

export function updateLockStatus(id: string, status: string) {
  db.prepare(`UPDATE production_protection_locks SET status = ?, last_audit_at = CURRENT_TIMESTAMP WHERE lock_id = ?`).run(status, id);
}

export function recordNodeSync(nodeId: string, status: string, drift: number) {
  db.prepare(`INSERT INTO node_coordination_states (node_id, sync_status, drift_value) VALUES (?, ?, ?)`).run(nodeId, status, drift);
}

export function getNodeCoordination() {
  return db.prepare(`SELECT * FROM node_coordination_states ORDER BY last_sync_at DESC LIMIT 10`).all();
}

// ===============================================
// Phase 15: Runtime Recovery & Intelligence Helpers
// ===============================================
export function createRestorePoint(name: string, scope: string, snapshot: string, user: string) {
  const id = `RS-${Math.random().toString(36).substring(7).toUpperCase()}`;
  db.prepare(`
    INSERT INTO runtime_restore_points (restore_id, name, scope, state_snapshot, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, scope, snapshot, user);
  return id;
}

export function logRecoveryAction(id: string, status: string, logs: string, user: string) {
  db.prepare(`
    INSERT INTO recovery_history (restore_id, status, logs, executed_by)
    VALUES (?, ?, ?, ?)
  `).run(id, status, logs, user);
}

export function recordStability(score: number, factor: string) {
  db.prepare(`INSERT INTO infrastructure_stability (score, factor) VALUES (?, ?)`).run(score, factor);
}

export function addRecommendation(title: string, desc: string, severity: string, area: string) {
  db.prepare(`
    INSERT INTO runtime_recommendations (title, description, severity, impact_area)
    VALUES (?, ?, ?, ?)
  `).run(title, desc, severity, area);
}

export function getRestorePoints() {
  return db.prepare(`SELECT * FROM runtime_restore_points ORDER BY created_at DESC LIMIT 10`).all();
}

export function getLatestStability() {
  return db.prepare(`SELECT * FROM infrastructure_stability ORDER BY timestamp DESC LIMIT 20`).all();
}

export function getPendingRecommendations() {
  return db.prepare(`SELECT * FROM runtime_recommendations WHERE status = 'PENDING' ORDER BY suggested_at DESC`).all();
}

// ===============================================
// Phase 14: CI/CD Runtime Infrastructure
// ===============================================
export function createPipeline(pipeline: { id: string, name: string, env: string, user: string }) {
  const stmt = db.prepare(`
    INSERT INTO deployment_pipelines (pipeline_id, name, target_env, created_by)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(pipeline.id, pipeline.name, pipeline.env, pipeline.user);
  addRuntimeLog('info', `Deployment Pipeline Created: ${pipeline.id} for ${pipeline.env}`, 'cicd_engine');
}

export function updatePipelineStatus(id: string, status: string) {
  db.prepare('UPDATE deployment_pipelines SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE pipeline_id = ?').run(status, id);
}

export function addDeploymentJob(pipelineId: string, stage: string) {
  const stmt = db.prepare('INSERT INTO deployment_jobs (pipeline_id, stage, status) VALUES (?, ?, "pending")');
  return stmt.run(pipelineId, stage).lastInsertRowid;
}

export function updateJobStatus(jobId: number, status: string, logs: string) {
  db.prepare('UPDATE deployment_jobs SET status = ?, logs = ?, finished_at = CURRENT_TIMESTAMP WHERE job_id = ?').run(status, logs, jobId);
}

export function registerArtifact(artifact: { id: string, pipeline_id: string, version: string, metadata: string }) {
  const stmt = db.prepare('INSERT INTO deployment_artifacts (artifact_id, pipeline_id, version, metadata) VALUES (?, ?, ?, ?)');
  stmt.run(artifact.id, artifact.pipeline_id, artifact.version, artifact.metadata);
}

export function getPipelines(limit: number = 10) {
  return db.prepare('SELECT * FROM deployment_pipelines ORDER BY created_at DESC LIMIT ?').all(limit);
}

export function getPipelineJobs(pipelineId: string) {
  return db.prepare('SELECT * FROM deployment_jobs WHERE pipeline_id = ?').all(pipelineId);
}

export function getArtifacts(limit: number = 20) {
  return db.prepare('SELECT * FROM deployment_artifacts ORDER BY created_at DESC LIMIT ?').all(limit);
}

// ===============================================
// Phase 13: Runtime Agents & Op Intelligence
// ===============================================
export function registerAgent(id: string, name: string, node: string, scope: string) {
  const stmt = db.prepare(`
    INSERT INTO runtime_agents (agent_id, name, node_id, scope)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(agent_id) DO UPDATE SET 
      name=excluded.name, node_id=excluded.node_id, scope=excluded.scope
  `);
  stmt.run(id, name, node, scope);
}

export function recordHeartbeat(agentId: string, cpu: number, mem: number, uptime: number) {
  const stmt = db.prepare(`
    INSERT INTO agent_heartbeats (agent_id, cpu_usage, memory_usage, uptime_seconds)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(agentId, cpu, mem, uptime);
  
  // Update agent status and last heartbeat timestamp
  db.prepare(`UPDATE runtime_agents SET last_heartbeat = CURRENT_TIMESTAMP, status = 'ONLINE' WHERE agent_id = ?`).run(agentId);
}

export function getAgents() {
  return db.prepare(`
    SELECT a.*, h.cpu_usage, h.memory_usage, h.uptime_seconds
    FROM runtime_agents a
    LEFT JOIN agent_heartbeats h ON h.id = (
      SELECT id FROM agent_heartbeats WHERE agent_id = a.agent_id ORDER BY timestamp DESC LIMIT 1
    )
  `).all();
}

export function upsertNode(id: string, region: string, ip: string, role: string) {
  const stmt = db.prepare(`
    INSERT INTO runtime_nodes (node_id, region, ip_address, role)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(node_id) DO UPDATE SET 
      region=excluded.region, ip_address=excluded.ip_address, role=excluded.role
  `);
  stmt.run(id, region, ip, role);
}

export function getNodes() {
  return db.prepare('SELECT * FROM runtime_nodes').all();
}

export function deleteNode(id: string) {
  db.prepare('DELETE FROM runtime_nodes WHERE node_id = ?').run(id);
}

export function addAgentLog(agentId: string, level: string, message: string) {
  const stmt = db.prepare('INSERT INTO runtime_agent_logs (agent_id, level, message) VALUES (?, ?, ?)');
  stmt.run(agentId, level, message);
}

export function addOperationalSignal(type: string, severity: string, source: string, details: string) {
  const stmt = db.prepare('INSERT INTO operational_signals (type, severity, source, details) VALUES (?, ?, ?, ?)');
  stmt.run(type, severity, source, details);
}

export function getOperationalSignals(limit: number = 20) {
  return db.prepare('SELECT * FROM operational_signals ORDER BY timestamp DESC LIMIT ?').all(limit);
}

// ===================================
// Phase 12: Runtime Policy Engine
// ===================================
export function upsertPolicy(policy: {
  policy_id: string;
  command_id: string;
  required_role: string;
  min_authority_level: number;
  allowed_environments: string;
  risk_level: string;
  cooldown_seconds: number;
  requires_audit_reason: number;
}) {
  const stmt = db.prepare(`
    INSERT INTO runtime_policies (
      policy_id, command_id, required_role, min_authority_level, 
      allowed_environments, risk_level, cooldown_seconds, requires_audit_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(policy_id) DO UPDATE SET 
      required_role=excluded.required_role,
      min_authority_level=excluded.min_authority_level,
      allowed_environments=excluded.allowed_environments,
      risk_level=excluded.risk_level,
      cooldown_seconds=excluded.cooldown_seconds,
      requires_audit_reason=excluded.requires_audit_reason
  `);
  stmt.run(
    policy.policy_id, policy.command_id, policy.required_role, 
    policy.min_authority_level, policy.allowed_environments, 
    policy.risk_level, policy.cooldown_seconds, policy.requires_audit_reason
  );
}

export function getPolicyForCommand(commandId: string) {
  return db.prepare('SELECT * FROM runtime_policies WHERE command_id = ? AND is_active = 1').get(commandId) as any;
}

export function addPolicyViolation(uid: string, commandId: string, type: string, details: string) {
  const stmt = db.prepare('INSERT INTO policy_violations (uid, command_id, violation_type, details) VALUES (?, ?, ?, ?)');
  stmt.run(uid, commandId, type, details);
  addRuntimeLog('error', `Policy Violation: ${type} by ${uid} on ${commandId}`, 'policy_engine');
}

export function getRecentViolations(limit: number = 20) {
  return db.prepare('SELECT * FROM policy_violations ORDER BY timestamp DESC LIMIT ?').all(limit);
}

// ... rest of methods

// ===================================
// Phase 11: Runtime Execution Engine
// ===================================
export function registerCommand(id: string, name: string, description: string, scope: string, regex: string | null = null) {
  const stmt = db.prepare(`
    INSERT INTO command_registry (command_id, name, description, scope, validation_regex)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(command_id) DO UPDATE SET 
      name=excluded.name, description=excluded.description, scope=excluded.scope, validation_regex=excluded.validation_regex
  `);
  stmt.run(id, name, description, scope, regex);
}

export function startExecution(commandId: string, parameters: string, triggeredBy: string) {
  const stmt = db.prepare('INSERT INTO execution_history (command_id, parameters, status, triggered_by) VALUES (?, ?, ?, ?)');
  const res = stmt.run(commandId, parameters, 'Running', triggeredBy);
  return res.lastInsertRowid;
}

export function finishExecution(id: number | bigint, status: string, exitCode: number, error: string | null = null) {
  const stmt = db.prepare('UPDATE execution_history SET status = ?, exit_code = ?, error_message = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(status, exitCode, error, id);
}

export function addExecutionLog(executionId: number | bigint, level: string, message: string) {
  const stmt = db.prepare('INSERT INTO runtime_execution_logs (execution_id, log_level, message) VALUES (?, ?, ?)');
  stmt.run(executionId, level, message);
}

export function getExecutionHistory(limit: number = 20) {
  const stmt = db.prepare(`
    SELECT h.*, r.name as command_name 
    FROM execution_history h 
    JOIN command_registry r ON h.command_id = r.command_id 
    ORDER BY h.started_at DESC LIMIT ?
  `);
  return stmt.all(limit);
}

export function getExecutionLogs(executionId: number) {
  const stmt = db.prepare('SELECT * FROM runtime_execution_logs WHERE execution_id = ? ORDER BY timestamp ASC');
  return stmt.all(executionId);
}

// ===================================
// Phase 1: Governance & Audit Logs
// ===================================
import { addLog } from './database/queries.js';

export function addRuntimeLog(type: string, message: string, source: string = 'system') {
  const stmt = db.prepare('INSERT INTO audit_logs (type, message, source) VALUES (?, ?, ?)');
  const res = stmt.run(type, message, source);
  
  // Also push to persistent runtime DB asynchronously
  addLog(type, message, source).catch(err => console.error("Failed to push log to runtime DB:", err));

  return { id: res.lastInsertRowid, type, message, source, timestamp: new Date().toISOString() };
}

export function getRecentLogs(limit: number = 50) {
  const stmt = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit);
}

// ===================================
// Phase 2: Session Persistence
// ===================================
export function upsertSession(sessionId: string, uid: string, role: string, ip: string, device: string, status: string) {
  const stmt = db.prepare(`
    INSERT INTO active_sessions (session_id, uid, role, ip, device, status, last_active)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(session_id) DO UPDATE SET 
      status=excluded.status, 
      last_active=CURRENT_TIMESTAMP
  `);
  stmt.run(sessionId, uid, role, ip, device, status);
  addRuntimeLog('info', `Session ${status} for UID: ${uid}`, 'identity_core');
}

export function getActiveSessions() {
  const stmt = db.prepare(`SELECT * FROM active_sessions WHERE status = 'Active' ORDER BY last_active DESC`);
  return stmt.all();
}

export function suspendSession(uid: string) {
  const stmt = db.prepare('UPDATE active_sessions SET status = "Suspended" WHERE uid = ?');
  stmt.run(uid);
  addGovernanceAction('RevokeSession', 'SystemKernel', uid, 'Executed');
  addRuntimeLog('warning', `All sessions suspended for UID: ${uid}`, 'security_core');
}

// ===================================
// Phase 3: Runtime State Persistence
// ===================================
export function addStateSnapshot(memoryUsed: number, memoryTotal: number, cpuUser: number, cpuSys: number, uptime: number) {
  const stmt = db.prepare(`
    INSERT INTO runtime_state_snapshots (memory_used, memory_total, cpu_usage_user, cpu_usage_system, uptime) 
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(memoryUsed, memoryTotal, cpuUser, cpuSys, uptime);
}

export function getStateHistory(limit: number = 20) {
  const stmt = db.prepare('SELECT * FROM runtime_state_snapshots ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit);
}

// ===================================
// Phase 4: Enterprise Audit Core
// ===================================
export function addGovernanceAction(action: string, performedBy: string, target: string, status: string) {
  const stmt = db.prepare('INSERT INTO governance_actions (action, performed_by, target, status) VALUES (?, ?, ?, ?)');
  stmt.run(action, performedBy, target, status);
}

export function getGovernanceActions(limit: number = 20) {
  const stmt = db.prepare('SELECT * FROM governance_actions ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit);
}

// ===================================
// Phase 6: Runtime Event Engine
// ===================================
export function addRuntimeEvent(eventType: string, severity: string, details: string) {
  const stmt = db.prepare('INSERT INTO runtime_events (event_type, severity, details) VALUES (?, ?, ?)');
  stmt.run(eventType, severity, details);
}

export function getRuntimeEvents(limit: number = 50) {
  const stmt = db.prepare('SELECT * FROM runtime_events ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit);
}

// ===================================
// Phase 9: Security Persistence Layer
// ===================================
export function addSecurityEvent(threatType: string, sourceIp: string, actionTaken: string, riskLevel: string) {
  const stmt = db.prepare('INSERT INTO security_events (threat_type, source_ip, action_taken, risk_level) VALUES (?, ?, ?, ?)');
  stmt.run(threatType, sourceIp, actionTaken, riskLevel);
  addRuntimeLog('error', `Security Event: ${threatType} (${riskLevel})`, 'soc_core');
}

export function getSecurityEvents(limit: number = 50) {
  const stmt = db.prepare('SELECT * FROM security_events ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit);
}

// ===================================
// Phase 10: Production Readiness History
// ===================================
export function addReadinessCheck(checkType: string, result: string) {
  const stmt = db.prepare('INSERT INTO readiness_history (check_type, result) VALUES (?, ?)');
  stmt.run(checkType, result);
}

export function getReadinessHistory(limit: number = 10) {
  const stmt = db.prepare('SELECT * FROM readiness_history ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit);
}

// Keep some dummy data seed for the first time
export function seedDummyData() {
  const count = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as { c: number };
  if (count.c === 0) {
    addRuntimeLog('info', 'Nexus Runtime Layer Initialized', 'kernel');
    addRuntimeLog('success', 'Governance Operating System Online', 'security');
    addRuntimeLog('warning', 'Baseline memory limits enforced', 'monitor');

    upsertSession('S-1001', 'U-12A4', 'Super Admin', '192.168.1.1', 'MacBook Pro', 'Active');
    upsertSession('S-1002', 'U-91B2', 'Developer', '10.0.0.51', 'Windows PC', 'Active');
    upsertSession('S-1003', 'U-22X9', 'Guest', 'Anonymous IP', 'Browser', 'Idle');

    addSecurityEvent('DDoS Attempt on Kernel API', '45.132.x.x', 'Auto-Blocked (WAF)', 'Critical');
    addSecurityEvent('Privilege Escalation Attempt', '10.0.0.22', 'Session Terminated', 'Critical');

    addGovernanceAction('Policy Update: Rate Limit', 'AI Neural Core', 'API Gateway', 'Executed');
    addGovernanceAction('Resource Rebalancing', 'SystemKernel', 'Global Cluster', 'Executed');

    // Execution Engine: Register Permitted Commands
    registerCommand('refresh-runtime', 'Refresh Runtime', 'Re-initialize runtime context and cache', 'kernel');
    registerCommand('flush-ai-memory', 'Flush AI Memory', 'Clear neural context for AI agents', 'ai');
    registerCommand('rotate-keys', 'Rotate API Keys', 'Security key rotation protocol', 'security');
    registerCommand('health-check-deep', 'Deep Health Check', 'Exhaustive system resource validation', 'kernel');

    // Phase 16: Seed Hardening & Coordination
    db.prepare(`INSERT INTO production_protection_locks (lock_id, resource_type, status, authority_required) VALUES (?, ?, ?, ?)`).run('PROD-LOCK-01', 'KERNEL', 'LOCKED', 'LEVEL-MAX');
    db.prepare(`INSERT INTO production_protection_locks (lock_id, resource_type, status, authority_required) VALUES (?, ?, ?, ?)`).run('PROD-LOCK-02', 'NETWORK', 'LOCKED', 'LEVEL-5');
    
    recordNodeSync('node-main', 'SYNCHRONIZED', 0.001);
    recordNodeSync('node-worker-1', 'SYNCHRONIZED', 0.002);

    // Phase 15: Seed Recovery & Stability Data
    const rId = createRestorePoint('Pre-Patch Baseline', 'Full', '{"kernel_ver": "2.3.9", "policy_active": 12}', 'System-Auto');
    logRecoveryAction(rId, 'Success', 'Automated baseline captured.', 'Kernel-Watch');
    
    recordStability(98, 'Optimal');
    recordStability(94, 'Minor Agent Drift');
    recordStability(97, 'Recovered');

    addRecommendation(
      'Isolate Sec-Agent-01', 
      'Process drift detected in security scope. Isolation recommended to prevent policy bypass.',
      'Medium',
      'Security'
    );
    addRecommendation(
      'Scale Node-Worker-1',
      'CPU load exceeding 80% on neural observers. Horizontal scaling suggested.',
      'Low',
      'Performance'
    );

    // Phase 14: Seed Pipeline Data
    createPipeline({ id: 'PIPE-L01', name: 'Kernel Core Update', env: 'STAGING', user: 'Admin-System' });
    const jobId = addDeploymentJob('PIPE-L01', 'validation') as number;
    updateJobStatus(jobId, 'success', 'All health checks passed.');
    updatePipelineStatus('PIPE-L01', 'completed');
    
    registerArtifact({ 
      id: 'ART-001', 
      pipeline_id: 'PIPE-L01', 
      version: 'v2.4.0-stable', 
      metadata: JSON.stringify({ components: ['kernel', 'policy_engine'], branch: 'main' }) 
    });

    // Phase 13: Seed Nodes and Agents
    upsertNode('node-main', 'Local-Cluster', '127.0.0.1', 'Master');
    upsertNode('node-worker-1', 'Local-Cluster', '127.0.0.2', 'Worker');
    
    registerAgent('agt-kernel-01', 'Kernel Watcher', 'node-main', 'kernel');
    registerAgent('agt-sec-01', 'Security Sentinel', 'node-worker-1', 'security');
    registerAgent('agt-ai-01', 'Neural Observer', 'node-worker-1', 'ai');

    // Seed Policies
    upsertPolicy({
        policy_id: 'P-REFRESH',
        command_id: 'refresh-runtime',
        required_role: 'Developer',
        min_authority_level: 1,
        allowed_environments: 'DEV,STAGING',
        risk_level: 'Low',
        cooldown_seconds: 30,
        requires_audit_reason: 0
    });
    upsertPolicy({
        policy_id: 'P-FLUSH',
        command_id: 'flush-ai-memory',
        required_role: 'Admin',
        min_authority_level: 2,
        allowed_environments: 'DEV,STAGING',
        risk_level: 'Medium',
        cooldown_seconds: 60,
        requires_audit_reason: 1
    });
    upsertPolicy({
        policy_id: 'P-ROTATE',
        command_id: 'rotate-keys',
        required_role: 'Super Admin',
        min_authority_level: 3,
        allowed_environments: 'DEV',
        risk_level: 'High',
        cooldown_seconds: 300,
        requires_audit_reason: 1
    });
    upsertPolicy({
        policy_id: 'P-DEEP-HEALTH',
        command_id: 'health-check-deep',
        required_role: 'Developer',
        min_authority_level: 1,
        allowed_environments: 'DEV,STAGING,LIVE',
        risk_level: 'Low',
        cooldown_seconds: 10,
        requires_audit_reason: 0
    });
  }
}
