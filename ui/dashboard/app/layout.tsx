import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OpenClaw Dashboard',
  description: 'OpenClaw 外贸团队实时协作监控',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      {/* bg-gray-50 pairs with the dashboard's light-mode design.
          The SystemStatusBar component renders its own dark top bar. */}
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
