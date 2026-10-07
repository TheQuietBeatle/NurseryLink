import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import type {
  Account,
  RosterChild,
  Teacher,
  TeacherClass,
} from '../../lib/api'
import {
  getClassRoster,
  getTeacherByAccount,
  getTeacherClasses,
} from '../../lib/api'
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

  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)

  const [roster, setRoster] = useState<RosterChild[]>([])

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  useEffect(() => {
    setAccount(readStoredAccount())
    setChecked(true)
  }, [])

  // Get teacher using logged-in account
  useEffect(() => {
    if (!account) return

    setLoading(true)
    setError(null)

    getTeacherByAccount(account.id)
      .then(setTeacher)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [account])

  // Get all classes belonging to this teacher
  useEffect(() => {
    if (!teacher) return

    setLoading(true)
    setError(null)

    getTeacherClasses(teacher.id)
      .then((teacherClasses) => {
        setClasses(teacherClasses)

        // Select the first class by default
        if (teacherClasses.length > 0) {
          setSelectedClassId(teacherClasses[0].id)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [teacher])

  // Load roster whenever the selected class changes
  useEffect(() => {
    if (!selectedClassId) return

    setLoading(true)
    setError(null)

    getClassRoster(selectedClassId)
      .then(setRoster)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedClassId])

  const selectedClass = classes.find(
    (classItem) => classItem.id === selectedClassId
  )

  const presentCount = roster.filter(
    (child) => child.check_in_time
  ).length

  const absentCount = roster.length - presentCount

  const handleActionDone = () => {
    setActiveModal(null)

    if (selectedClassId) {
      setLoading(true)

      getClassRoster(selectedClassId)
        .then(setRoster)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }

  if (!checked) {
    return null
  }

  if (!account || account.role !== 'teacher') {
    return <Navigate to="/sign-in" replace />
  }

  return (
    <>
      <Header account={account} />

      <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8">

        {/* Page title */}
        <h1 className="font-display text-3xl font-bold text-teal-900">
          {selectedClass?.class_name ?? 'Your Classes'}
        </h1>

        {/* Class selector */}
        {classes.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                onClick={() => setSelectedClassId(classItem.id)}
                className={
                  selectedClassId === classItem.id
                    ? 'rounded-lg bg-teal-900 px-4 py-2 text-sm font-medium text-white'
                    : 'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
                }
              >
                {classItem.class_name}
              </button>
            ))}
          </div>
        )}

        {/* Attendance summary */}
        {!loading && (
          <p className="mt-3 text-sm text-ink-soft">
            {presentCount}{' '}
            {presentCount === 1 ? 'child' : 'children'} present
            &bull; {absentCount} not checked in
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="mt-6 text-sm text-coral">
            Error: {error}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <p className="mt-6 text-sm text-ink-soft">
            Loading roster...
          </p>
        )}

        {/* No classes */}
        {!loading && !error && classes.length === 0 && (
          <p className="mt-6 text-sm text-ink-soft">
            You are not assigned to any classes yet.
          </p>
        )}

        {/* No children */}
        {!loading &&
          !error &&
          classes.length > 0 &&
          roster.length === 0 && (
            <p className="mt-6 text-sm text-ink-soft">
              No children are assigned to this class yet.
            </p>
          )}

        {/* Children */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {roster.map((child) => (
            <RosterCard
              key={child.id}
              child={child}
              onLogMeal={(mealType) =>
                setActiveModal({
                  type: 'meal',
                  child,
                  mealType,
                })
              }
              onRecordTemp={() =>
                setActiveModal({
                  type: 'temperature',
                  child,
                })
              }
              onFileIncident={() =>
                setActiveModal({
                  type: 'incident',
                  child,
                })
              }
              onLogToilet={() =>
                setActiveModal({
                  type: 'toilet',
                  child,
                })
              }
              onCheckInOut={() =>
                setActiveModal({
                  type: 'checkin',
                  child,
                })
              }
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