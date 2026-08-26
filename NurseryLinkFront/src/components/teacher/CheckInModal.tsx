import { useState } from 'react'
import { checkInChild, checkOutChild, getAttendanceForChild, type RosterChild } from '../../lib/api'

interface CheckInModalProps {
  child: RosterChild
  accountId: string
  onClose: () => void
  onDone: () => void
}

export function CheckInModal({ child, accountId, onClose, onDone }: CheckInModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCheckedIn = !!child.check_in_time && !child.check_out_time

  const handleCheckIn = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await checkInChild(child.id, accountId)
      onDone()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckOut = async () => {
    setSubmitting(true)
    setError(null)
    try {
      // Find the active record — the most recent one for this child today
      const records = await getAttendanceForChild(String(child.id))
      const activeRecord = records.find((r) => r.status && !r.check_out_time)
      if (!activeRecord) {
        setError('No active check-in record found.')
        setSubmitting(false)
        return
      }
      await checkOutChild(activeRecord.id)
      onDone()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-[var(--color-rule)] p-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">{child.name}</h2>
            <p className="text-sm text-ink-soft">Attendance</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status indicator */}
          <div className="flex items-center justify-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full border-2 ${
                isCheckedIn
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-amber-300 bg-amber-50'
              }`}
            >
              <svg
                className={`h-10 w-10 ${isCheckedIn ? 'text-emerald-600' : 'text-amber-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isCheckedIn
                      ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                      : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  }
                />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-ink-soft">
              {isCheckedIn
                ? `Checked in at ${new Date(child.check_in_time!).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
                : 'Not checked in today'}
            </p>
          </div>

          {error && <p className="text-sm text-coral text-center">{error}</p>}

          <div className="flex gap-3 border-t border-[var(--color-rule)] pt-4">
            {!isCheckedIn ? (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={submitting}
                className="flex-1 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-paper transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? 'Checking In...' : 'Check In'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={submitting}
                className="flex-1 rounded-lg bg-amber-500 py-3 text-sm font-semibold text-paper transition-colors hover:bg-amber-600 disabled:opacity-60"
              >
                {submitting ? 'Checking Out...' : 'Check Out'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-rule)] px-4 py-3 text-sm font-semibold text-ink hover:bg-paper-sunk"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
