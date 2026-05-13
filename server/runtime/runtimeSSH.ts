import { db } from "../db.js";

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  READONLY = 'READONLY',
  PROTECTED = 'PROTECTED',
  RESTRICTED = 'RESTRICTED',
  APPROVAL_PENDING = 'APPROVAL_PENDING',
  TERMINATED = 'TERMINATED'
}

export enum AccessLevel {
  READONLY = 'READONLY',
  INSPECT = 'INSPECT',
  PROTECTED = 'PROTECTED',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED'
}

export interface RuntimeSSHSessionRecord {
  session_id: string;
  runtime_id: string;
  created_by: string;
  session_status: SessionStatus;
  access_level: AccessLevel;
  started_at: string;
  ended_at?: string;
}

export class RuntimeSSH {
    static async getSessions(runtimeId: string): Promise<RuntimeSSHSessionRecord[]> {
        return db.prepare('SELECT * FROM runtime_ssh_sessions WHERE runtime_id = ?').all(runtimeId) as RuntimeSSHSessionRecord[];
    }

    static safeCommandFilter(command: string): boolean {
        const allowedCommands = ['pwd', 'ls', 'cat', 'tail', 'df', 'free', 'pm2'];
        const baseCommand = command.split(' ')[0];
        return allowedCommands.includes(baseCommand);
    }
}
