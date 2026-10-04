import type { ReactNode } from 'react'
import { AdminHeader } from './adminHeader'
import { Sidebar } from './adminSidebar'

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}