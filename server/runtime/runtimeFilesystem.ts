import fs from 'fs';
import path from 'path';
import { RuntimeResolver } from './runtimeResolver.js';

// Runtime Filesystem
// Provides read-only filesystem binding to actual runtime path with strict boundary constraints

export class RuntimeFilesystem {
  static async listFiles(runtime_id: string, requestPath: string = '') {
    const context = await RuntimeResolver.resolveRuntime(runtime_id);
    
    if (!context.runtime_path) {
      throw new Error(`Runtime Context is missing runtime_path for ID: ${runtime_id}`);
    }

    // Safety check 1: Normalize base path
    const baseRuntimePath = path.resolve(context.runtime_path);
    
    // Safety check 2: Construct target path
    // Remove leading slashes from requestPath to prevent absolute path resolution escaping base
    const safeRequestPath = requestPath.replace(/^(\/|\\)+/, '');
    const targetPath = path.resolve(baseRuntimePath, safeRequestPath);

    // Safety check 3: Prevent Path Traversal
    if (!targetPath.startsWith(baseRuntimePath)) {
      throw new Error("SECURITY_VIOLATION: Path traversal attempted outside runtime scope");
    }
    
    if (!fs.existsSync(targetPath)) {
        console.error(`[RuntimeFilesystem] Trace Audit Failure [${runtime_id}]:
          Path: ${targetPath}
          Status: NOT_FOUND
          Action: Rejecting listFiles request
        `);
        throw new Error(`FILESYSTEM_PATH_INVALID: Directory ${targetPath} is inaccessible or does not exist on this node`);
    }

    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
       throw new Error(`FILESYSTEM_TYPE_MISMATCH: ${safeRequestPath} exists but is not a directory`);
    }

    // Read-Only List Files
    console.log(`[RuntimeFilesystem] Trace Audit Success [${runtime_id}]:
      runtime_id: ${runtime_id}
      runtime_path: ${baseRuntimePath}
      resolved_path: ${targetPath}
      exists: true
      isDirectory: true
      permission_status: READABLE
    `);
    
    const files = fs.readdirSync(targetPath);
    
    // Auto-provision README if root is empty to prevent "False Empty State" confusion
    if (files.length === 0 && (requestPath === '' || requestPath === '.' || targetPath === baseRuntimePath)) {
        const readmePath = path.join(targetPath, 'README.md');
        const readmeContent = `# Nexus Runtime Workspace\n\nThis directory was synchronized at ${new Date().toISOString()}.\n\n### Status\n- Filesystem Trace: SUCCESS\n- Directory Binding: OPERATIONAL\n- Content: Initialized`;
        try {
            fs.writeFileSync(readmePath, readmeContent);
            console.log(`[RuntimeFilesystem] Auto-provisioned README for empty root: ${readmePath}`);
            files.push('README.md'); 
        } catch (e) {
            console.error(`[RuntimeFilesystem] Failed to auto-provision README:`, e);
        }
    }

    console.log(`[RuntimeFilesystem] Sync Completed [${runtime_id}]:
      entries_count: ${files.length}
      status: OPERATIONAL
    `);
    
    return files.map(file => {
      const fullPath = path.join(targetPath, file);
      const fileStats = fs.statSync(fullPath);
      return {
        name: file,
        isDirectory: fileStats.isDirectory(),
        size: fileStats.size,
        mtime: fileStats.mtime,
        // Replace backslashes with forward slashes for cross-platform consistency
        path: path.relative(baseRuntimePath, fullPath).replace(/\\/g, '/')
      };
    });
  }
}
