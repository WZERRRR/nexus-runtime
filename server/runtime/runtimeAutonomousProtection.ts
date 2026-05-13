import { db } from "../db.js";

export interface RuntimeAutonomousAnalysisRecord {
  runtime_id: string;
  forecast_type: string;
  risk_projection: string;
  stability_projection: string;
  recommended_protection_level: string;
  future_risk_score: number;
  created_at: string;
}

export class RuntimeAutonomousProtection {
    static async getAnalysis(runtimeId: string): Promise<RuntimeAutonomousAnalysisRecord[]> {
        return db.prepare('SELECT * FROM runtime_autonomous_analysis WHERE runtime_id = ?').all(runtimeId) as RuntimeAutonomousAnalysisRecord[];
    }
}
