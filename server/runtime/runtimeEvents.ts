import { v4 as uuidv4 } from 'uuid';
import { queryDB } from '../database/pool.js';
import { RuntimeResolver } from './runtimeResolver.js';

// Runtime Events Layer
// Read-Only Observation & Timeline Construct

export interface RuntimeEventInput {
  runtime_id: string;
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  source: string;
  message: string;
  metadata?: any;
}

export class RuntimeEvents {
  /**
   * Safe asynchronous event ingestion.
   */
  static async logEvent(input: RuntimeEventInput) {
    try {
      const eventId = uuidv4();
      const metadataStr = input.metadata ? JSON.stringify(input.metadata) : null;
      await queryDB(
        `INSERT INTO runtime_events (id, runtime_id, event_type, severity, source, message, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [eventId, input.runtime_id, input.event_type, input.severity, input.source, input.message, metadataStr]
      );
    } catch (e) {
      console.error('[RuntimeEvents] Failed to log event:', e);
    }
  }

  /**
   * Retrieve timeline for a specific runtime.
   */
  static async getEvents(runtime_id: string, limit: number = 50) {
    try {
      const rows = await queryDB(
        `SELECT * FROM runtime_events WHERE runtime_id = ? ORDER BY created_at DESC LIMIT ?`,
        [runtime_id, limit]
      );
      return rows.map((row: any) => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (e) {
      console.error('[RuntimeEvents] Failed to fetch events:', e);
      return [];
    }
  }

  /**
   * Triggered check to identify potential anomalies without mutating runtime state.
   */
  static async analyzeRuntimeHealth(runtime_id: string, monitoringMetrics: any) {
    if (!monitoringMetrics) return;
    
    // Simulate some event logic (in reality this might be periodic or hooked into monitoring)
    if (monitoringMetrics.cpu?.usage > 90) {
      await this.logEvent({
        runtime_id,
        event_type: 'memory.high',
        severity: 'WARNING',
        source: 'runtime.monitoring',
        message: 'High CPU detected on runtime',
        metadata: { usage: monitoringMetrics.cpu.usage }
      });
    }

    if (monitoringMetrics.memory?.usage > 90) {
      await this.logEvent({
        runtime_id,
        event_type: 'memory.high',
        severity: 'HIGH',
        source: 'runtime.monitoring',
        message: 'Critical RAM usage threshold exceeded',
        metadata: { usage: monitoringMetrics.memory.usage }
      });
    }

    if (monitoringMetrics.pm2 && monitoringMetrics.pm2.status !== 'online') {
      await this.logEvent({
        runtime_id,
        event_type: 'pm2.unstable',
        severity: 'CRITICAL',
        source: 'runtime.pm2',
        message: `PM2 process is currently ${monitoringMetrics.pm2.status}`,
        metadata: { status: monitoringMetrics.pm2.status }
      });
    }
  }
}
