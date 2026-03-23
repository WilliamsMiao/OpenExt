'use client'

import { useDashboard } from './DashboardProvider'
import type { AgentOutput } from '@/types/dashboard'

// Status dot styles
const DOT: Record<string, { indicator: string; color: string }> = {
  idle:        { indicator: '○', color: 'text-gray-400' },
  in_progress: { indicator: '◐', color: 'text-blue-500' },
  completed:   { indicator: '●', color: 'text-emerald-500' },
  error:       { indicator: '✗', color: 'text-red-500' },
}

// Node border/bg by status
const NODE_STYLE: Record<string, string> = {
  idle:        'border-gray-300 bg-gray-50',
  in_progress: 'border-blue-400 bg-blue-50',
  completed:   'border-emerald-400 bg-emerald-50',
  error:       'border-red-400 bg-red-50',
}

const SUB_AGENT_IDS = ['sales_lead', 'supply_lead', 'ops_lead', 'finance_lead', 'hr_trainer']

function AgentNode({
  agent,
  size = 'sm',
}: {
  agent: AgentOutput
  size?: 'sm' | 'md'
}) {
  const dot = DOT[agent.status] ?? DOT.idle
  const nodeStyle = NODE_STYLE[agent.status] ?? NODE_STYLE.idle
  const pad = size === 'md' ? 'px-5 py-3' : 'px-3 py-2'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${pad} rounded-lg border-2 text-center select-none ${nodeStyle}`}>
        <div className="text-xl leading-none">{agent.emoji}</div>
        <div className="text-xs font-medium text-gray-700 mt-1 whitespace-nowrap">
          {agent.displayName}
        </div>
      </div>
      <div className={`text-xs flex items-center gap-0.5 ${dot.color}`}>
        <span>{dot.indicator}</span>
        <span className="max-w-[80px] truncate">{agent.statusText || '待命'}</span>
      </div>
    </div>
  )
}

export function WorkflowGraph() {
  const { workspaceData } = useDashboard()
  const agents = workspaceData?.parsed?.agents ?? []

  const coordinator = agents.find(a => a.agentId === 'coordinator')
  const subAgents = SUB_AGENT_IDS
    .map(id => agents.find(a => a.agentId === id))
    .filter((a): a is AgentOutput => Boolean(a))

  const activeCount = subAgents.filter(a => a.status !== 'idle').length

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">工作流图</h3>
        {activeCount > 0 && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {activeCount} Agent 活跃中
          </span>
        )}
      </div>

      {/* Coordinator node */}
      <div className="flex justify-center mb-1">
        {coordinator ? (
          <AgentNode agent={coordinator} size="md" />
        ) : (
          <div className="px-5 py-3 rounded-lg border-2 border-gray-300 bg-gray-50 text-center opacity-50">
            <div className="text-xl">🎯</div>
            <div className="text-xs font-medium text-gray-600 mt-1">Coordinator</div>
          </div>
        )}
      </div>

      {/* Vertical connector to horizontal bar */}
      <div className="flex justify-center mb-1">
        <div className="w-px h-4 bg-gray-300" />
      </div>

      {/* Horizontal connector bar */}
      {subAgents.length > 1 && (
        <div className="flex justify-center mb-1">
          <div
            className="h-px bg-gray-300"
            style={{ width: `${Math.min(subAgents.length - 1, 4) * 17}%` }}
          />
        </div>
      )}

      {/* Vertical drops to each sub-agent */}
      {subAgents.length > 0 && (
        <div className="flex justify-center gap-6 mb-1">
          {subAgents.map(agent => (
            <div key={`drop-${agent.agentId}`} className="w-px h-3 bg-gray-300" />
          ))}
        </div>
      )}

      {/* Sub-agent nodes */}
      <div className="flex justify-center gap-4 flex-wrap">
        {subAgents.map(agent => (
          <AgentNode key={agent.agentId} agent={agent} />
        ))}
      </div>
    </div>
  )
}
