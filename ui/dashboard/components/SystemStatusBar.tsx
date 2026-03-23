'use client'

import { useDashboard } from './DashboardProvider'

const INDICATOR = {
  live:     { dot: 'bg-emerald-400', label: 'Live',     text: 'text-emerald-400' },
  degraded: { dot: 'bg-yellow-400',  label: 'Degraded', text: 'text-yellow-400' },
  down:     { dot: 'bg-red-400',     label: 'Down',     text: 'text-red-400' },
} as const

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function SystemStatusBar() {
  const { systemData, loading, lastUpdated, refresh } = useDashboard()

  const health = systemData?.health
  const status = health?.status ?? 'down'
  const ind = INDICATOR[status]

  const totalTokens =
    systemData?.agents.reduce((sum, a) => sum + a.inputTokens + a.outputTokens, 0) ?? 0

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 text-white text-sm border-b border-gray-700 flex-wrap">
      {/* Brand */}
      <div className="flex items-center gap-2 font-bold text-base select-none">
        <span>🦀</span>
        <span>OpenClaw</span>
      </div>

      {/* Health indicator */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${ind.dot} ${status === 'live' ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-medium ${ind.text}`}>{ind.label}</span>
      </div>

      {/* Active sessions */}
      <div className="flex items-center gap-1 text-gray-400 text-xs">
        <span>活跃会话:</span>
        <span className="text-white font-medium">{health?.activeSessions ?? 0}</span>
      </div>

      {/* Token total */}
      <div className="flex items-center gap-1 text-gray-400 text-xs">
        <span>Token:</span>
        <span className="text-white font-medium">{formatTokens(totalTokens)}</span>
      </div>

      {/* Spacer */}
      <div className="ml-auto flex items-center gap-3">
        {lastUpdated && (
          <span className="text-gray-500 text-xs hidden sm:block">
            {lastUpdated.toLocaleTimeString('zh-CN')}
          </span>
        )}
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-xs transition-colors"
        >
          {loading ? '刷新中…' : '↻ 刷新'}
        </button>
        <span className="text-gray-500 text-xs">自动 15s</span>
      </div>
    </div>
  )
}
