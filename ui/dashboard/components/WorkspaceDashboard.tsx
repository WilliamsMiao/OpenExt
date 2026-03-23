'use client'

import { useState } from 'react'
import { SystemStatusBar } from './SystemStatusBar'
import { TaskInput } from './TaskInput'
import { WorkflowGraph } from './WorkflowGraph'
import { AgentCardGrid } from './AgentCardGrid'
import { PlanViewer } from './PlanViewer'
import { LogViewer } from './LogViewer'
import { MemoryTimeline } from './MemoryTimeline'
import { useDashboard } from './DashboardProvider'

// ─── Raw files viewer ─────────────────────────────────────────────────────────

function RawFilesViewer() {
  const { workspaceData } = useDashboard()
  const files = workspaceData?.files ?? {}
  const fileNames = Object.keys(files)
  const [selected, setSelected] = useState(fileNames[0] ?? 'goal.md')

  const current = files[selected]

  return (
    <div className="flex gap-4 min-h-0">
      {/* File sidebar */}
      <div className="w-36 flex-shrink-0 space-y-1">
        {fileNames.map(name => (
          <button
            key={name}
            onClick={() => setSelected(name)}
            className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
              selected === name
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="truncate">{name}</div>
            {files[name]?.mtime && (
              <div className="text-gray-400 text-[10px] mt-0.5">
                {new Date(files[name].mtime).toLocaleTimeString('zh-CN')}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* File content */}
      <div className="flex-1 min-w-0">
        {current ? (
          <pre className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border overflow-auto max-h-72 whitespace-pre-wrap font-mono leading-relaxed">
            {current.content}
          </pre>
        ) : (
          <div className="text-sm text-gray-400">选择左侧文件查看内容</div>
        )}
      </div>
    </div>
  )
}

// ─── Bottom tabs ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'plan',   label: '📋 Plan 进度' },
  { id: 'log',    label: '🚨 日志' },
  { id: 'memory', label: '🧠 记忆时间线' },
  { id: 'raw',    label: '📊 原始文件' },
] as const

type TabId = (typeof TABS)[number]['id']

// ─── Main layout ──────────────────────────────────────────────────────────────

export function WorkspaceDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('plan')

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top status bar */}
      <SystemStatusBar />

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 space-y-4">
        {/* Task input (collapsible) */}
        <TaskInput />

        {/* Workflow topology graph */}
        <WorkflowGraph />

        {/* Agent output cards */}
        <AgentCardGrid />

        {/* Bottom tabbed panel */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium bg-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'plan'   && <PlanViewer />}
            {activeTab === 'log'    && <LogViewer />}
            {activeTab === 'memory' && <MemoryTimeline />}
            {activeTab === 'raw'    && <RawFilesViewer />}
          </div>
        </div>
      </main>
    </div>
  )
}
