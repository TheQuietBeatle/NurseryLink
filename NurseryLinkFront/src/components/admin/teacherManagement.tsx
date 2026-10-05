import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AdminLayout } from './adminPortal'
import { getApiUrl } from '../../lib/api'

const API = getApiUrl()

type ClassItem = { id: number; class_name: string; subjects?: string | null }
type Teacher = {
  id?: number
  full_name?: string
  name?: string
  username?: string
  email?: string
  is_active?: boolean
}

const ROUTES = {
  teachers: '/teacher-managing/getTeachers',
  classes: '/class/GetClasses',
  teachersInClass: (classId: number) => `/teacher-managing/getTeachersInClass/${classId}`,
  assign: '/teacher-managing/assignTeacherToClass',
  move: '/teacher-managing/MoveTeacherToClass',
}

async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {

    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let data: any = text
  try {
    data = JSON.parse(text)
  } catch {
    /* plain text response */
  }
  if (!res.ok) {
    throw new Error(
      typeof data === 'string' ? data : data?.error || data?.message || 'Request failed'
    )
  }
  return data
}

const teacherName = (t: Teacher) => t.full_name || t.name || t.username || 'Unnamed teacher'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500'

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalButtons({
  onClose,
  onSubmit,
  saving,
  label,
  savingLabel,
}: {
  onClose: () => void
  onSubmit: () => void
  saving: boolean
  label: string
  savingLabel: string
}) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={saving}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
      >
        {saving ? savingLabel : label}
      </button>
    </div>
  )
}

