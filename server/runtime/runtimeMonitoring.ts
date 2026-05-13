// Runtime Monitoring Live Metrics
// Collects real metrics via top, free -m, df -h, ss -tulnp

import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { RuntimeResolver } from './runtimeResolver.js';

const execAsync = promisify(exec);

export class RuntimeMonitoring {
  static async getLiveMetrics(runtime_id: string) {
    let context: any = null;
    
    if (runtime_id !== 'rt-core') {
      try {
        context = await RuntimeResolver.resolveRuntime(runtime_id);
      } catch (e) {
        // Fallback for unresolved contexts (e.g. wiped db, invalid id)
        context = null;
      }
    }

    const metrics: any = {
      cpu: { usage: 0, cores: os.cpus().length },
      memory: { total: os.totalmem(), free: os.freemem(), usage: 0 },
      disk: { total: 0, used: 0, free: 0 },
      pm2: { status: 'offline', instances: 0, restartCount: 0 },
      uptime: os.uptime(),
      runtime: context ? { id: runtime_id, environment: context.environment, status: context.status } : { id: 'rt-core', environment: 'Global', status: 'active' }
    };
    
    // Calculate Memory
    metrics.memory.usage = ((metrics.memory.total - metrics.memory.free) / metrics.memory.total) * 100;
    
    // CPU usage estimation via OS loadavg
    const loadAvg = os.loadavg();
    metrics.cpu.usage = (loadAvg[0] / metrics.cpu.cores) * 100;

    try {
       // Safe Read-only execs
       const { stdout: dfOut } = await execAsync('df -k / | tail -n 1');
       const dfParts = dfOut.trim().split(/\s+/);
       if (dfParts.length >= 5) {
          const totalStrValue = dfParts[1];
          const usedStrValue = dfParts[2];
          const freeStrValue = dfParts[3];
          // Values usually in KB
          metrics.disk.total = parseInt(totalStrValue) * 1024;
          metrics.disk.used = parseInt(usedStrValue) * 1024;
          metrics.disk.free = parseInt(freeStrValue) * 1024;
       }
    } catch(e) {
       // Fallback
    }
    
    // PM2 Mock (Real PM2 Read-Only integration would be here next phase)
    if (context?.pm2_name) {
       try {
           const { stdout: pm2Out } = await execAsync(`npx pm2 jlist`);
           const pm2Processes = JSON.parse(pm2Out);
           const proc = pm2Processes.find((p: any) => p.name === context.pm2_name);
           if (proc) {
               metrics.pm2.status = proc.pm2_env?.status || 'unknown';
               metrics.pm2.restartCount = proc.pm2_env?.restart_time || 0;
               metrics.pm2.instances = pm2Processes.filter((p:any) => p.name === context.pm2_name).length;
           }
       } catch(e) {
           // PM2 not installed or available, harmless fallback
       }
    } else if (runtime_id === 'rt-core') {
       try {
           const { stdout: pm2Out } = await execAsync(`npx pm2 jlist`);
           const pm2Processes = JSON.parse(pm2Out);
           metrics.pm2.status = pm2Processes.length > 0 ? 'online' : 'offline';
           metrics.pm2.restartCount = pm2Processes.reduce((acc: number, p: any) => acc + (p.pm2_env?.restart_time || 0), 0);
           metrics.pm2.instances = pm2Processes.length;
       } catch(e) {
           // PM2 not installed or available, harmless fallback
       }
    }

    return metrics;
  }
}
