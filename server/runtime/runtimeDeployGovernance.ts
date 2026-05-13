import { db } from "../db.js";

export enum DeployStatus {
  PENDING = 'PENDING',
  VALIDATING = 'VALIDATING',
  APPROVED = 'APPROVED',
  DEPLOYING = 'DEPLOYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
  BLOCKED = 'BLOCKED'
}

export enum DeployStrategy {
  SAFE_DEPLOY = 'SAFE_DEPLOY',
  CONTROLLED_DEPLOY = 'CONTROLLED_DEPLOY',
  PROTECTED_DEPLOY = 'PROTECTED_DEPLOY',
  MAINTENANCE_DEPLOY = 'MAINTENANCE_DEPLOY',
  ROLLBACK_DEPLOY = 'ROLLBACK_DEPLOY'
}

export interface RuntimeDeployRecord {
  runtime_id: string;
  deployment_id: string;
  requested_by: string;
  approval_id?: string;
  snapshot_id?: string;
  deploy_status: DeployStatus;
  risk_level: string;
  deploy_strategy: DeployStrategy;
  created_at: string;
  executed_at?: string;
}

export class RuntimeDeploy {
    static async getDeployments(runtimeId: string): Promise<RuntimeDeployRecord[]> {
        return db.prepare('SELECT * FROM runtime_deployments WHERE runtime_id = ?').all(runtimeId) as RuntimeDeployRecord[];
    }

    static async requestDeploy(record: {
        runtime_id: string;
        deployment_id: string;
        requested_by: string;
        approval_id?: string;
        snapshot_id?: string;
        risk_level: string;
        deploy_strategy: DeployStrategy;
    }): Promise<void> {
        const stmt = db.prepare(`
            INSERT INTO runtime_deployments (runtime_id, deployment_id, requested_by, approval_id, snapshot_id, deploy_status, risk_level, deploy_strategy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(record.runtime_id, record.deployment_id, record.requested_by, record.approval_id || null, record.snapshot_id || null, DeployStatus.PENDING, record.risk_level, record.deploy_strategy);
    }
}
