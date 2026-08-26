import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import type { Account } from '../../lib/api'
import { updateAccount } from '../../lib/api'
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

function readNotifPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem('notif_prefs')
    return raw ? JSON.parse(raw) : defaultNotifPrefs
  } catch {
    return defaultNotifPrefs
  }
}

const defaultNotifPrefs: Record<string, boolean> = {
  incident: true,
  temperature_alert: true,
  activity: true,
  attendance: true,
  announcement: true,
}

const NOTIF_LABELS: Record<string, string> = {
  incident: 'Incident Reports',
  temperature_alert: 'Temperature Alerts',
  activity: 'Activity Updates',
  attendance: 'Attendance',
  announcement: 'Announcements',
}

const NOTIF_DESCS: Record<string, string> = {
  incident: 'Get notified when an incident report is filed for your child',
  temperature_alert: 'Get notified when a fever or high temperature is recorded',
  activity: 'Get notified about meal, sleep, and toilet log updates',
  attendance: 'Get notified when your child is checked in or out',
  announcement: 'Get notified about class and nursery announcements',
}

export function Settings() {
  const [account, setAccount] = useState<Account | null>(null)
  const [checked, setChecked] = useState(false)
  const navigate = useNavigate()

  // Profile form
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Password form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState(defaultNotifPrefs)

  useEffect(() => {
    const acct = readStoredAccount()
    setAccount(acct)
    if (acct) {
      setFullName(acct.full_name)
      setEmail(acct.email)
    }
    setNotifPrefs(readNotifPrefs())
    setChecked(true)
  }, [])

  if (!checked) return null
  if (!account || account.role !== 'parent') return <Navigate to="/sign-in" replace />

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    if (!fullName.trim() || !email.trim()) {
      setProfileMsg({ type: 'err', text: 'Name and email are required.' })
      return
    }
    setProfileSaving(true)
    try {
      const updated = await updateAccount(account.id, { full_name: fullName.trim(), email: email.trim() })
      localStorage.setItem('account', JSON.stringify(updated))
      setAccount(updated)
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully.' })
    } catch (err: any) {
      setProfileMsg({ type: 'err', text: err.message || 'Failed to update profile.' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (!newPassword) {
      setPwMsg({ type: 'err', text: 'Please enter a new password.' })
      return
    }
    if (newPassword.length < 4) {
      setPwMsg({ type: 'err', text: 'Password must be at least 4 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'err', text: 'Passwords do not match.' })
      return
    }
    setPwSaving(true)
    try {
      await updateAccount(account.id, { password: newPassword })
      setNewPassword('')
      setConfirmPassword('')
      setPwMsg({ type: 'ok', text: 'Password changed successfully.' })
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err.message || 'Failed to change password.' })
    } finally {
      setPwSaving(false)
    }
  }

  const toggleNotif = (key: string) => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(next)
    localStorage.setItem('notif_prefs', JSON.stringify(next))
  }

  const handleSignOut = () => {
    localStorage.removeItem('account')
    navigate('/')
  }

  return (
    <>
      <Header account={account} />
      <main className="mx-auto min-h-screen max-w-2xl px-5 py-12 pb-28">
        <h1 className="text-section text-teal-900">Settings</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-soft">
          Manage your account and preferences.
        </p>

        {/* ── Profile ─────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-teal-900 mb-4">Profile</h2>
          <form onSubmit={handleProfileSave} className="space-y-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)] p-6">
            <div>
              <label htmlFor="settings-name" className="block text-sm font-medium text-ink mb-1">Full Name</label>
              <input
                id="settings-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label htmlFor="settings-email" className="block text-sm font-medium text-ink mb-1">Email</label>
              <input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={profileSaving}
                className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition disabled:opacity-50"
              >
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </button>
              {profileMsg && (
                <span className={`text-sm font-medium ${profileMsg.type === 'ok' ? 'text-emerald-600' : 'text-coral'}`}>
                  {profileMsg.text}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* ── Change Password ─────────────────────── */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-teal-900 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSave} className="space-y-4 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)] p-6">
            <div>
              <label htmlFor="settings-new-pw" className="block text-sm font-medium text-ink mb-1">New Password</label>
              <input
                id="settings-new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label htmlFor="settings-confirm-pw" className="block text-sm font-medium text-ink mb-1">Confirm Password</label>
              <input
                id="settings-confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition"
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={pwSaving}
                className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 transition disabled:opacity-50"
              >
                {pwSaving ? 'Changing...' : 'Change Password'}
              </button>
              {pwMsg && (
                <span className={`text-sm font-medium ${pwMsg.type === 'ok' ? 'text-emerald-600' : 'text-coral'}`}>
                  {pwMsg.text}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* ── Notification Preferences ─────────────── */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-teal-900 mb-4">Notification Preferences</h2>
          <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-rule)]">
            {Object.keys(NOTIF_LABELS).map((key) => (
              <div key={key} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{NOTIF_LABELS[key]}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{NOTIF_DESCS[key]}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifPrefs[key]}
                  onClick={() => toggleNotif(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${
                    notifPrefs[key] ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      notifPrefs[key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Account Info ─────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-teal-900 mb-4">Account</h2>
          <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)] p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">Account ID</span>
              <span className="text-ink font-medium font-mono">{account.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">Role</span>
              <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-700 capitalize">
                {account.role}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-soft">Email</span>
              <span className="text-ink font-medium">{account.email}</span>
            </div>
          </div>
        </section>

        {/* ── Sign Out / Danger Zone ───────────────── */}
        <section className="mt-10">
          <div className="rounded-xl border border-coral/30 bg-coral-soft/30 p-6">
            <h2 className="text-lg font-semibold text-coral mb-2">Sign Out</h2>
            <p className="text-sm text-ink-soft mb-4">
              You will be returned to the landing page. You can sign in again at any time.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-coral bg-white px-5 py-2 text-sm font-semibold text-coral hover:bg-coral hover:text-white transition"
            >
              Sign Out
            </button>
          </div>
        </section>
      </main>
      <Button />
    </>
  )
}
