import { EventEmitter } from 'events';

// Architectural foundation for real-time streaming infrastructure.
// NOT ACTIVATED FOR STREAMING YET.
class RuntimeRealtime extends EventEmitter {
  static instance: RuntimeRealtime;

  static getInstance() {
    if (!this.instance) {
      this.instance = new RuntimeRealtime();
    }
    return this.instance;
  }

  broadcast(event: string, data: any) {
    this.emit('broadcast', { event, data });
  }
}

export const runtimeRealtime = RuntimeRealtime.getInstance();
