import { db } from "../db.js";

export enum ActionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED'
}

export enum SafeActionType {
  RESTART = 'safe_restart',
  RELOAD = 'safe_reload',
  MAINTENANCE = 'maintenance_mode',
  LOCK = 'runtime_lock'
}

export interface RuntimeActionRecord {
  runtime_id: string;
  action_type: SafeActionType;
  requested_by: string;
  approval_id?: string;
  execution_status: ActionStatus;
  execution_result?: string;
  risk_level: string;
  created_at: string;
  executed_at?: string;
}

export class RuntimeSafeActions {
    static async getActions(runtimeId: string): Promise<RuntimeActionRecord[]> {
        return db.prepare('SELECT * FROM runtime_actions WHERE runtime_id = ?').all(runtimeId) as RuntimeActionRecord[];
    }

    static async requestAction(record: {
        runtime_id: string;
        action_type: SafeActionType;
        requested_by: string;
        approval_id: string;
        risk_level: string;
    }): Promise<void> {
        const stmt = db.prepare(`
            INSERT INTO runtime_actions (runtime_id, action_type, requested_by, approval_id, execution_status, risk_level)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(record.runtime_id, record.action_type, record.requested_by, record.approval_id, ActionStatus.PENDING, record.risk_level);
    }
}
