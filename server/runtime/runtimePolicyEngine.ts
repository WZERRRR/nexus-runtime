import { db } from "../db.js";

export enum RuntimeSafetyState {
    SAFE = 'SAFE',
    RESTRICTED = 'RESTRICTED',
    PROTECTED = 'PROTECTED',
    CRITICAL = 'CRITICAL',
    LOCKED = 'LOCKED',
    APPROVAL_REQUIRED = 'APPROVAL_REQUIRED'
}

export interface RuntimePolicyAnalysisRecord {
  runtime_id: string;
  policy_state: RuntimeSafetyState;
  allowed_operations: string; // JSON string
  restricted_operations: string; // JSON string
  risk_level: string;
  recommendations: string;
  created_at: string;
}

export class RuntimePolicyEngine {
    static async getPolicyAnalysis(runtimeId: string): Promise<RuntimePolicyAnalysisRecord[]> {
        return db.prepare('SELECT * FROM runtime_policy_analysis WHERE runtime_id = ?').all(runtimeId) as RuntimePolicyAnalysisRecord[];
    }
}
