import { queryDB } from './pool.js';
import { randomUUID } from 'crypto';
import fs from 'fs';

export async function addLog(type: string, message: string, source: string) {
  const id = randomUUID();
  // Using SQLite compatible date function or letting DEFAULT CURRENT_TIMESTAMP handle it
  await queryDB(
    'INSERT INTO runtime_logs (id, type, message, source) VALUES (?, ?, ?, ?)',
    [id, type, message, source]
  );
  return { id, type, message, source, timestamp: new Date().toISOString() };
}

export async function getLogs(limit: number = 50) {
  return await queryDB('SELECT * FROM runtime_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
}

export async function getNodes() {
  return await queryDB('SELECT * FROM runtime_nodes ORDER BY created_at DESC');
}

export async function addNode(node: any) {
  const id = node.id || randomUUID();
  await queryDB(
    `INSERT INTO runtime_nodes (
      id, name, ip, region, os, status, cpu, ram, storage, uptime, health, auth_type, username
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, node.name, node.ip, node.region, node.os, node.status, 
      node.cpu, node.ram, node.storage, node.uptime, node.health,
      node.auth_type, node.username
    ]
  );
  return id;
}

export async function updateNodeStatus(id: string, status: string, health: number) {
  await queryDB('UPDATE runtime_nodes SET status = ?, health = ? WHERE id = ?', [status, health, id]);
}

export async function getDbSecurityEvents() {
  return await queryDB('SELECT * FROM runtime_security ORDER BY timestamp DESC LIMIT 50');
}

export async function addSecurityEvent(threat_type: string, source_ip: string, action_taken: string, risk_level: string) {
  const id = randomUUID();
  await queryDB(
    'INSERT INTO runtime_security (id, threat_type, source_ip, action_taken, risk_level) VALUES (?, ?, ?, ?, ?)',
    [id, threat_type, source_ip, action_taken, risk_level]
  );
  return id;
}

export async function getDbGovernanceActions() {
  return await queryDB('SELECT * FROM runtime_governance ORDER BY timestamp DESC LIMIT 50');
}

export async function addGovernanceAction(action: string, performed_by: string, target: string, status: string) {
  const id = randomUUID();
  await queryDB(
    'INSERT INTO runtime_governance (id, action, performed_by, target, status) VALUES (?, ?, ?, ?, ?)',
    [id, action, performed_by, target, status]
  );
  return id;
}

export async function getProjects() {
  return await queryDB('SELECT * FROM runtime_projects ORDER BY created_at DESC');
}

export async function getProjectById(id: string) {
  const rows = await queryDB('SELECT * FROM runtime_projects WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function addProject(project: any) {
  const id = project.id || randomUUID();
  const runtimeId = randomUUID(); // Separate ID for the runtime record
  await queryDB(
    `INSERT INTO runtime_projects (
      id, name, repo, type, domain, env, status, uptime, 
      runtime_path, node_id, runtime_process, runtime_type, 
      git_branch, runtime_port, deploy_command, build_command, 
      install_command, governance_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, project.name, project.repo, project.type, project.domain,
      project.env, project.status, project.uptime, 
      project.runtime_path, project.node_id, project.runtime_process,
      project.runtime_type || project.type,
      project.git_branch || 'main',
      project.runtime_port || 0,
      project.deploy_command || '',
      project.build_command || '',
      project.install_command || '',
      project.governance_level || 'Standard'
    ]
  );
  
  // Create a corresponding runtime entry
  const pathExists = project.runtime_path && fs.existsSync(project.runtime_path);
  const runtimeStatus = pathExists ? 'active' : 'INVALID_PATH';

  await queryDB(
    `INSERT INTO runtimes (
      id, project_id, server_id, runtime_name, runtime_path, runtime_port,
      runtime_type, pm2_name, environment, branch, status, ssh_host
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      runtimeId, id, project.node_id, project.name, project.runtime_path, project.runtime_port || 3010,
      project.runtime_type || project.type, project.runtime_process, project.env || 'Production',
      project.git_branch || 'main', runtimeStatus, project.runtime_host || '127.0.0.1'
    ]
  );
  
  if (!pathExists) {
    console.warn(`[Queries] Runtime registered with INVALID_PATH: ${project.runtime_path}`);
  }
  
  return id;
}

export async function updateProject(id: string, project: any) {
  await queryDB(
    `UPDATE runtime_projects SET 
      name = ?, repo = ?, type = ?, domain = ?, env = ?, 
      status = ?, uptime = ?, runtime_path = ?, node_id = ?, 
      runtime_process = ?, runtime_type = ?, git_branch = ?, 
      runtime_port = ?, deploy_command = ?, build_command = ?, 
      install_command = ?, governance_level = ?
    WHERE id = ?`,
    [
      project.name, project.repo, project.type, project.domain, project.env,
      project.status, project.uptime, project.runtime_path, project.node_id, 
      project.runtime_process, project.runtime_type, project.git_branch, 
      project.runtime_port, project.deploy_command, project.build_command, 
      project.install_command, project.governance_level,
      id
    ]
  );
}

export async function deleteProject(id: string) {
  await queryDB('DELETE FROM runtime_projects WHERE id = ?', [id]);
}

export async function deleteNode(id: string) {
  await queryDB('DELETE FROM runtime_nodes WHERE id = ?', [id]);
}

export async function setSetting(key: string, value: string) {
  // Upsert query suitable for both MySQL and SQLite, but let's use a simpler approach:
  // Try update, if 0 rows changed, insert. Or Delete then Insert. 
  await queryDB('DELETE FROM runtime_settings WHERE key_name = ?', [key]);
  await queryDB('INSERT INTO runtime_settings (key_name, value) VALUES (?, ?)', [key, value]);
}

export async function getSettings() {
  return await queryDB('SELECT * FROM runtime_settings');
}

export async function getSetting(key: string) {
  const rows = await queryDB('SELECT value FROM runtime_settings WHERE key_name = ?', [key]);
  return rows.length > 0 ? rows[0].value : null;
}
