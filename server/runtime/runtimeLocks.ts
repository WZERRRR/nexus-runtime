import { db } from "../db.js";

export enum LockType {
  PROTECTED_RUNTIME = 'PROTECTED_RUNTIME',
  READONLY_RUNTIME = 'READONLY_RUNTIME',
  CRITICAL_RUNTIME = 'CRITICAL_RUNTIME',
  DEPLOY_LOCK = 'DEPLOY_LOCK',
  SSH_LOCK = 'SSH_LOCK',
  MUTATION_LOCK = 'MUTATION_LOCK',
  MAINTENANCE_LOCK = 'MAINTENANCE_LOCK'
}

export enum LockStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  PROTECTED = 'PROTECTED',
  CRITICAL = 'CRITICAL',
  RESTRICTED = 'RESTRICTED'
}

export interface RuntimeLockRecord {
  lock_id: string;
  runtime_id: string;
  lock_type: LockType;
  lock_reason: string;
  protection_level: string;
  lock_status: LockStatus;
  risk_level: string;
  created_by: string;
  created_at: string;
}

export class RuntimeLocks {
    static async getLocks(runtimeId: string): Promise<RuntimeLockRecord[]> {
        return db.prepare('SELECT * FROM runtime_locks WHERE runtime_id = ?').all(runtimeId) as RuntimeLockRecord[];
    }
}
