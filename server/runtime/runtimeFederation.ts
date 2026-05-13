import { db } from "../db.js";

export interface RuntimeFederationRecord {
  runtime_id: string;
  cluster_name: string;
  node_group: string;
  federation_status: string;
  last_sync_at: string;
}

export class RuntimeFederation {
    static async getFederatedRuntimes(): Promise<RuntimeFederationRecord[]> {
        return db.prepare('SELECT * FROM runtime_federation').all() as RuntimeFederationRecord[];
    }
}
