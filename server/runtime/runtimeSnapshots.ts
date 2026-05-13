import { db } from "../db.js";

export enum SnapshotType {
  PRE_DEPLOY = 'PRE_DEPLOY',
  PRE_RECOVERY = 'PRE_RECOVERY',
  SAFE_STATE = 'SAFE_STATE',
  PROTECTED_STATE = 'PROTECTED_STATE',
  MANUAL_SNAPSHOT = 'MANUAL_SNAPSHOT'
}

export interface RuntimeSnapshotRecord {
  snapshot_id: string;
  runtime_id: string;
  snapshot_type: SnapshotType;
  runtime_state: string;
  pm2_state: string;
  environment_state: string;
  policy_state: string;
  created_by: string;
  created_at: string;
}

export class RuntimeSnapshots {
    static async getSnapshots(runtimeId: string): Promise<RuntimeSnapshotRecord[]> {
        return db.prepare('SELECT * FROM runtime_snapshots WHERE runtime_id = ?').all(runtimeId) as RuntimeSnapshotRecord[];
    }
}
