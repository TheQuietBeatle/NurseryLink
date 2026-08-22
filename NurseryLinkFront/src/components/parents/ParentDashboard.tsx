import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { Account } from '../../lib/api'
import { Header } from './Header'


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


  return (

    <>
      <Header account={account} />
      <main className="mx-auto min-h-screen max-w-4xl px-5 py-12">
        <h1 className="text-section text-teal-900">Welcome back, {account.full_name}</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-soft">
          This is your parent dashboard. More here soon.
        </p>
        <p>
          your children
          <div>
            <button>Child 1 </button>
            <button>Child 2 </button>
            <button>Child 3 </button>
          </div>

        </p>

      </main>
    </>
  )
}
