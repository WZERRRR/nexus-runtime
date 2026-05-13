import fs from 'fs';
import path from 'path';
import os from 'os';
import { RuntimeResolver } from './runtimeResolver.js';

// Runtime Logs Binding
// Safe Read-Only Observability Layer

export class RuntimeLogs {
  static async getLogs(runtime_id: string, linesCount: number = 100) {
    const context = await RuntimeResolver.resolveRuntime(runtime_id);
    
    // Determine the log path. Priority: context.logs_path, then fallback to ~/.pm2/logs
    let targetLogPath = context.logs_path;
    
    if (!targetLogPath && context.pm2_name) {
       const homedir = os.homedir();
       // Assuming standard pm2 log naming format
       targetLogPath = path.join(homedir, '.pm2', 'logs', `${context.pm2_name}-out.log`);
    }

    if (!targetLogPath) {
      throw new Error(`Runtime Logs NOT FOUND for ID: ${runtime_id}`);
    }

    if (!fs.existsSync(targetLogPath)) {
      // Return empty instead of error to keep UI functional
      return [{
         id: 'not_found',
         timestamp: new Date().toISOString(),
         level: 'warning',
         source: 'system',
         message: `No log file found at expected path.`
      }];
    }

    // Safety check for file
    const stats = fs.statSync(targetLogPath);
    if (!stats.isFile()) {
      throw new Error(`Target is not a valid log file.`);
    }

    // Safely reads the last segment of the file to prevent huge memory spikes if the file is massive
    const MAX_READ = 200 * 1024; // 200 KB max read
    let fileContent = '';
    
    if (stats.size > MAX_READ) {
      const buffer = Buffer.alloc(MAX_READ);
      const fd = fs.openSync(targetLogPath, 'r');
      fs.readSync(fd, buffer, 0, MAX_READ, stats.size - MAX_READ);
      fs.closeSync(fd);
      fileContent = buffer.toString('utf-8');
    } else {
      fileContent = fs.readFileSync(targetLogPath, 'utf-8');
    }

    const rawLines = fileContent.split('\n').filter(Boolean);
    const lastLines = rawLines.slice(-linesCount);
    
    return lastLines.map((line, index) => {
        let level = 'info';
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('error') || lowerLine.includes('err')) level = 'error';
        else if (lowerLine.includes('warn')) level = 'warning';
        
        return {
           id: `rt_log_${Date.now()}_${index}`,
           timestamp: new Date().toISOString(),
           level,
           source: context.pm2_name || 'runtime',
           message: line
        };
    });
  }
}
