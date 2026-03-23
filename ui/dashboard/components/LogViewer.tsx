'use client'

import { useState } from 'react'
import { useDashboard } from './DashboardProvider'
import type { LogEntry } from '@/types/dashboard'

type Level = 'ALL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'

const LEVEL_STYLE: Record<string, string> = {
  ERROR:   'text-red-700 bg-red-50 border-red-200',
  WARN:    'text-yellow-700 bg-yellow-50 border-yellow-200',
  INFO:    'text-blue-700 bg-blue-50 border-blue-200',
  DEBUG:   'text-gray-600 bg-gray-50 border-gray-200',
  UNKNOWN: 'text-gray-500 bg-gray-50 border-gray-100',
}

const LEVELS: Level[] = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG']

export function LogViewer() {
  const { workspaceData } = useDashboard()
  const [filter, setFilter] = useState<Level>('ALL')

  const logs: LogEntry[] = workspaceData?.parsed?.logs ?? []
  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.level === filter)

  const countFor = (level: Level) =>
    level === 'ALL' ? logs.length : logs.filter(l => l.level === level).length

  return (
    <div className="space-y-3">
      {/* Level filter buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {LEVELS.map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-2.5 py-0.5 rounded text-xs border transition-colors ${
              filter === level
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {level}
            <span className={`ml-1 ${filter === level ? 'text-gray-300' : 'text-gray-400'}`}>
              ({countFor(level)})
            </span>
          </button>
        ))}
      </div>

      {/* Log list */}
      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-400 py-6 text-center">
            {logs.length === 0 ? '暂无日志记录' : `无 ${filter} 级别日志`}
          </div>
        ) : (
          filtered.map((entry, i) => (
            <div
              key={i}
              className={`flex gap-2 px-2.5 py-1.5 rounded border text-xs font-mono ${
                LEVEL_STYLE[entry.level] ?? LEVEL_STYLE.UNKNOWN
              }`}
            >
              <span className="font-bold flex-shrink-0">[{entry.level}]</span>
              {entry.timestamp && (
                <span className="text-gray-400 flex-shrink-0">{entry.timestamp}</span>
              )}
              <span className="break-all">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
