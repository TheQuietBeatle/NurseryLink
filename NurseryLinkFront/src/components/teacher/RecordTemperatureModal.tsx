import { useState } from 'react'
import { logTemperature, type RosterChild } from '../../lib/api'

const MIN_TEMP = 34.0
const MAX_TEMP = 42.0

interface RecordTemperatureModalProps {
  child: RosterChild
  accountId: string
  onClose: () => void
  onLogged: () => void
}

export function RecordTemperatureModal({ child, accountId, onClose, onLogged }: RecordTemperatureModalProps) {
  const [degrees, setDegrees] = useState(child.last_temp ?? 36.5)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const step = (delta: number) => {
    setDegrees((d) => Math.min(MAX_TEMP, Math.max(MIN_TEMP, Math.round((d + delta) * 10) / 10)))
  }

  const isHigh = degrees >= 38.0

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await logTemperature({ accountId, childId: child.id, degreeCelsius: degrees, comments })
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
            <h2 className="text-lg font-semibold text-teal-900">Record Temperature</h2>
            <p className="text-sm text-ink-soft">Recording for {child.name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => step(-0.1)}
              className="grid h-14 w-14 place-items-center rounded-full border border-[var(--color-rule)] font-semibold text-teal-700 hover:bg-paper-sunk"
            >
              &minus;
            </button>
            <div className="text-center">
              <p className={`text-4xl font-bold ${isHigh ? 'text-coral' : 'text-teal-900'}`}>
                {degrees.toFixed(1)}°C
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Accepted range: {MIN_TEMP.toFixed(1)}°C - {MAX_TEMP.toFixed(1)}°C
              </p>
            </div>
            <button
              type="button"
              onClick={() => step(0.1)}
              className="grid h-14 w-14 place-items-center rounded-full border border-[var(--color-rule)] font-semibold text-teal-700 hover:bg-paper-sunk"
            >
              +
            </button>
          </div>

          {isHigh && (
            <div className="flex items-start gap-2 rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              High temperature detected. All linked parents will be notified automatically upon saving.
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Notes (optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Add any relevant observations..."
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
            {submitting ? 'Saving...' : 'Confirm Record'}
          </button>
        </div>
      </div>
    </div>
  )
}
