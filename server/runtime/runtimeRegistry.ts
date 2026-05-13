// Runtime Registry
// Source of truth for discovering and registering runtimes

export interface RuntimeEntry {
  id: string;
  project_id: string;
  server_id: string;
  runtime_name: string;
  runtime_path: string;
  runtime_port: number;
  runtime_type: string;
  pm2_name: string;
  environment: string;
  branch: string;
  status: string;
  ssh_host: string;
  ssh_port: number;
  ssh_user: string;
  logs_path: string;
  created_at?: string;
}

export class RuntimeRegistry {
  static async register(runtime: RuntimeEntry) {
    // Basic registration logic
  }

  static async get(id: string): Promise<RuntimeEntry | null> {
    // Fetch from database
    return null;
  }
}
