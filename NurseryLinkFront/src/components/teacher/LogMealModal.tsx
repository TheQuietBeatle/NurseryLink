import { useState } from 'react'
import { logMeal, type RosterChild } from '../../lib/api'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snack']

const PORTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'Full', label: 'Ate everything', hint: 'Finished the entire portion' },
  { value: 'Half', label: 'Ate some', hint: 'Left more than half' },
  { value: 'None', label: 'Refused', hint: 'Did not eat' },
]

interface LogMealModalProps {
  child: RosterChild
  accountId: string
  initialMealType: string
  onClose: () => void
  onLogged: () => void
}

export function LogMealModal({ child, accountId, initialMealType, onClose, onLogged }: LogMealModalProps) {
  const [mealType, setMealType] = useState(initialMealType)
  const [portion, setPortion] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!portion) {
      setError('Choose how much was eaten.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await logMeal({ accountId, childId: child.id, mealType, foodPortion: portion })
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
            <p className="text-sm text-ink-soft">Log Meal</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Meal Type</p>
            <div className="flex rounded-lg border border-[var(--color-rule)] bg-paper p-1">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    mealType === type ? 'bg-teal-700 text-paper' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Amount Eaten</p>
            <div className="space-y-2">
              {PORTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPortion(p.value)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    portion === p.value
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-[var(--color-rule)] bg-paper hover:border-teal-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.label}</p>
                    <p className="text-xs text-ink-soft">{p.hint}</p>
                  </div>
                  <span
                    className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                      portion === p.value ? 'border-teal-600 bg-teal-600' : 'border-[var(--color-rule)]'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-lg bg-teal-700 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-900 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Confirm Meal Log'}
          </button>
        </div>
      </div>
    </div>
  )
}
