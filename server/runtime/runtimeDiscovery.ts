// Runtime Discovery
// Discovers project runtimes on the server without modifying anything

export class RuntimeDiscovery {
  static async discover(params: { host: string, port: number, user: string }) {
    // Read + Analyze + Register logic
    // Uses SSH to find package.json, ecosystem.config.js, pm2 process, etc.
    return [];
  }
}
