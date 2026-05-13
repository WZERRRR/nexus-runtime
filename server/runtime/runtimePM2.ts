import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { RuntimeResolver } from './runtimeResolver.js';

const execAsync = promisify(exec);

// Runtime PM2 Binding
// Read-Only Observable PM2 Connection 

export class RuntimePM2 {
  static async getRuntimeProcess(runtime_id: string) {
    let context: any = null;
    if (runtime_id !== 'rt-core') {
      try {
        context = await RuntimeResolver.resolveRuntime(runtime_id);
      } catch (e) {
        context = null;
      }
    }

    if (!context?.pm2_name) {
       // Check global PM2 processes if it's rt-core
       if (runtime_id === 'rt-core') {
           try {
               const { stdout } = await execAsync(`npx pm2 jlist`);
               const pm2Processes = JSON.parse(stdout);
               return pm2Processes.map((proc: any) => ({
                   status: proc.pm2_env?.status || 'unknown',
                   cpu: proc.monit?.cpu || 0,
                   memory: proc.monit?.memory ? Math.round(proc.monit.memory / 1024 / 1024) : 0,
                   uptime: proc.pm2_env?.pm_uptime ? Math.round((Date.now() - proc.pm2_env.pm_uptime) / 1000) : 0,
                   restarts: proc.pm2_env?.restart_time || 0,
                   pid: proc.pid || 0,
                   exec_mode: proc.pm2_env?.exec_mode || 'fork',
                   node_version: proc.pm2_env?.node_version || 'unknown',
                   name: proc.name,
                   watch: proc.pm2_env?.watch || false
               }));
           } catch(e) {
               return [];
           }
       }
       // Return unavailable gracefully if no pm2 process is associated
       return {
          status: "unavailable",
          cpu: 0,
          memory: 0,
          uptime: 0,
          restarts: 0,
          pid: 0,
          exec_mode: "unknown",
          node_version: "unknown",
          name: "Unknown Process"
       };
    }

    try {
        const { stdout } = await execAsync(`npx pm2 jlist`);
        const pm2Processes = JSON.parse(stdout);
        const proc = pm2Processes.find((p: any) => p.name === context.pm2_name);
        
        if (proc) {
            return [{
                status: proc.pm2_env?.status || 'unknown',
                cpu: proc.monit?.cpu || 0,
                memory: proc.monit?.memory ? Math.round(proc.monit.memory / 1024 / 1024) : 0, // MB
                uptime: proc.pm2_env?.pm_uptime ? Math.round((Date.now() - proc.pm2_env.pm_uptime) / 1000) : 0,
                restarts: proc.pm2_env?.restart_time || 0,
                pid: proc.pid || 0,
                exec_mode: proc.pm2_env?.exec_mode || 'fork',
                node_version: proc.pm2_env?.node_version || 'unknown',
                name: proc.name,
                watch: proc.pm2_env?.watch || false
            }];
        } else {
           return [{
              status: "offline",
              cpu: 0,
              memory: 0,
              uptime: 0,
              restarts: 0,
              pid: 0,
              exec_mode: "unknown",
              node_version: "unknown",
              name: context.pm2_name
           }];
        }
    } catch (e) {
       // Fallback on error (e.g. pm2 not installed globally or local npx fails)
       return [{
          status: "error",
          cpu: 0,
          memory: 0,
          uptime: 0,
          restarts: 0,
          pid: 0,
          exec_mode: "unknown",
          node_version: "unknown",
          name: context.pm2_name
       }];
    }
  }
}
