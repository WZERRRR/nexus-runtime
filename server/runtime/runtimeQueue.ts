
export enum QueueTaskType {
  ACTION = 'ACTION',
  DEPLOY = 'DEPLOY',
  APPROVAL = 'APPROVAL'
}

export interface QueueTask {
  id: string;
  type: QueueTaskType;
  payload: any;
}

// Simple in-memory task orchestrator to prevent race conditions
class RuntimeQueue {
  private queue: QueueTask[] = [];

  addTask(task: QueueTask) {
    this.queue.push(task);
  }

  getNextTask(): QueueTask | undefined {
    return this.queue.shift();
  }
}

export const runtimeQueue = new RuntimeQueue();
