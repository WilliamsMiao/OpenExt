'use client'

import { useDashboard } from './DashboardProvider'

export function MemoryTimeline() {
  const { workspaceData } = useDashboard()
  const records = workspaceData?.parsed?.memory ?? []

  if (records.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-6 text-center">暂无记忆记录</div>
    )
  }

  return (
    <div className="space-y-0">
      {records.map((record, i) => (
        <div key={i} className="relative pl-7 pb-5">
          {/* Vertical timeline line */}
          {i < records.length - 1 && (
            <div className="absolute left-3 top-5 bottom-0 w-px bg-gray-200" />
          )}

          {/* Timeline dot */}
          <div className="absolute left-1 top-1.5 w-4 h-4 rounded-full border-2 border-blue-400 bg-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          </div>

          {/* Card content */}
          <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
            <div className="font-medium text-sm text-gray-800 mb-1.5">{record.title}</div>
            {record.content && (
              <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                {record.content}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