// ---------- Assign teacher to class (sends names) ----------
function AssignModal({
  teachers,
  classes,
  assignments,
  presetClassName,
  onClose,
  onSaved,
}: {
  teachers: Teacher[]
  classes: ClassItem[]
  assignments: Record<number, Teacher[]>
  presetClassName?: string
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [teacher, setTeacher] = useState('')
  const [className, setClassName] = useState(presetClassName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inClass = (tName: string, cName: string) => {
    const c = classes.find(x => x.class_name === cName)
    return !!c && (assignments[c.id] || []).some(t => teacherName(t) === tName)
  }

  // Hide combinations that already exist
  const teacherOptions = teachers.filter(t => !className || !inClass(teacherName(t), className))
  const classOptions = classes.filter(c => !teacher || !inClass(teacher, c.class_name))

  const submit = async () => {
    if (!teacher || !className) {
      setError('Please choose a teacher and a class')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api(ROUTES.assign, {
        method: 'POST',
        body: JSON.stringify({ teacher_name: teacher, class_name: className }),
      })
      onSaved(`${teacher} assigned to ${className}`)
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Assign Teacher to Class" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
          <select className={inputClass} value={teacher} onChange={e => setTeacher(e.target.value)}>
            <option value="">-- Choose teacher --</option>
            {teacherOptions.map(t => (
              <option key={teacherName(t)} value={teacherName(t)}>
                {teacherName(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
          <select
            className={inputClass}
            value={className}
            disabled={!!presetClassName}
            onChange={e => setClassName(e.target.value)}
          >
            <option value="">-- Choose class --</option>
            {classOptions.map(c => (
              <option key={c.id} value={c.class_name}>
                {c.class_name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <ModalButtons onClose={onClose} onSubmit={submit} saving={saving} label="Assign" savingLabel="Assigning..." />
    </Modal>
  )
}

// ---------- Move teacher to another class (sends ids) ----------
function MoveModal({
  teacher,
  fromClass,
  classes,
  teacherClassIds,
  onClose,
  onSaved,
}: {
  teacher: Teacher
  fromClass: ClassItem
  classes: ClassItem[]
  teacherClassIds: number[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const options = classes.filter(c => !teacherClassIds.includes(c.id))
  const [destination, setDestination] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!destination) {
      setError('Please choose the new class')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api(ROUTES.move, {
        method: 'PUT',
        body: JSON.stringify({
          teacher_id: teacher.id,
          old_class_id: fromClass.id,
          new_class_id: Number(destination),
        }),
      })
      const dest = classes.find(c => c.id === Number(destination))
      onSaved(`${teacherName(teacher)} moved from ${fromClass.class_name} to ${dest?.class_name ?? 'new class'}`)
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Move Teacher to Another Class" onClose={onClose}>
      <div className="p-3 rounded-lg bg-teal-50 border-l-4 border-teal-600 text-sm text-gray-700">
        Moving a teacher only changes the current assignment. Records the teacher already created stay
        unchanged.
      </div>
      <div className="p-4 rounded-lg bg-gray-50 flex items-center justify-between">
        <p className="font-semibold text-gray-900">{teacherName(teacher)}</p>
        <div className="text-right">
          <p className="text-xs text-gray-500">Leaving class</p>
          <p className="text-sm font-medium text-gray-900">{fromClass.class_name}</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Class *</label>
        <select className={inputClass} value={destination} onChange={e => setDestination(e.target.value)}>
          <option value="">-- Choose class --</option>
          {options.map(c => (
            <option key={c.id} value={c.id}>
              {c.class_name}
            </option>
          ))}
        </select>
        {options.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">This teacher is already in every class.</p>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ModalButtons onClose={onClose} onSubmit={submit} saving={saving} label="Confirm Move" savingLabel="Moving..." />
    </Modal>
  )
}

// ---------- Page ----------
export function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [assignments, setAssignments] = useState<Record<number, Teacher[]>>({}) // class id -> teachers
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [assignModal, setAssignModal] = useState<{ className?: string } | null>(null)
  const [moveModal, setMoveModal] = useState<{ teacher: Teacher; fromClass: ClassItem } | null>(null)

  const loadData = async () => {
    setError('')
    const [teacherRes, classRes] = await Promise.allSettled([
      api<Teacher[]>(ROUTES.teachers),
      api<ClassItem[]>(ROUTES.classes),
    ])

    const rawTeachers =
      teacherRes.status === 'fulfilled' && Array.isArray(teacherRes.value) ? teacherRes.value : []
    // remove duplicates (the current getTeachers query repeats a teacher once per class)
    const seen = new Set<string>()
    const teacherList = rawTeachers.filter(t => {
      const key = teacherName(t)
      if (seen.has(key) || t.is_active === false) return false
      seen.add(key)
      return true
    })

    const classList = (
      classRes.status === 'fulfilled' && Array.isArray(classRes.value) ? classRes.value : []
    ).map(c => ({ ...c, id: Number(c.id) }))

    setTeachers(teacherList)
    setClasses(classList)

    // one request per class to know who teaches it
    const perClass = await Promise.allSettled(
      classList.map(c => api<Teacher[]>(ROUTES.teachersInClass(c.id)))
    )
    const map: Record<number, Teacher[]> = {}
    classList.forEach((c, i) => {
      const r = perClass[i]
      map[c.id] =
        r.status === 'fulfilled' && Array.isArray(r.value)
          ? r.value.map(t => ({ ...t, id: Number(t.id) }))
          : []
    })
    setAssignments(map)

    const failed = [teacherRes, classRes, ...perClass].find(r => r.status === 'rejected') as
      | PromiseRejectedResult
      | undefined
    if (failed) {
      setError(
        failed.reason?.message === 'Failed to fetch'
          ? 'Cannot reach the server. Check that the backend is running.'
          : failed.reason?.message || 'Something went wrong'
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const classIdsOfTeacher = (teacherId?: number) =>
    classes.filter(c => (assignments[c.id] || []).some(t => t.id === teacherId)).map(c => c.id)

  const handleSaved = (message: string) => {
    setAssignModal(null)
    setMoveModal(null)
    setNotice(message)
    loadData()
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
            <p className="text-gray-600 mt-1">Assign teachers to classes and move them between classes</p>
          </div>
          <button
            onClick={() => setAssignModal({})}
            disabled={classes.length === 0 || teachers.length === 0}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Assign Teacher
          </button>
        </div>

        {notice && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 text-sm text-teal-800">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="text-teal-700 hover:text-teal-900">
              &times;
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No classes yet. Create a class first from the Classes & Students page.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(c => {
              const classTeachers = assignments[c.id] || []
              return (
                <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{c.class_name}</p>
                      {c.subjects && <p className="text-xs text-gray-500 mt-0.5">{c.subjects}</p>}
                    </div>
                    <span className="text-xs text-gray-500">
                      {classTeachers.length} {classTeachers.length === 1 ? 'teacher' : 'teachers'}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-2 flex-1">
                    {classTeachers.length === 0 ? (
                      <li className="text-sm text-gray-400 italic">No teacher assigned</li>
                    ) : (
                      classTeachers.map(t => (
                        <li key={t.id ?? teacherName(t)} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-gray-800">
                            <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[11px] font-bold">
                              {initials(teacherName(t))}
                            </span>
                            {teacherName(t)}
                          </span>
                          <button
                            onClick={() => setMoveModal({ teacher: t, fromClass: c })}
                            disabled={classes.length < 2}
                            className="text-xs text-teal-700 hover:underline disabled:opacity-40 disabled:no-underline"
                          >
                            Move
                          </button>
                        </li>
                      ))
                    )}
                  </ul>

                  <button
                    onClick={() => setAssignModal({ className: c.class_name })}
                    disabled={teachers.length === 0}
                    className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    + Assign teacher to {c.class_name}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {assignModal && (
          <AssignModal
            teachers={teachers}
            classes={classes}
            assignments={assignments}
            presetClassName={assignModal.className}
            onClose={() => setAssignModal(null)}
            onSaved={handleSaved}
          />
        )}
        {moveModal && (
          <MoveModal
            teacher={moveModal.teacher}
            fromClass={moveModal.fromClass}
            classes={classes}
            teacherClassIds={classIdsOfTeacher(moveModal.teacher.id)}
            onClose={() => setMoveModal(null)}
            onSaved={handleSaved}
          />
        )}
      </div>
    </AdminLayout>
  )
}