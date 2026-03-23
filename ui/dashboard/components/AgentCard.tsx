import type { AgentOutput, AgentSessionInfo } from '@/types/dashboard'
import { StatusBadge } from './StatusBadge'
import { TokenUsageBar } from './TokenUsageBar'

interface AgentCardProps {
  agent: AgentOutput
  session?: AgentSessionInfo
}

const CARD_STYLE: Record<string, string> = {
  idle:        'border-gray-200 bg-white',
  in_progress: 'border-blue-200 bg-blue-50/40',
  completed:   'border-emerald-200 bg-emerald-50/40',
  error:       'border-red-200 bg-red-50/40',
}

export function AgentCard({ agent, session }: AgentCardProps) {
  const cardStyle = CARD_STYLE[agent.status] ?? CARD_STYLE.idle
  const fieldEntries = Object.entries(agent.fields)

  return (
    <div className={`border rounded-lg p-4 space-y-3 transition-all shadow-sm ${cardStyle}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{agent.emoji}</span>
          <div>
            <div className="font-semibold text-gray-800 text-sm">{agent.displayName}</div>
            <div className="text-xs text-gray-400 font-mono">{agent.agentId}</div>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Status text (only when not generic) */}
      {agent.statusText && agent.statusText !== '待命' && agent.statusText !== '格式异常' && (
        <div className="text-xs text-gray-600 bg-white/70 rounded px-2 py-1 border border-gray-100">
          {agent.statusText}
        </div>
      )}

      {/* Format error warning */}
      {agent.formatError && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 flex items-center gap-1.5">
          <span>⚠️</span>
          <span>格式异常 — 无法解析结构化数据</span>
        </div>
      )}

      {/* Structured fields */}
      {fieldEntries.length > 0 && (
        <div className="space-y-1.5">
          {fieldEntries.slice(0, 6).map(([key, val]) => (
            <div key={key} className="flex items-baseline gap-2 text-xs">
              <span className="text-gray-400 flex-shrink-0 min-w-0">{key}</span>
              <span className="text-gray-800 font-medium truncate">{val}</span>
            </div>
          ))}
          {fieldEntries.length > 6 && (
            <div className="text-xs text-gray-400">+{fieldEntries.length - 6} 个字段</div>
          )}
        </div>
      )}

      {/* Raw text collapsible for format errors */}
      {agent.formatError && agent.rawText && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">
            查看原始内容
          </summary>
          <pre className="mt-1.5 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32 whitespace-pre-wrap text-gray-600 font-mono">
            {agent.rawText}
          </pre>
        </details>
      )}

      {/* Token usage */}
      {session && (
        <div className="pt-2 border-t border-gray-100">
          <TokenUsageBar
            inputTokens={session.inputTokens}
            outputTokens={session.outputTokens}
            percentUsed={session.percentUsed}
          />
          {session.lastActiveMinutesAgo < 120 && (
            <div className="text-xs text-gray-400 mt-1">
              最近活跃: {session.lastActiveMinutesAgo} 分钟前
            </div>
          )}
        </div>
      )}
    </div>
  )
}
