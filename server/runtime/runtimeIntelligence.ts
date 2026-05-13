import { v4 as uuidv4 } from 'uuid';
import { queryDB } from '../database/pool.js';
import { RuntimeEvents } from './runtimeEvents.js';

// Runtime Intelligence Layer
// Analyze + Recommend (Read-Only Observation)

export class RuntimeIntelligence {
  /**
   * Run an intelligence analysis cycle on a runtime based on events and metrics.
   * This is a read-only process that deduces health and risk scores.
   */
  static async analyzeRuntime(runtime_id: string, currentMetrics: any) {
    try {
      // 1. Fetch recent events
      const recentEvents = await RuntimeEvents.getEvents(runtime_id, 20);
      
      let risk_score = 0;
      let health_score = 100;
      let state = 'STABLE';
      const recommendations: string[] = [];
      const detected_patterns: string[] = [];

      // 2. Analyze PM2 Restarts
      const restartEvents = recentEvents.filter((e: any) => e.event_type === 'pm2.restart' || e.event_type === 'pm2.unstable');
      if (restartEvents.length >= 3) {
        risk_score += 40;
        health_score -= 30;
        detected_patterns.push('Frequent Process Restarts');
        recommendations.push('Frequent PM2 restarts detected. Potential instability observed. Review application code for unhandled exceptions or memory limits.');
      } else if (restartEvents.length > 0) {
        risk_score += 15;
        health_score -= 10;
        detected_patterns.push('Process Restarted');
      }

      // 3. Analyze Memory High events
      const memoryEvents = recentEvents.filter((e: any) => e.event_type === 'memory.high');
      if (memoryEvents.length >= 2) {
        risk_score += 30;
        health_score -= 25;
        detected_patterns.push('Consistent High Memory Usage');
        recommendations.push('High memory usage detected multiple times. Consider reviewing Runtime memory limits or profiling the application for memory leaks.');
      }
      
      // 4. Incorporate live metrics (if available)
      if (currentMetrics) {
        // CPU
        if (currentMetrics.cpu?.usage > 85) {
           risk_score += 20;
           health_score -= 15;
           detected_patterns.push('CPU Throttling Risk');
           recommendations.push('Sustained high CPU usage. Consider horizontal scaling or optimizing compute-heavy tasks.');
        }

        // PM2 live status
        if (currentMetrics.pm2 && currentMetrics.pm2.status !== 'online') {
           risk_score += 60;
           health_score -= 50;
           detected_patterns.push('Runtime Process Offline/Degraded');
           recommendations.push(`PM2 process is currently ${currentMetrics.pm2.status}. Manual inspection may be required.`);
        }
        
        // Disk live status
        if (currentMetrics.disk?.total > 0) {
            const diskUsageRatio = currentMetrics.disk.used / currentMetrics.disk.total;
            if (diskUsageRatio > 0.9) {
                risk_score += 30;
                health_score -= 20;
                detected_patterns.push('Disk Pressure Alert');
                recommendations.push('Disk usage > 90%. Deployment capacity may be affected. Consider freeing up disk space.');
            }
        }
      }

      // 5. Determine overall state
      if (health_score <= 40 || risk_score >= 80) {
         state = 'CRITICAL';
      } else if (health_score <= 70 || risk_score >= 50) {
         state = 'UNSTABLE';
      } else if (health_score <= 85 || risk_score >= 20) {
         state = 'DEGRADED';
      } else {
         state = 'STABLE';
      }

      // Bounds
      health_score = Math.max(0, Math.min(100, health_score));
      risk_score = Math.max(0, Math.min(100, risk_score));

      // 6. Save Analysis to DB
      const analysisId = uuidv4();
      await queryDB(
        `INSERT INTO runtime_analysis (id, runtime_id, health_score, risk_score, state, recommendations, detected_patterns)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [analysisId, runtime_id, health_score, risk_score, state, JSON.stringify(recommendations), JSON.stringify(detected_patterns)]
      );

      return {
        health_score,
        risk_score,
        state,
        recommendations,
        detected_patterns
      };
    } catch (e) {
      console.error('[RuntimeIntelligence] Analysis failed:', e);
      return null;
    }
  }

  /**
   * Get the latest intelligence analysis for a runtime.
   */
  static async getLatestAnalysis(runtime_id: string) {
    try {
      const rows = await queryDB(
        `SELECT * FROM runtime_analysis WHERE runtime_id = ? ORDER BY created_at DESC LIMIT 1`,
        [runtime_id]
      );
      if (rows.length > 0) {
        return {
           ...rows[0],
           recommendations: rows[0].recommendations ? JSON.parse(rows[0].recommendations) : [],
           detected_patterns: rows[0].detected_patterns ? JSON.parse(rows[0].detected_patterns) : []
        };
      }
      return {
         health_score: 100,
         risk_score: 0,
         state: 'STABLE',
         recommendations: [],
         detected_patterns: []
      };
    } catch (e) {
       console.error('[RuntimeIntelligence] Fetch failed:', e);
       return null;
    }
  }
}
