import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { Account, Child } from '../../lib/api'
import { getChildrenForAccount } from '../../lib/api'
import { Header } from './Header2'
import Card from './childrenCard'
import Button from './bottomWidget'

function readStoredAccount(): Account | null {
  try {
    const raw = localStorage.getItem('account')
    return raw ? (JSON.parse(raw) as Account) : null
  } catch {
    return null
  }
}

export function ParentDashboard() {
  const [account, setAccount] = useState<Account | null>(null)
  const [checked, setChecked] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [childrenError, setChildrenError] = useState<string | null>(null)

  useEffect(() => {
    setAccount(readStoredAccount())
    setChecked(true)
  }, [])

  useEffect(() => {
    if (!account) return
    getChildrenForAccount(account.id)
      .then(setChildren)
      .catch(() => setChildrenError('Could not load your children.'))
  }, [account])

  if (!checked) {
    return null
  }

  if (!account || account.role !== 'parent') {
    return <Navigate to="/sign-in" replace />
  }


  return (

    <>
      <Header account={account} />
      <main className="mx-auto min-h-screen max-w-4xl px-5 py-12">
        <h1 className="text-section text-teal-900">Welcome back, {account.full_name}</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-soft">
          This is your parent dashboard. More here soon.
        </p>
        <h2 className="mt-8 text-lg font-semibold text-teal-900">Your children</h2>
        {childrenError && <p className="mt-2 text-sm text-red-600">{childrenError}</p>}
        {!childrenError && children.length === 0 && (
          <p className="mt-2 text-[0.9375rem] text-ink-soft">No children linked to your account yet.</p>
        )}
        <div className="mt-4 flex flex-wrap justify-center items-center">
          {children.map((child) => (
            <Card key={child.id} child={child} />
          ))}
        </div>
      </main>
      <Button />
    </>
  )
}
