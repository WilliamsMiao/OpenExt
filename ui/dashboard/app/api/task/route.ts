import { NextResponse } from 'next/server'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { spawn } from 'child_process'

export const dynamic = 'force-dynamic'

const WORKSPACE_PATH = process.env.WORKSPACE_PATH || join(process.cwd(), '../../workspace')
const OPENCLAW_CONTAINER = process.env.OPENCLAW_CONTAINER || 'openclaw'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const task: unknown = body?.task

    if (!task || typeof task !== 'string' || !task.trim()) {
      return NextResponse.json({ error: '任务内容不能为空' }, { status: 400 })
    }

    const trimmed = task.trim()
    const now = new Date()
    const timestamp = now.toISOString()
    const localTime = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

    // Ensure workspace directory exists
    if (!existsSync(WORKSPACE_PATH)) {
      mkdirSync(WORKSPACE_PATH, { recursive: true })
    }

    // Write goal.md
    const goalContent = `# Goal - 客户询盘

## 任务信息
- **提交时间**: ${localTime}
- **状态**: 待处理

## 任务内容

${trimmed}
`
    writeFileSync(join(WORKSPACE_PATH, 'goal.md'), goalContent, 'utf-8')

    // Clear status.md — agents will fill this in
    writeFileSync(
      join(WORKSPACE_PATH, 'status.md'),
      `# Status - 执行状态\n\n（等待 Coordinator 分配任务...）\n`,
      'utf-8'
    )

    // Clear plan.md — coordinator will fill this in
    writeFileSync(
      join(WORKSPACE_PATH, 'plan.md'),
      `# Plan - 任务计划\n\n（等待 Coordinator 制定计划...）\n`,
      'utf-8'
    )

    // Trigger the Coordinator via docker exec (fire-and-forget)
    // The coordinator runs inside the openclaw container where the CLI and model keys are available.
    const message = `新任务已提交，请读取 goal.md 并开始执行：${trimmed}`
    const proc = spawn(
      'docker',
      [
        'exec', OPENCLAW_CONTAINER,
        'node', '/app/openclaw.mjs',
        'agent',
        '--agent', 'coordinator',
        '-m', message,
      ],
      { detached: true, stdio: 'ignore' }
    )
    proc.unref() // don't wait — let it run in background

    return NextResponse.json({
      ok: true,
      message: '任务已提交，Coordinator 已启动',
      timestamp,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/task] Error:', message)

    if (message.includes('EROFS') || message.includes('read-only')) {
      return NextResponse.json(
        {
          error: 'Workspace 目录为只读，请移除 docker-compose.yml 中 workspace 卷的 `:ro` 标志后重建容器',
          detail: message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: '任务提交失败', detail: message }, { status: 500 })
  }
}
