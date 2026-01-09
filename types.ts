
export enum AgentStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  SEARCHING = 'SEARCHING',
  EVOLVING = 'EVOLVING',
  LEVEL_UP = 'LEVEL_UP'
}

export interface AgentToken {
  id: string;
  emoji: string;
  name: string;
  level: number;
  trait: string;
  history: Message[];
  status: AgentStatus;
  position: { x: number; y: number };
}

export interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  sources?: Array<{ title: string; uri: string }>;
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  timestamp: number;
}
