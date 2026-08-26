import { useState } from 'react'
import { logToiletVisit, type RosterChild } from '../../lib/api'

const TOILET_TYPES: { value: string; label: string; hint: string }[] = [
  { value: 'Potty', label: 'Potty', hint: 'Used the potty successfully' },
  { value: 'Diaper', label: 'Diaper', hint: 'Diaper check or change' },
  { value: 'Training', label: 'Training', hint: 'Potty training attempt' },
]

interface LogToiletModalProps {
  child: RosterChild
  accountId: string
  onClose: () => void
  onLogged: () => void
}

export function LogToiletModal({ child, accountId, onClose, onLogged }: LogToiletModalProps) {
  const [toiletType, setToiletType] = useState<string | null>(null)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!toiletType) {
      setError('Choose a toilet visit type.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await logToiletVisit({ accountId, childId: child.id, toiletType, comments })
      onLogged()
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
            <p className="text-sm text-ink-soft">Log Toilet Visit</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Visit Type</p>
            <div className="space-y-2">
              {TOILET_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setToiletType(t.value)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    toiletType === t.value
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-[var(--color-rule)] bg-paper hover:border-violet-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.label}</p>
                    <p className="text-xs text-ink-soft">{t.hint}</p>
                  </div>
                  <span
                    className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                      toiletType === t.value ? 'border-violet-600 bg-violet-600' : 'border-[var(--color-rule)]'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Notes (optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Any observations about the visit..."
              className="w-full rounded-lg border border-[var(--color-rule)] bg-paper p-3 text-sm"
            />
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-teal-700 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-900 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Log Visit'}
          </button>
        </div>
      </div>
    </div>
  )
}
