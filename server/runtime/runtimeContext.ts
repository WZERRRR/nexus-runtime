// Runtime Context
// Defines the operational context of a live runtime environment

export interface RuntimeContext {
  runtime_id: string;
  isActive: boolean;
  type: string;
}
