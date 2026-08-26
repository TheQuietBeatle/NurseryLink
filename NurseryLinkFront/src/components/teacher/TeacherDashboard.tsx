import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type { Account, RosterChild, Teacher } from '../../lib/api'
import { getClassRoster, getTeacherByAccount } from '../../lib/api'
import { Header } from './Header3'
import { RosterCard } from './RosterCard'
import { LogMealModal } from './LogMealModal'
import { RecordTemperatureModal } from './RecordTemperatureModal'
import { IncidentReportModal } from './IncidentReportModal'
import { LogToiletModal } from './LogToiletModal'
import { CheckInModal } from './CheckInModal'

function readStoredAccount(): Account | null {
  try {
    const raw = localStorage.getItem('account')
    return raw ? (JSON.parse(raw) as Account) : null
  } catch {
    return null
  }
}

type ActiveModal =
  | { type: 'meal'; child: RosterChild; mealType: string }
  | { type: 'temperature'; child: RosterChild }
  | { type: 'incident'; child: RosterChild }
  | { type: 'toilet'; child: RosterChild }
  | { type: 'checkin'; child: RosterChild }
  | null

export function TeacherDashboard() {
  const [account, setAccount] = useState<Account | null>(null)
  const [checked, setChecked] = useState(false)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [roster, setRoster] = useState<RosterChild[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  useEffect(() => {
    setAccount(readStoredAccount())
    setChecked(true)
  }, [])

  useEffect(() => {
    if (!account) return
    getTeacherByAccount(account.id)
      .then(setTeacher)
      .catch((err) => setError(err.message))
  }, [account])

  const loadRoster = () => {
    if (!teacher) return
    setLoading(true)
    getClassRoster(teacher.class_id)
      .then(setRoster)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRoster()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher])

  if (!checked) {
    return null
  }

  if (!account || account.role !== 'teacher') {
    return <Navigate to="/sign-in" replace />
  }

  const presentCount = roster.filter((c) => c.check_in_time).length
  const absentCount = roster.length - presentCount

  const handleActionDone = () => {
    setActiveModal(null)
    loadRoster()
  }

  return (
    <>
      <Header account={account} />
      <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8">
        <h1 className="font-display text-3xl font-bold text-teal-900">
          {teacher?.class_name ?? 'Your Classroom'}
        </h1>
        {!loading && (
          <p className="mt-1 text-sm text-ink-soft">
            {presentCount} {presentCount === 1 ? 'child' : 'children'} present &bull; {absentCount} not checked in
          </p>
        )}

        {error && <p className="mt-6 text-sm text-coral">Error: {error}</p>}
        {loading && <p className="mt-6 text-sm text-ink-soft">Loading roster...</p>}
        {!loading && !error && roster.length === 0 && (
          <p className="mt-6 text-sm text-ink-soft">No children are assigned to this class yet.</p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {roster.map((child) => (
            <RosterCard
              key={child.id}
              child={child}
              onLogMeal={(mealType) => setActiveModal({ type: 'meal', child, mealType })}
              onRecordTemp={() => setActiveModal({ type: 'temperature', child })}
              onFileIncident={() => setActiveModal({ type: 'incident', child })}
              onLogToilet={() => setActiveModal({ type: 'toilet', child })}
              onCheckInOut={() => setActiveModal({ type: 'checkin', child })}
            />
          ))}
        </div>
      </main>

      {activeModal?.type === 'meal' && (
        <LogMealModal
          child={activeModal.child}
          accountId={account.id}
          initialMealType={activeModal.mealType}
          onClose={() => setActiveModal(null)}
          onLogged={handleActionDone}
        />
      )}

      {activeModal?.type === 'temperature' && (
        <RecordTemperatureModal
          child={activeModal.child}
          accountId={account.id}
          onClose={() => setActiveModal(null)}
          onLogged={handleActionDone}
        />
      )}

      {activeModal?.type === 'incident' && teacher && (
        <IncidentReportModal
          child={activeModal.child}
          teacherId={teacher.id}
          onClose={() => setActiveModal(null)}
          onFiled={handleActionDone}
        />
      )}

      {activeModal?.type === 'toilet' && (
        <LogToiletModal
          child={activeModal.child}
          accountId={account.id}
          onClose={() => setActiveModal(null)}
          onLogged={handleActionDone}
        />
      )}

      {activeModal?.type === 'checkin' && (
        <CheckInModal
          child={activeModal.child}
          accountId={account.id}
          onClose={() => setActiveModal(null)}
          onDone={handleActionDone}
        />
      )}
    </>
  )
}
