import { useState } from 'react'
import { fileIncidentReport, type RosterChild } from '../../lib/api'

const SEVERITIES: { value: 'low' | 'medium' | 'high'; label: string; hint: string }[] = [
  { value: 'low', label: 'Minor', hint: 'Scrape, bump, no treatment needed.' },
  { value: 'medium', label: 'Moderate', hint: 'First aid applied, parents notified.' },
  { value: 'high', label: 'Serious', hint: 'Medical attention required immediately.' },
]

interface IncidentReportModalProps {
  child: RosterChild
  teacherId: string
  onClose: () => void
  onFiled: () => void
}

export function IncidentReportModal({ child, teacherId, onClose, onFiled }: IncidentReportModalProps) {
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!severity) {
      setError('Choose an incident severity.')
      return
    }
    if (!description.trim()) {
      setError('Describe what happened.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await fileIncidentReport({ childId: child.id, teacherId, description: description.trim(), severityLevel: severity })
      onFiled()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-[var(--color-rule)] p-5">
          <h2 className="text-lg font-semibold text-teal-900">Incident Report</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Child Involved</p>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-rule)] bg-paper px-3 py-1.5 text-sm font-medium text-ink">
              {child.name}
            </span>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Incident Severity</p>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`rounded-xl border p-3 text-center transition-colors ${
                    severity === s.value
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-[var(--color-rule)] bg-paper hover:border-teal-200'
                  }`}
                >
                  <p className="text-sm font-semibold text-ink">{s.label}</p>
                  <p className="mt-1 text-[0.6875rem] leading-snug text-ink-soft">{s.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Incident Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Provide objective details: What happened, where, and when? Describe any actions taken."
              className="w-full rounded-lg border border-[var(--color-rule)] bg-paper p-3 text-sm"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-[var(--color-rule)] bg-paper px-4 py-3 text-sm text-ink-soft">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Filing this will notify every linked parent. Parents will be required to acknowledge this report individually.
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-[var(--color-rule)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-rule)] px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper-sunk"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-teal-900 disabled:opacity-60"
            >
              {submitting ? 'Filing...' : 'File Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
