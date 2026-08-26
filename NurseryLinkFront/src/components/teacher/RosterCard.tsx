import type { RosterChild } from '../../lib/api'

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function getStatus(child: RosterChild): { label: string; bg: string; text: string; stripe: string } {
  if (child.last_temp !== null && child.last_temp >= 38.0) {
    return { label: 'Fever Detected', bg: 'bg-red-50', text: 'text-red-700', stripe: 'bg-red-500' }
  }
  if (!child.check_in_time) {
    return { label: 'Not Checked In', bg: 'bg-amber-50', text: 'text-amber-700', stripe: 'bg-amber-400' }
  }
  return {
    label: `Checked In ${formatTime(child.check_in_time)}`,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    stripe: 'bg-teal-500',
  }
}

interface RosterCardProps {
  child: RosterChild
  onLogMeal: (mealType: string) => void
  onRecordTemp: () => void
  onFileIncident: () => void
  onLogToilet: () => void
  onCheckInOut: () => void
}

export function RosterCard({ child, onLogMeal, onRecordTemp, onFileIncident, onLogToilet, onCheckInOut }: RosterCardProps) {
  const status = getStatus(child)

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-raised)] shadow-[var(--shadow-card)]">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.stripe}`} />
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-100 text-base font-semibold text-teal-800">
              {child.name.charAt(0).toUpperCase()}
            </span>
            <h3 className="text-base font-semibold text-ink">{child.name}</h3>
          </div>
        </div>

        <span
          className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
        >
          {status.label}
        </span>

        <div className="mt-4 space-y-1.5 border-t border-[var(--color-rule)] pt-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Temp</span>
            <span className={child.last_temp !== null && child.last_temp >= 38.0 ? 'font-semibold text-red-600' : 'text-ink'}>
              {child.last_temp !== null ? `${child.last_temp}°C` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Last Meal</span>
            <span className="text-ink">
              {child.last_meal_at ? `${formatTime(child.last_meal_at)} (${child.last_meal_type})` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Toilet</span>
            <span className="text-ink">{child.last_toilet_at ? formatTime(child.last_toilet_at) : '—'}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2 border-t border-[var(--color-rule)] pt-3">
          <button
            type="button"
            onClick={onCheckInOut}
            className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[0.6875rem] font-medium text-ink-soft hover:bg-paper-sunk hover:text-teal-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Check In
          </button>
          <button
            type="button"
            onClick={() => onLogMeal('Breakfast')}
            className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[0.6875rem] font-medium text-ink-soft hover:bg-paper-sunk hover:text-teal-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Meal
          </button>
          <button
            type="button"
            onClick={onLogToilet}
            className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[0.6875rem] font-medium text-ink-soft hover:bg-paper-sunk hover:text-teal-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Toilet
          </button>
          <button
            type="button"
            onClick={onRecordTemp}
            className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[0.6875rem] font-medium text-ink-soft hover:bg-paper-sunk hover:text-teal-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13V5a3 3 0 00-6 0v8a5 5 0 106 0z" />
            </svg>
            Temp
          </button>
          <button
            type="button"
            onClick={onFileIncident}
            title="File incident report"
            className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[0.6875rem] font-medium text-ink-soft hover:bg-red-50 hover:text-red-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            Report
          </button>
        </div>
      </div>
    </div>
  )
}
