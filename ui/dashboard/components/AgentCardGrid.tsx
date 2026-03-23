'use client'

import { useDashboard } from './DashboardProvider'
import { AgentCard } from './AgentCard'

export function AgentCardGrid() {
  const { workspaceData, systemData } = useDashboard()
  const agents = workspaceData?.parsed?.agents ?? []
  const sessions = systemData?.agents ?? []

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Agent 输出</h3>
      {agents.length === 0 ? (
        <div className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-lg">
          等待 Agent 数据…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => {
            const session = sessions.find(s => s.id === agent.agentId)
            return <AgentCard key={agent.agentId} agent={agent} session={session} />
          })}
        </div>
      )}
    </div>
  )
}
