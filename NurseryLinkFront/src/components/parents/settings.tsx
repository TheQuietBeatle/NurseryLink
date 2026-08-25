import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { Account } from '../../lib/api'
import { Header } from './Header2'
import Button from './bottomWidget'


function readStoredAccount(): Account | null {
  try {
    const raw = localStorage.getItem('account')
    return raw ? (JSON.parse(raw) as Account) : null
  } catch {
    return null
  }
}

export function Settings() {
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
        <div className="font-display text-4xl font-bold text-ink leading-tight">

             Settings
             
             </div>
      </main>
      <Button />
    </>
  )
}
