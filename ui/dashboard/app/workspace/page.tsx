import { DashboardProvider } from '@/components/DashboardProvider'
import { WorkspaceDashboard } from '@/components/WorkspaceDashboard'

export const dynamic = 'force-dynamic'

export default function WorkspacePage() {
  return (
    <DashboardProvider>
      <WorkspaceDashboard />
    </DashboardProvider>
  )
}
