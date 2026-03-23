/**
 * Workspace file parsers for the OpenClaw Dashboard.
 * Converts raw markdown files into structured data for visualization.
 */
import type { AgentOutput, AgentStatus, PlanData, PlanItem, LogEntry, MemoryRecord } from '@/types/dashboard'

// ─── Agent definitions ────────────────────────────────────────────────────────

export const AGENT_DEFINITIONS = [
  { agentId: 'coordinator',  displayName: 'Coordinator',   emoji: '🎯' },
  { agentId: 'sales_lead',   displayName: 'Sales Lead',    emoji: '💼' },
  { agentId: 'supply_lead',  displayName: 'Supply Lead',   emoji: '🔗' },
  { agentId: 'ops_lead',     displayName: 'Ops Lead',      emoji: '⚙️' },
  { agentId: 'finance_lead', displayName: 'Finance Lead',  emoji: '💰' },
  { agentId: 'hr_trainer',   displayName: 'HR Trainer',    emoji: '👥' },
]

// ─── Status mapping ───────────────────────────────────────────────────────────

const STATUS_KEYWORDS: Array<[string, AgentStatus]> = [
  ['已完成', 'completed'],
  ['完成', 'completed'],
  ['进行中', 'in_progress'],
  ['排产中', 'in_progress'],
  ['采购中', 'in_progress'],
  ['处理中', 'in_progress'],
  ['运行中', 'in_progress'],
  ['执行中', 'in_progress'],
  ['异常', 'error'],
  ['失败', 'error'],
  ['错误', 'error'],
]

function extractStatus(text: string): { status: AgentStatus; statusText: string } {
  for (const [keyword, status] of STATUS_KEYWORDS) {
    if (text.includes(keyword)) {
      return { status, statusText: text.trim().split('\n')[0].substring(0, 80) }
    }
  }
  return { status: 'idle', statusText: text.trim().split('\n')[0].substring(0, 80) || '待命' }
}

// ─── Field parser ─────────────────────────────────────────────────────────────

function parseFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const lines = text.split('\n')
  for (const line of lines) {
    // Match: "- key: value", "- **key**: value", "key: value", "| key | value |"
    const m = line.match(/^[-\s*]*\*{0,2}([^:*|]+?)\*{0,2}\s*[:：]\s*(.+)$/)
    if (m) {
      const key = m[1].trim().replace(/^[-\s]+/, '')
      const val = m[2].trim()
      if (key && val && key.length < 30 && !key.startsWith('#')) {
        fields[key] = val
      }
    }
  }
  return fields
}

// ─── status.md parser ─────────────────────────────────────────────────────────

