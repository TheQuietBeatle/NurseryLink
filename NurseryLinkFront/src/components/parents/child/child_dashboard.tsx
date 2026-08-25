import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Account, Child } from '../../../lib/api'
import { Header } from '../Header'
import Button from '../bottomWidget';
import { Temperature } from './temperature'
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
      <main className="mx-auto min-h-screen max-w-4xl px-5 py-12">
        <h1 className="text-section text-teal-900">{child.name}</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-soft">
          {calculateAge(child.date_of_birth)} years old
        </p>
        <p className="mt-2 text-[0.9375rem] text-ink-soft">
          Date of birth: {new Date(child.date_of_birth).toLocaleDateString()}
        </p>
        {child.summary_log && (
          <p className="mt-4 text-[0.9375rem] text-ink-soft">{child.summary_log}</p>
        )}
        <p className="mt-2 text-[0.9375rem] text-muted">Class : {child.class_id.toString()}</p>

        <section id="temperature_history" className="mt-12 scroll-mt-24">
          <h2 className="text-lg font-semibold text-teal-900">Temperature History</h2>
          <div id="temperature_history" className="mt-4 h-80">
            <Temperature childId={child.id} />
          </div>
        </section>


      </main>
      <Button />
    </>
  )
}
