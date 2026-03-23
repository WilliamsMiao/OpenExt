import type { AgentStatus } from '@/types/dashboard'

interface StatusBadgeProps {
  status: AgentStatus
}

const CONFIG: Record<AgentStatus, { label: string; dot: string; className: string }> = {
  idle:        { label: '待命',   dot: '○', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  in_progress: { label: '进行中', dot: '◐', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed:   { label: '已完成', dot: '●', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  error:       { label: '异常',   dot: '✗', className: 'bg-red-100 text-red-700 border-red-200' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = CONFIG[status] ?? CONFIG.idle
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${c.className}`}
    >
      <span>{c.dot}</span>
      <span>{c.label}</span>
    </span>
  )
}
