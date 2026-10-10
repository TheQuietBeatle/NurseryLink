import type { ReactNode } from 'react'
import { AdminHeader } from './adminHeader'
import { Sidebar } from './adminSidebar'

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-theme min-h-screen bg-paper text-ink">
      <AdminHeader />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
