import { db } from "../db.js";

export enum RecoveryStatus {
  PENDING = 'PENDING',
  VALIDATING = 'VALIDATING',
  READY = 'READY',
  RECOVERY_PREPARED = 'RECOVERY_PREPARED',
  BLOCKED = 'BLOCKED',
  FAILED = 'FAILED',
  PROTECTED = 'PROTECTED'
}

export interface RuntimeRecoveryRecord {
  recovery_id: string;
  runtime_id: string;
  snapshot_id: string;
  recovery_type: string;
  recovery_status: RecoveryStatus;
  risk_level: string;
  requested_by: string;
  created_at: string;
}

export class RuntimeRecovery {
    static async getRecoveries(runtimeId: string): Promise<RuntimeRecoveryRecord[]> {
        return db.prepare('SELECT * FROM runtime_recovery WHERE runtime_id = ?').all(runtimeId) as RuntimeRecoveryRecord[];
    }
}
