import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { Account, NotificationItem } from '../../lib/api'
import { getNotificationsForAccount, markNotificationSeen } from '../../lib/api'
import { Header } from './Header2'
import Button from './bottomWidget'

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  normal: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  urgent: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

const PRIORITY_STRIPE: Record<string, string> = {
  low: 'bg-emerald-400',
  normal: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-500',
}

const TYPE_LABELS: Record<string, string> = {
  incident: 'Incident',
  supply: 'Supply Request',
  announcement: 'Announcement',
  attendance: 'Attendance',
  activity: 'Activity',
  temperature_alert: 'Temperature Alert',
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function readStoredAccount(): Account | null {
  try {
    const raw = localStorage.getItem('account')
    return raw ? (JSON.parse(raw) as Account) : null
  } catch {
    return null
  }
}

export function EventsNotices() {
  const [account, setAccount] = useState<Account | null>(null)
  const [checked, setChecked] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setAccount(readStoredAccount())
    setChecked(true)
  }, [])

  useEffect(() => {
    if (!account) return
    setLoading(true)
    getNotificationsForAccount(account.id)
      .then(setNotifications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [account])

  if (!checked) {
    return null
  }

  if (!account || account.role !== 'parent') {
    return <Navigate to="/sign-in" replace />
  }

  const unreadCount = notifications.filter((n) => !n.seen).length

  const handleMarkSeen = async (id: number) => {
    try {
      await markNotificationSeen(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, seen: true, seen_at: new Date().toISOString() } : n)),
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <>
      <Header account={account} />
      <main className="mx-auto min-h-screen max-w-4xl px-5 py-12 pb-28">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-bold text-ink leading-tight">
            Events &amp; Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-[var(--shadow-card)]">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="mt-8 space-y-4">
          {loading && <p className="text-sm text-ink-soft">Loading notifications...</p>}

          {error && <p className="text-sm text-coral">Error: {error}</p>}

          {!loading && !error && notifications.length === 0 && (
            <p className="text-sm text-ink-soft">No notifications yet.</p>
          )}

          {!loading &&
            !error &&
            notifications.map((notification) => {
              const priority = PRIORITY_STYLES[notification.priority] ?? PRIORITY_STYLES.normal
              const stripe = PRIORITY_STRIPE[notification.priority] ?? PRIORITY_STRIPE.normal
              const typeLabel = TYPE_LABELS[notification.notification_type] ?? 'Notification'

              return (
                <div
                  key={notification.id}
                  className={`relative overflow-hidden rounded-xl border bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)] ${
                    notification.seen ? 'border-[var(--color-rule)]' : 'border-red-200'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${stripe}`} />
                  <div className="p-5 pl-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {!notification.seen && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Unread" />
                        )}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                            {typeLabel}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-ink">
                            {notification.description ?? 'No details provided.'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priority.bg} ${priority.text} ${priority.border}`}
                      >
                        {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-rule)] pt-3">
                      <span className="text-xs text-ink-soft">{formatDate(notification.sent_at)}</span>
                      {!notification.seen && (
                        <button
                          type="button"
                          onClick={() => handleMarkSeen(notification.id)}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </main>
      <Button />
    </>
  )
}
