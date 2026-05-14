import { db } from "../db.js";
import { createHash } from "crypto";

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum OperationType {
  RUNTIME_RESTART = 'runtime_restart',
  RUNTIME_DEPLOY = 'runtime_deploy',
  RUNTIME_SSH = 'runtime_ssh_access',
  FILESYSTEM_WRITE = 'filesystem_write',
  PM2_MUTATION = 'pm2_mutation',
  PRODUCTION_MUTATION = 'production_mutation',
  RUNTIME_RECOVERY = 'runtime_recovery'
}

export interface RuntimeApprovalRecord {
  id: string;
  runtime_id: string;
  operation_type: OperationType;
  requested_by: string;
  approval_status: ApprovalStatus;
  risk_level: string;
  approval_reason: string;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  stage_index?: number;
  total_stages?: number;
  required_role?: string;
  sla_minutes?: number;
  expires_at?: string;
  chain_status?: string;
}

export class RuntimeApproval {
    static async getApprovals(runtimeId: string): Promise<RuntimeApprovalRecord[]> {
        return db.prepare('SELECT * FROM runtime_approvals WHERE runtime_id = ?').all(runtimeId) as RuntimeApprovalRecord[];
    }

    static async requestApproval(record: {
        runtime_id: string;
        operation_type: OperationType;
        requested_by: string;
        risk_level: string;
        approval_reason: string;
        stage_index?: number;
        total_stages?: number;
        required_role?: string;
        sla_minutes?: number;
        expires_at?: string;
        chain_status?: string;
    }): Promise<string> {
        const seed = `${record.runtime_id}:${record.operation_type}:${record.requested_by}:${Date.now()}`;
        const id = `APPR-${createHash('sha1').update(seed).digest('hex').slice(0, 10).toUpperCase()}`;
        const stmt = db.prepare(`
            INSERT INTO runtime_approvals (
              id, runtime_id, operation_type, requested_by, approval_status, risk_level, approval_reason,
              stage_index, total_stages, required_role, sla_minutes, expires_at, chain_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          id,
          record.runtime_id,
          record.operation_type,
          record.requested_by,
          ApprovalStatus.PENDING,
          record.risk_level,
          record.approval_reason,
          record.stage_index ?? 1,
          record.total_stages ?? 1,
          record.required_role ?? 'Admin',
          record.sla_minutes ?? 60,
          record.expires_at || null,
          record.chain_status ?? 'PENDING_STAGE'
        );
        return id;
    }

    static async updateApproval(id: string, status: ApprovalStatus, reviewedBy: string, reason: string): Promise<void> {
        db.prepare(`
            UPDATE runtime_approvals
            SET approval_status = ?, reviewed_by = ?, approval_reason = ?, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(status, reviewedBy, reason, id);
    }
}
