import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Account, Child } from '../../../lib/api'
import { Header } from '../Header'
import Button from '../bottomWidget';
import { Temperature } from './temperature'
import { IncidentHistory } from './IncidentHistory'
import { MealHistory } from './MealHistory'
import { SupplyHistory } from './SupplyHistory'
import { ToiletLog } from './ToiletLog'
import { AttendanceLog } from './AttendanceLog'
function readStoredAccount(): Account | null {
  try {
    const raw = localStorage.getItem('account')
    return raw ? (JSON.parse(raw) as Account) : null
  } catch {
    return null
  }
}

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const monthDiff = now.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1
  }
  return age
}

export function ChildDashboard() {
  const [account, setAccount] = useState<Account | null>(null)
  const [checked, setChecked] = useState(false)
  const location = useLocation()
  const child = (location.state as { child?: Child } | null)?.child ?? null

  useEffect(() => {
    setAccount(readStoredAccount())
    setChecked(true)
  }, [])

  if (!checked) {
    return null
  }

  if (!account || account.role !== 'parent') {
    return <Navigate to="/sign-in" replace />
  }

  if (!child) {
    return <Navigate to="/parent" replace />
  }

  return (
    <>
      <Header account={account} />
      <main className="mx-auto min-h-screen max-w-4xl px-5 py-12 pb-28 space-y-10">
        <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-2xl font-semibold text-teal-900">{child.name}</h1>
            <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 border border-teal-100">
              Class {child.class_id.toString()}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-soft">
            <span>{calculateAge(child.date_of_birth)} years old</span>
            <span>Born {new Date(child.date_of_birth).toLocaleDateString()}</span>
          </div>
          {child.summary_log && (
            <p className="mt-4 text-sm text-ink-soft leading-relaxed border-t border-[var(--color-rule)] pt-4">
              {child.summary_log}
            </p>
          )}
        </div>

        <section id="temperature_history" className="scroll-mt-24">
          <h2 className="mb-4 text-lg font-semibold text-teal-900">Temperature History</h2>
          <Temperature childId={child.id} />
        </section>

        <section id="incident_history" className="scroll-mt-24">
          <h2 className="mb-4 text-lg font-semibold text-teal-900">Incident History</h2>
          <IncidentHistory childId={child.id} />
        </section>

        <section id="meal_history" className="scroll-mt-24">
          <h2 className="mb-4 text-lg font-semibold text-teal-900">Meal History</h2>
          <MealHistory childId={child.id} />
        </section>

        <section id="supply_history" className="scroll-mt-24">
          <h2 className="mb-4 text-lg font-semibold text-teal-900">Supply History</h2>
          <SupplyHistory accountId={account.id} />
        </section>

        <section id="toilet_history" className="scroll-mt-24">
          <h2 className="mb-4 text-lg font-semibold text-teal-900">Toilet Visits</h2>
          <ToiletLog childId={child.id} />
        </section>

        <section id="attendance_history" className="scroll-mt-24">
          <h2 className="mb-4 text-lg font-semibold text-teal-900">Attendance</h2>
          <AttendanceLog childId={child.id} />
        </section>
      </main>
      <Button />
    </>
  )
}
