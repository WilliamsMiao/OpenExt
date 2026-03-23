'use client'

import { useDashboard } from './DashboardProvider'

export function PlanViewer() {
  const { workspaceData } = useDashboard()
  const plan = workspaceData?.parsed?.plan

  if (!plan) {
    return <div className="text-sm text-gray-400 py-4 text-center">加载中…</div>
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {plan.totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">执行进度</span>
            <span className="text-gray-500">
              {plan.completedCount} / {plan.totalCount} — {plan.percentComplete}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${plan.percentComplete}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist */}
      {plan.items.length > 0 ? (
        <div className="space-y-2">
          {plan.items.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 text-sm ${
                item.completed ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              <span
                className={`mt-0.5 flex-shrink-0 text-base leading-none ${
                  item.completed ? 'text-emerald-500' : 'text-gray-300'
                }`}
              >
                {item.completed ? '✓' : '○'}
              </span>
              <span className={item.completed ? 'line-through' : ''}>{item.text}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Fallback: show raw content when no structured checklist found */
        <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border overflow-auto max-h-72 whitespace-pre-wrap">
          {plan.rawText || '暂无计划内容'}
        </pre>
      )}
    </div>
  )
}
