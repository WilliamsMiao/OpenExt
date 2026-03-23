'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ParsedWorkspaceData, SystemData } from '@/types/dashboard'

// ─── Context ──────────────────────────────────────────────────────────────────

interface DashboardContextValue {
  workspaceData: ParsedWorkspaceData | null
  systemData: SystemData | null
  loading: boolean
  lastUpdated: Date | null
  refresh: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextValue>({
  workspaceData: null,
  systemData: null,
  loading: false,
  lastUpdated: null,
  refresh: async () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [workspaceData, setWorkspaceData] = useState<ParsedWorkspaceData | null>(null)
  const [systemData, setSystemData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setWorkspaceData(data)
      }
    } catch (e) {
      console.error('[Dashboard] workspace fetch error:', e)
    }
  }, [])

  const fetchSystem = useCallback(async () => {
    try {
      const res = await fetch('/api/system', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSystemData(data)
      }
    } catch (e) {
      console.error('[Dashboard] system fetch error:', e)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchWorkspace(), fetchSystem()])
    setLastUpdated(new Date())
    setLoading(false)
  }, [fetchWorkspace, fetchSystem])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  // Workspace polling — every 15s
  useEffect(() => {
    const id = setInterval(fetchWorkspace, 15_000)
    return () => clearInterval(id)
  }, [fetchWorkspace])

  // Agent sessions polling — every 10s
  useEffect(() => {
    const id = setInterval(fetchSystem, 10_000)
    return () => clearInterval(id)
  }, [fetchSystem])

  return (
    <DashboardContext.Provider value={{ workspaceData, systemData, loading, lastUpdated, refresh }}>
      {children}
    </DashboardContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard() {
  return useContext(DashboardContext)
}