export function parseStatusMd(content: string): AgentOutput[] {
  const results: AgentOutput[] = []
  const foundIds = new Set<string>()

  // Two-pass approach to avoid the gm-flag + lazy-quantifier + $ bug:
  // Pass 1: find all header positions with their captured groups.
  // Pass 2: slice body text between consecutive headers.
  const headerRegex = /^\[([^\]]+)\]\s*状态[：:]\s*([^\n]*)/gm
  const headers: Array<{ index: number; headerEnd: number; agentName: string; statusLine: string }> = []

  let m: RegExpExecArray | null
  while ((m = headerRegex.exec(content)) !== null) {
    headers.push({
      index: m.index,
      headerEnd: m.index + m[0].length,
      agentName: m[1].trim(),
      statusLine: m[2].trim(),
    })
  }

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]
    // Body: everything from end of the header line to start of the next block
    const bodyEnd = headers[i + 1]?.index ?? content.length
    const bodyText = content.slice(h.headerEnd, bodyEnd).trim()
    const agentName = h.agentName

    // Find matching agent definition (by id, display name, or partial match)
    const agentDef = AGENT_DEFINITIONS.find(
      a =>
        a.agentId === agentName.toLowerCase() ||
        a.displayName.toLowerCase() === agentName.toLowerCase() ||
        agentName.toLowerCase().includes(a.agentId) ||
        a.agentId.includes(agentName.toLowerCase())
    ) ?? {
      agentId: agentName.toLowerCase().replace(/[\s-]+/g, '_'),
      displayName: agentName,
      emoji: '🤖',
    }

    const { status, statusText } = extractStatus(h.statusLine)
    const fields = parseFields(bodyText)

    foundIds.add(agentDef.agentId)
    results.push({
      agentId: agentDef.agentId,
      displayName: agentDef.displayName,
      emoji: agentDef.emoji,
      status,
      statusText,
      fields,
      rawText: `${h.statusLine}\n${bodyText}`.trim(),
      formatError: false,
    })
  }

  // If no agent blocks found but file has content → coordinator raw display
  if (results.length === 0 && content.trim().length > 30) {
    const coord = AGENT_DEFINITIONS[0]
    results.push({
      agentId: coord.agentId,
      displayName: coord.displayName,
      emoji: coord.emoji,
      status: 'idle',
      statusText: '格式异常',
      fields: {},
      rawText: content.substring(0, 800),
      formatError: true,
    })
    foundIds.add('coordinator')
  }

  // Fill in missing agents as idle
  for (const agentDef of AGENT_DEFINITIONS) {
    if (!foundIds.has(agentDef.agentId)) {
      results.push({
        agentId: agentDef.agentId,
        displayName: agentDef.displayName,
        emoji: agentDef.emoji,
        status: 'idle',
        statusText: '待命',
        fields: {},
        rawText: '',
        formatError: false,
      })
    }
  }

  // Sort to match AGENT_DEFINITIONS order
  return results.sort((a, b) => {
    const ai = AGENT_DEFINITIONS.findIndex(d => d.agentId === a.agentId)
    const bi = AGENT_DEFINITIONS.findIndex(d => d.agentId === b.agentId)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

// ─── plan.md parser ───────────────────────────────────────────────────────────

export function parsePlanMd(content: string): PlanData {
  const items: PlanItem[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    // Match "1. [x] text" or "- [x] text"
    const m = line.match(/^\s*(?:\d+\.|[-*])\s*\[([x\s])\]\s*(.+)$/i)
    if (m) {
      items.push({
        text: m[2].trim(),
        completed: m[1].toLowerCase() === 'x',
        index: items.length,
      })
    }
  }

  const completedCount = items.filter(i => i.completed).length
  const totalCount = items.length
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return { items, completedCount, totalCount, percentComplete, rawText: content }
}

// ─── log.md parser ────────────────────────────────────────────────────────────

export function parseLogMd(content: string): LogEntry[] {
  const entries: LogEntry[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    // Skip headers, empty lines, and placeholder text
    if (!trimmed || trimmed.startsWith('#') || trimmed === '（暂无日志记录）') continue

    const levelMatch = trimmed.match(/^\[?(ERROR|WARN(?:ING)?|INFO|DEBUG)\]?\s*(.*)$/i)
    if (levelMatch) {
      const rawLevel = levelMatch[1].toUpperCase()
      const level = (rawLevel === 'WARNING' ? 'WARN' : rawLevel) as LogEntry['level']
      entries.push({ level, message: levelMatch[2].trim(), rawLine: line })
    } else if (trimmed.length > 0) {
      entries.push({ level: 'UNKNOWN', message: trimmed, rawLine: line })
    }
  }

  return entries
}

// ─── MEMORY.md parser ─────────────────────────────────────────────────────────

export function parseMemoryMd(content: string): MemoryRecord[] {
  const records: MemoryRecord[] = []

  // Split on ## headings (level 2)
  const sections = content.split(/(?=^##\s)/m)

  for (const section of sections) {
    const lines = section.split('\n')
    const titleLine = lines[0].trim()

    if (!titleLine.startsWith('##')) continue

    const title = titleLine.replace(/^##\s*/, '').trim()
    const body = lines.slice(1).join('\n').trim()

    if (title) {
      records.push({ title, content: body, rawText: section })
    }
  }

  return records
}
