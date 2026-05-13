import { db } from "../db.js";

export enum GovernancePolicyType {
   PROTECTED = 'PROTECTED',
   READONLY = 'READONLY',
   RESTRICTED = 'RESTRICTED',
   MAINTENANCE = 'MAINTENANCE',
   APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
   CRITICAL_RUNTIME = 'CRITICAL_RUNTIME'
}

export enum EnforcementLevel {
    INFO = 'INFO',
    ENFORCED = 'ENFORCED',
    STRICT = 'STRICT',
    CRITICAL = 'CRITICAL'
}

export interface RuntimeGovernanceRecord {
  runtime_id: string;
  policy_type: GovernancePolicyType;
  policy_value: string;
  enforcement_level: EnforcementLevel;
  created_at: string;
}

export class RuntimeGovernance {
    static async getGovernance(runtimeId: string): Promise<RuntimeGovernanceRecord[]> {
        return db.prepare('SELECT * FROM runtime_governance WHERE runtime_id = ?').all(runtimeId) as RuntimeGovernanceRecord[];
    }
}
