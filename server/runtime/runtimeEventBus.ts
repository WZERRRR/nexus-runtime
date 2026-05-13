import { EventEmitter } from 'events';

class RuntimeEventBus extends EventEmitter {
  static instance: RuntimeEventBus;

  static getInstance() {
    if (!this.instance) {
      this.instance = new RuntimeEventBus();
    }
    return this.instance;
  }

  // Event types
  static EVENTS = {
    RUNTIME_STATE_CHANGED: 'RUNTIME_STATE_CHANGED',
    ACTION_EXECUTED: 'ACTION_EXECUTED',
    DEPLOYMENT_CREATED: 'DEPLOYMENT_CREATED',
  };
}

export const runtimeEventBus = RuntimeEventBus.getInstance();
