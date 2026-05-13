import { getConnection, isMySQL } from './connection.js';
import { queryDB } from './pool.js';

export async function initRuntimeDB() {
  const conn = await getConnection();
  const schemas = [
    `CREATE TABLE IF NOT EXISTS runtime_users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE,
      role VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS runtime_nodes (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      ip VARCHAR(255),
      region VARCHAR(255),
      os VARCHAR(255),
      status VARCHAR(50),
      cpu VARCHAR(50),
      ram VARCHAR(50),
      storage VARCHAR(50),
      uptime VARCHAR(50),
      health INTEGER,
      auth_type VARCHAR(100),
      username VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS runtime_projects (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      repo VARCHAR(255),
      type VARCHAR(100),
      domain VARCHAR(255),
      env VARCHAR(100),
      status VARCHAR(50),
      uptime VARCHAR(50),
      runtime_path VARCHAR(500),
      node_id VARCHAR(255),
      runtime_process VARCHAR(255),
      runtime_type VARCHAR(100),
      git_branch VARCHAR(100),
      runtime_port INTEGER,
      deploy_command TEXT,
      build_command TEXT,
      install_command TEXT,
      governance_level VARCHAR(50) DEFAULT 'Standard',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS runtime_settings (
      key_name VARCHAR(255) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS runtime_logs (
      id VARCHAR(255) PRIMARY KEY,
      type VARCHAR(50),
      message TEXT,
      source VARCHAR(100),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS runtime_metrics (
      id VARCHAR(255) PRIMARY KEY,
      node_id VARCHAR(255),
      cpu_usage FLOAT,
      memory_usage FLOAT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS runtime_security (
      id VARCHAR(255) PRIMARY KEY,
      threat_type VARCHAR(100),
      source_ip VARCHAR(255),
      action_taken VARCHAR(100),
      risk_level VARCHAR(50),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS runtime_governance (
      id VARCHAR(255) PRIMARY KEY,
      action VARCHAR(255),
      performed_by VARCHAR(255),
      target VARCHAR(255),
      status VARCHAR(50),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS runtime_events (
      id VARCHAR(255) PRIMARY KEY,
      runtime_id VARCHAR(255),
      event_type VARCHAR(100),
      severity VARCHAR(50),
      source VARCHAR(100),
      message TEXT,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS runtime_analysis (
      id VARCHAR(255) PRIMARY KEY,
      runtime_id VARCHAR(255),
      health_score INTEGER,
      risk_score INTEGER,
      state VARCHAR(50),
      recommendations TEXT,
      detected_patterns TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS runtimes (
      id VARCHAR(255) PRIMARY KEY,
      project_id VARCHAR(255),
      server_id VARCHAR(255),
      runtime_name VARCHAR(255),
      runtime_path VARCHAR(500),
      runtime_port INTEGER,
      runtime_type VARCHAR(100),
      pm2_name VARCHAR(255),
      environment VARCHAR(100),
      branch VARCHAR(100),
      status VARCHAR(50),
      ssh_host VARCHAR(255),
      ssh_port INTEGER,
      ssh_user VARCHAR(100),
      logs_path VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  try {
    for (const schema of schemas) {
      if (isMySQL) {
        await (conn as any).query(schema);
      } else {
        await (conn as any).exec(schema);
      }
    }
    console.log('[Runtime DB] Core Governance Tables Verified.');

    // Migration: Add missing columns if they don't exist
    const columnsToAdd = [
      { name: 'runtime_type', type: 'VARCHAR(100)' },
      { name: 'git_branch', type: 'VARCHAR(100)' },
      { name: 'runtime_port', type: 'INTEGER' },
      { name: 'deploy_command', type: 'TEXT' },
      { name: 'build_command', type: 'TEXT' },
      { name: 'install_command', type: 'TEXT' },
      { name: 'runtime_host', type: 'VARCHAR(100)' },
      { name: 'runtime_mode', type: 'VARCHAR(50)' },
      { name: 'pm2_runtime', type: 'VARCHAR(100)' },
      { name: 'governance_level', type: 'VARCHAR(50) DEFAULT \'Standard\'' }
    ];

    for (const col of columnsToAdd) {
      try {
        if (isMySQL) {
          await (conn as any).query(`ALTER TABLE runtime_projects ADD COLUMN ${col.name} ${col.type}`);
        } else {
          await (conn as any).exec(`ALTER TABLE runtime_projects ADD COLUMN ${col.name} ${col.type}`);
        }
        console.log(`[Runtime Migration] Added column ${col.name} to runtime_projects`);
      } catch (e: any) {
        // Ignore error if column already exists
        if (!e.message.includes('duplicate column') && !e.message.includes('already exists')) {
          // console.warn(`[Runtime Migration] Note: ${e.message}`);
        }
      }
    }

    await seedRuntimeData();
  } catch (error) {
    console.error('[Runtime DB] Failed to create tables:', error);
  }
}

async function seedRuntimeData() {
  const conn = await getConnection();
  let countRows = 0;
  if (isMySQL) {
    const [rows]: any = await (conn as any).query('SELECT COUNT(*) as c FROM runtime_security');
    countRows = rows[0]?.c || 0;
  } else {
    const row: any = await (conn as any).get('SELECT COUNT(*) as c FROM runtime_security');
    countRows = row?.c || 0;
  }

  if (countRows === 0) {
    // Seed essential nodes
    await queryDB(`INSERT INTO runtime_nodes (id, name, ip, region, os, status, cpu, ram, storage, uptime, health, auth_type, username) VALUES 
      ('VPS-01', 'PROD-MAIN-01', '187.124.190.79', 'Frankfurt-DE', 'Ubuntu 24.04 LTS', 'online', '12%', '4GB/16GB', '40GB/100GB', '28 days', 100, 'SSH Key', 'root'),
      ('LOCAL-01', 'API-LIVE-01', '127.0.0.1', 'Local-Cluster', 'Nexus OS v2', 'online', '2%', '2GB/8GB', '15GB/50GB', '12 days', 98, 'System Pass', 'nexus-admin'),
      ('EDGE-01', 'EDGE-GLOBAL-01', '8.8.8.8', 'Global-Edge', 'Alpine Linux', 'online', '1%', '512MB/2GB', '5GB/10GB', '120 days', 100, 'Token', 'edge-user')
    `);

    await queryDB(`INSERT INTO runtime_security (id, threat_type, source_ip, action_taken, risk_level) VALUES 
      ('EV-1', 'Brute Force', '192.168.1.100', 'Blocked IP', 'High'),
      ('EV-2', 'SQL Injection', '45.12.3.99', 'Sanitized Request', 'Critical'),
      ('EV-3', 'Port Scan', '103.4.52.1', 'Logged & Ignored', 'Medium')
    `);
    
    // Seed initial projects into Nexus Index
    const projects = [
      {
        id: 'P-101',
        name: 'Nexus Core Primary',
        repo: 'nexus/core',
        type: 'Node.js + Express',
        domain: 'nexus.devcore.com',
        env: 'Production',
        status: 'active',
        uptime: '28d',
        runtime_path: '/var/www/nexus-core',
        node_id: 'VPS-01',
        runtime_process: 'nexus-core',
        runtime_host: '187.124.190.79',
        runtime_mode: 'live',
        runtime_type: 'external-vps',
        pm2_runtime: 'nexus-runtime',
        governance_level: 'Strict'
      },
      {
        id: 'P-102',
        name: 'Dieaya Plus Backend',
        repo: 'dieaya/plus-api',
        type: 'Laravel API',
        domain: 'api.dieaya.com',
        env: 'Production',
        status: 'active',
        uptime: '15d',
        runtime_path: '/var/www/dieaya-plus',
        node_id: 'VPS-01',
        runtime_process: 'dieaya-api',
        runtime_host: '187.124.190.79',
        runtime_mode: 'live',
        runtime_type: 'external-vps',
        pm2_runtime: 'nexus-runtime',
        governance_level: 'Standard'
      },
      {
        id: 'P-103',
        name: 'Nexus Dev Workflow',
        repo: 'nexus/dev-workflow',
        type: 'React + Vite',
        domain: 'dev.nexus.io',
        env: 'Development',
        status: 'active',
        uptime: '3h',
        runtime_path: 'runtime/workspaces/nexus-dev',
        node_id: 'LOCAL-01',
        runtime_process: 'nexus-dev-fe',
        runtime_host: 'localhost',
        runtime_mode: 'dev',
        runtime_type: 'local-runtime',
        pm2_runtime: 'nexus-dev',
        governance_level: 'Relaxed'
      }
    ];

    for (const p of projects) {
       await queryDB(`INSERT INTO runtime_projects (
         id, name, repo, type, domain, env, status, uptime, runtime_path, node_id, runtime_process, 
         runtime_host, runtime_mode, runtime_type, pm2_runtime, governance_level
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
       [p.id, p.name, p.repo, p.type, p.domain, p.env, p.status, p.uptime, p.runtime_path, p.node_id, p.runtime_process,
        p.runtime_host, p.runtime_mode, p.runtime_type, p.pm2_runtime, p.governance_level]);
    }

    console.log('[Runtime DB] Seeded initial security events and projects.');
  }
}
