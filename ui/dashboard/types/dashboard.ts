// Shared TypeScript interfaces for the OpenClaw Dashboard

export type AgentStatus = 'idle' | 'in_progress' | 'completed' | 'error'

export interface AgentOutput {
  agentId: string         // "sales_lead" | "coordinator" | ...
  displayName: string     // "Sales Lead"
  emoji: string           // "💼"
  status: AgentStatus
  statusText: string      // "已完成报价"
  fields: Record<string, string>  // parsed key-value pairs
  rawText: string         // raw block, shown when format is anomalous
  formatError?: boolean   // true when format couldn't be parsed
}

export interface PlanItem {
  text: string
  completed: boolean
  index: number
}

export interface PlanData {
  items: PlanItem[]
  completedCount: number
  totalCount: number
  percentComplete: number
  rawText: string
}

export interface LogEntry {
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'UNKNOWN'
  message: string
  timestamp?: string
  rawLine: string
}

export interface MemoryRecord {
  title: string
  content: string
  rawText: string
}

export interface WorkspaceFile {
  content: string
  mtime: string
}

export interface ParsedData {
  agents: AgentOutput[]
  plan: PlanData
  logs: LogEntry[]
  memory: MemoryRecord[]
}

export interface ParsedWorkspaceData {
  files: Record<string, WorkspaceFile>
  parsed: ParsedData
}

export interface SystemHealth {
  ok: boolean
  status: 'live' | 'degraded' | 'down'
  activeSessions: number
}

export interface AgentSessionInfo {
  id: string
  model: string
  inputTokens: number
  outputTokens: number
  percentUsed: number
  lastActiveMinutesAgo: number
}

export interface SystemData {
  health: SystemHealth
  agents: AgentSessionInfo[]
}
