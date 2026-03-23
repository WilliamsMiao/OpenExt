import { NextResponse } from 'next/server'
import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { parseStatusMd, parsePlanMd, parseLogMd, parseMemoryMd } from '@/lib/parseWorkspace'

export const dynamic = 'force-dynamic'

const WORKSPACE_PATH = process.env.WORKSPACE_PATH || join(process.cwd(), '../../workspace')
const FILES = ['goal.md', 'status.md', 'plan.md', 'log.md', 'MEMORY.md']

function readFile(filename: string): { content: string; mtime: string } {
  const filePath = join(WORKSPACE_PATH, filename)
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf-8')
    const stat = statSync(filePath)
    return { content, mtime: stat.mtime.toISOString() }
  }
  return { content: '（文件不存在）', mtime: '' }
}

export async function GET() {
  // Read all workspace files
  const files: Record<string, { content: string; mtime: string }> = {}
  for (const file of FILES) {
    files[file] = readFile(file)
  }

  // Parse each file into structured data
  const parsed = {
    agents: parseStatusMd(files['status.md'].content),
    plan: parsePlanMd(files['plan.md'].content),
    logs: parseLogMd(files['log.md'].content),
    memory: parseMemoryMd(files['MEMORY.md'].content),
  }

  return NextResponse.json({ files, parsed })
}
