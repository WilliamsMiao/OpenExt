'use client'

import { useState } from 'react'
import { useDashboard } from './DashboardProvider'

export function TaskInput() {
  const [open, setOpen] = useState(false)
  const [task, setTask] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const { refresh } = useDashboard()

  const handleSubmit = async () => {
    if (!task.trim() || submitting) return
    setSubmitting(true)
    setMsg(null)
    try {
      const res = await fetch('/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ text: '✅ 任务已提交，等待 Coordinator 处理…', ok: true })
        setTask('')
        // Refresh dashboard data after a short delay to pick up new files
        setTimeout(() => refresh(), 800)
      } else {
        setMsg({ text: `❌ ${data.error ?? '提交失败'}`, ok: false })
      }
    } catch {
      setMsg({ text: '❌ 网络错误，请重试', ok: false })
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Collapsible header */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        onClick={() => setOpen(o => !o)}
      >
        <span>📝 向 Coordinator 提交新任务</span>
        <span className="text-gray-400 text-xs">{open ? '▲ 收起' : '▼ 展开'}</span>
      </button>

      {open && (
        <div className="p-4 bg-white space-y-3 border-t border-gray-100">
          <textarea
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述任务需求，例如：1000件收纳箱询盘，预算 10k USD，交期 20 天…"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Ctrl + Enter 提交</span>
            <div className="flex items-center gap-3">
              {msg && (
                <span className={`text-xs ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                  {msg.text}
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting || !task.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-medium"
              >
                {submitting ? '提交中…' : '提交任务'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
