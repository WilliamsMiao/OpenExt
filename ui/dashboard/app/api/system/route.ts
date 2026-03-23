import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const OPENCLAW_API = process.env.OPENCLAW_API || 'http://localhost:18789'

async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

export async function GET() {
  let health = {
    ok: false,
    status: 'down' as 'live' | 'degraded' | 'down',
    activeSessions: 0,
  }
  let agents: Array<{
    id: string
    model: string
    inputTokens: number
    outputTokens: number
    percentUsed: number
    lastActiveMinutesAgo: number
  }> = []

  // ── Health check ──────────────────────────────────────────────────────────
  const healthEndpoints = [
    `${OPENCLAW_API}/healthz`,
    `${OPENCLAW_API}/health`,
    `${OPENCLAW_API}/api/health`,
    `${OPENCLAW_API}/`,
  ]

  for (const endpoint of healthEndpoints) {
    try {
      const res = await fetchWithTimeout(endpoint)
      if (res.ok || res.status < 500) {
        health = { ok: true, status: 'live', activeSessions: 0 }
        break
      } else {
        health = { ok: false, status: 'degraded', activeSessions: 0 }
        break
      }
    } catch {
      // try next endpoint
    }
  }

  // ── Sessions / Agent token data ───────────────────────────────────────────
  const sessionEndpoints = [
    `${OPENCLAW_API}/api/sessions`,
    `${OPENCLAW_API}/sessions`,
    `${OPENCLAW_API}/api/agents`,
  ]

  for (const endpoint of sessionEndpoints) {
    try {
      const res = await fetchWithTimeout(endpoint)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data?.sessions ?? data?.agents ?? []
        if (list.length > 0) {
          agents = list.map((s: Record<string, unknown>) => ({
            id: String(s.agentId ?? s.agent_id ?? s.id ?? 'unknown'),
            model: String(s.model ?? 'unknown'),
            inputTokens: Number(s.inputTokens ?? s.input_tokens ?? 0),
            outputTokens: Number(s.outputTokens ?? s.output_tokens ?? 0),
            percentUsed: Number(s.percentUsed ?? s.percent_used ?? s.usage_percent ?? 0),
            lastActiveMinutesAgo: Number(s.lastActiveMinutesAgo ?? s.last_active_minutes_ago ?? 0),
          }))
          health.activeSessions = agents.filter(a => a.lastActiveMinutesAgo < 10).length
          break
        }
      }
    } catch {
      // session data not available
    }
  }

  return NextResponse.json({ health, agents })
}
