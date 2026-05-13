import { queryDB } from '../database/pool.js';
import fs from 'fs';

// Runtime Resolver
// Single Source Of Truth for resolving a runtime ID into context

export class RuntimeResolver {
  static async ensureRuntimeOperational(runtimeId: string) {
    const runtimes = await queryDB('SELECT * FROM runtimes WHERE id = ? OR project_id = ?', [runtimeId, runtimeId]);
    let runtime = runtimes[0] as any;
    
    if (!runtime) {
       console.warn(`[RuntimeOperations] Runtime Context Not Found: ${runtimeId}. Attempting recovery.`);
       try {
           await this.resolveRuntime(runtimeId);
           const refreshedRuntimes = await queryDB('SELECT * FROM runtimes WHERE id = ? OR project_id = ?', [runtimeId, runtimeId]);
           runtime = refreshedRuntimes[0] as any;
       } catch (e) {
           return { operational: false, error: 'RUNTIME_CONTEXT_NOT_FOUND', details: `Trace failure: ${runtimeId}` };
       }
    }

    if (!runtime) return { operational: false, error: 'RUNTIME_RESOLUTION_REJECTED', details: runtimeId };
    
    // Hard Filesystem Verification
    if (!runtime.runtime_path) {
        return { operational: false, error: 'MISSING_RUNTIME_PATH', runtime };
    }

    if (!fs.existsSync(runtime.runtime_path)) {
        console.error(`[RuntimeOperations] PATH_SYNC_FAILURE: ${runtime.runtime_path} not found.`);
        return { operational: false, error: 'FILESYSTEM_BINDING_FAILED', details: runtime.runtime_path, runtime };
    }

    try {
        const stats = fs.statSync(runtime.runtime_path);
        if (!stats.isDirectory()) {
            return { operational: false, error: 'FILESYSTEM_TYPE_MISMATCH', details: 'Path exists but is not a directory', runtime };
        }
        // Verify readability by attempting a small readdir
        fs.readdirSync(runtime.runtime_path);
    } catch (e: any) {
        console.error(`[RuntimeOperations] DIRECTORY_READ_FAILURE: ${runtime.runtime_path} - ${e.message}`);
        return { operational: false, error: 'FILESYSTEM_ACCESS_DENIED', details: e.message, runtime };
    }
    
    return { operational: true, runtime };
  }

  static async resolveRuntime(runtime_id: string) {
    if (!runtime_id) {
      throw new Error('Runtime ID is required');
    }

    console.log(`[RuntimeResolver] Resolving runtime for: ${runtime_id}`);

    const runtimes = await queryDB('SELECT * FROM runtimes WHERE id = ? OR project_id = ?', [runtime_id, runtime_id]);
    let runtime = runtimes[0] as any;
    
    if (!runtime) {
      console.warn(`[RuntimeResolver] Runtime Context Not Found: ${runtime_id}. Attempting recovery from project records.`);
      
      const projects = await queryDB('SELECT * FROM runtime_projects WHERE id = ? OR name = ?', [runtime_id, runtime_id]);
      const project = projects[0] as any;
      if (project) {
          console.info(`[RuntimeResolver] Recovering runtime entry for project: ${project.id}`);
          const runtimeId = runtime_id;
          const defaultPath = `/www/wwwroot/${project.name}`;
          
          // PHASE 1: PRE-REGISTRATION VERIFICATION
          const verifyPath = project.runtime_path || defaultPath;
          const pathExists = fs.existsSync(verifyPath);
          let pathOperational = false;
          
          if (pathExists) {
            try {
              const stats = fs.statSync(verifyPath);
              if (stats.isDirectory()) {
                fs.readdirSync(verifyPath);
                pathOperational = true;
              }
            } catch (e) {
              console.warn(`[RuntimeResolver] Pre-registration check failed for ${verifyPath}`);
            }
          }

          const initialStatus = pathOperational ? 'active' : 'broken';

          await queryDB(`INSERT INTO runtimes (
              id, project_id, server_id, runtime_name, runtime_path, runtime_port,
              runtime_type, pm2_name, environment, branch, status, ssh_host
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            runtimeId, project.id, project.node_id || 'default-server', project.name, project.runtime_path || defaultPath, project.runtime_port || 3010,
            project.runtime_type || project.type, project.runtime_process || project.name, project.env || 'Production',
            project.git_branch || 'main', initialStatus, project.runtime_host || '127.0.0.1'
          ]);
          
          const refreshedRuntimes = await queryDB('SELECT * FROM runtimes WHERE id = ?', [runtime_id]);
          runtime = refreshedRuntimes[0] as any;
          
          if (!pathOperational) {
             throw new Error(`FILESYSTEM_BINDING_FAILED: Initial trace for ${verifyPath} failed. Runtime marked as ${initialStatus}.`);
          }
      }
    }
    
    if (!runtime) {
      throw new Error(`RUNTIME_RESOLUTION_REJECTED: Context Not Found for ${runtime_id}`);
    }

    // Absolute Filesystem Verification (Double-Check for existing records)
    if (!runtime.runtime_path) {
        throw new Error(`RUNTIME_INTEGRITY_FAILURE: Missing runtime_path for ${runtime_id}`);
    }

    const resolvedPath = runtime.runtime_path;
    const exists = fs.existsSync(resolvedPath);
    
    console.log(`[RuntimeResolver] FULL CRITICAL RUNTIME TRACE [${runtime_id}]:
      - Context ID: ${runtime.id}
      - Project ID: ${runtime.project_id}
      - Target Path: ${resolvedPath}
      - Path Exists: ${exists}
      - Operational Status: ${runtime.status}
      - Validation Check: ${exists ? 'FS_REACHABLE' : 'FS_UNREACHABLE'}
    `);

    if (!exists) {
        if (runtime.status !== 'broken') {
          await queryDB('UPDATE runtimes SET status = ? WHERE id = ?', ['broken', runtime.id]);
        }
        console.error(`[RuntimeResolver] FATAL: Runtime path does not exist on disk: ${resolvedPath}`);
        throw new Error(`FILESYSTEM_BINDING_FAILED: Directory ${resolvedPath} is inaccessible or does not exist`);
    }

    try {
        const stats = fs.statSync(resolvedPath);
        if (!stats.isDirectory()) {
            throw new Error(`RUNTIME_PATH_INVALID: ${resolvedPath} exists but is not a directory`);
        }
    } catch (e: any) {
        throw new Error(`RUNTIME_ACCESS_DENIED: Permission status failure on ${resolvedPath} - ${e.message}`);
    }
    
    return {
      id: runtime.id,
      runtime_path: runtime.runtime_path,
      runtime_port: runtime.runtime_port,
      pm2_name: runtime.pm2_name,
      logs_path: runtime.logs_path,
      environment: runtime.environment,
      server_ip: runtime.ssh_host || '127.0.0.1',
      ssh_context: {
        host: runtime.ssh_host,
        port: runtime.ssh_port,
        user: runtime.ssh_user
      },
      status: runtime.status
    };
  }
}
