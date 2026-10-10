import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AdminLayout } from './adminPortal';
import { getApiUrl } from '../../lib/api';

const API = getApiUrl()

type ClassItem = { id: number; class_name: string; subjects?: string | null }
type Child = {
  id: number
  name: string
  date_of_birth: string
  class_id: number
  summary_log?: string | null
}

// Your controllers reply with plain text on errors and some successes, JSON on others
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
    throw new Error(typeof data === 'string' ? data : data?.message || 'Request failed')
  }
  return data
}

function formatDate(value: string) {
  const d = new Date(value)
  return isNaN(d.getTime())
    ? '-'
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAge(value: string) {
  const birth = new Date(value)
  if (isNaN(birth.getTime())) return ''
  const now = new Date()
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) months--
  if (months < 0) return ''
  return `${Math.floor(months / 12)}y ${months % 12}m`
}

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

function CreateClassModal({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const [className, setClassName] = useState('')
  const [subjects, setSubjects] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!className.trim()) {
      setError('Class name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api('/class/CreateClass', {
        method: 'POST',
        body: JSON.stringify({ class_name: className.trim(), subjects: subjects.trim() || null }),
      })
      onSaved(`Class "${className.trim()}" created`)
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Create Class" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
          <input className={inputClass} value={className} onChange={e => setClassName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
          <input
            className={inputClass}
            value={subjects}
            onChange={e => setSubjects(e.target.value)}
            placeholder="e.g. Art, Music, Numbers"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Class'}
        </button>
      </div>
    </Modal>
  )
}

function AddStudentModal({
  classes,
  onClose,
  onSaved,
}: {
  classes: ClassItem[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  // const[studentCode, setStudentCode] = useState('')
  const [className, setClassName] = useState(classes[0]?.class_name ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!name.trim() || !dob || !className) {
      setError('Name, date of birth and class are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = await api('/child/addChild', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), date_of_birth: dob, class_name: className }),
      })
      console.log('Added student:', data)
      onSaved(`Student added Successfully`)
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Add New Student" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
            <input
              type="date"
              className={inputClass}
              value={dob}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setDob(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
            <select className={inputClass} value={className} onChange={e => setClassName(e.target.value)}>
              {classes.map(c => (
                <option key={c.id} value={c.class_name}>
                  {c.class_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500">The student code is generated automatically.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add Student'}
        </button>
      </div>
    </Modal>
  )
}

function TransferModal({
  child,
  currentClassName,
  classes,
  onClose,
  onSaved,
}: {
  child: Child
  currentClassName: string
  classes: ClassItem[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const options = classes.filter(c => c.id !== child.class_id)
  const [destination, setDestination] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!destination) {
      setError('Please choose a destination class')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api('/child/transferChildToClass', {
        method: 'PUT',
        body: JSON.stringify({ child_id: child.id, new_class_name: destination }),
      })
      onSaved(`${child.name} transferred to ${destination}`)
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Transfer Student" onClose={onClose}>
      <div className="p-3 rounded-lg bg-teal-50 border-l-4 border-teal-600 text-sm text-gray-700">
        The transfer only affects future activity. Past attendance and incident records stay with the
        original class.
      </div>
      <div className="p-4 rounded-lg bg-gray-50 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{child.name}</p>
          <p className="text-sm text-teal-700 font-mono">Code: {child.id}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Current class</p>
          <p className="text-sm font-medium text-gray-900">{currentClassName}</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Destination Class *</label>
        <select className={inputClass} value={destination} onChange={e => setDestination(e.target.value)}>
          <option value="">-- Choose class --</option>
          {options.map(c => (
            <option key={c.id} value={c.class_name}>
              {c.class_name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? 'Transferring...' : 'Confirm Transfer'}
        </button>
      </div>
    </Modal>
  )
}

export function ClassesStudents() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all') // class id or 'all'

  const [showClassModal, setShowClassModal] = useState(false)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [transferChild, setTransferChild] = useState<Child | null>(null)

  const loadData = async () => {
    try {
      setError('')
      const [classData, childData] = await Promise.all([
        api<ClassItem[]>('/class/GetClasses'),
        api<Child[]>('/child/getchildren'),
      ])
      setClasses(classData)
      setChildren(childData)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const classNameById = useMemo(() => {
    const map: Record<number, string> = {}
    classes.forEach(c => {
      map[c.id] = c.class_name
    })
    return map
  }, [classes])

  const countByClass = useMemo(() => {
    const map: Record<number, number> = {}
    children.forEach(ch => {
      map[ch.class_id] = (map[ch.class_id] || 0) + 1
    })
    return map
  }, [children])

  const visibleChildren = useMemo(() => {
    const q = search.trim().toLowerCase()
    return children.filter(ch => {
      const matchesClass = classFilter === 'all' || String(ch.class_id) === classFilter
      const matchesSearch =
        !q || ch.name.toLowerCase().includes(q) || String(ch.id).includes(q)
      return matchesClass && matchesSearch
    })
  }, [children, search, classFilter])

  const handleSaved = (message: string) => {
    setShowClassModal(false)
    setShowStudentModal(false)
    setTransferChild(null)
    setNotice(message)
    loadData()
  }

  const resetFilters = () => {
    setSearch('')
    setClassFilter('all')
  }

  return (
    <AdminLayout>
    <div className="max-w-6xl">
      {/* Title + actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes & Students</h1>
          <p className="text-gray-600 mt-1">Manage classes and the student roster</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowClassModal(true)}
            className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 hover:bg-gray-50"
          >
            + Create Class
          </button>
          <button
            onClick={() => setShowStudentModal(true)}
            disabled={classes.length === 0}
            title={classes.length === 0 ? 'Create a class first' : ''}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add New Student
          </button>
        </div>
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
      ) : (
        <>
          {/* Class cards */}
          {classes.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 mb-6">
              No classes yet. Create your first class to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {classes.map(c => {
                const active = classFilter === String(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => setClassFilter(active ? 'all' : String(c.id))}
                    className={`text-left bg-white rounded-lg border p-4 transition-colors ${
                      active ? 'border-teal-600 ring-1 ring-teal-600' : 'border-gray-200 hover:border-teal-400'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{c.class_name}</p>
                    {c.subjects && <p className="text-xs text-gray-500 mt-0.5 truncate">{c.subjects}</p>}
                    <p className="text-sm text-gray-700 mt-3">
                      <span className="font-semibold">{countByClass[c.id] || 0}</span> students
                    </p>
                  </button>
                )
              })}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
            <input
              className={`${inputClass} md:max-w-md`}
              placeholder="Search by name or student code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className={`${inputClass} md:w-56`}
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
            >
              <option value="all">All Classes ({children.length})</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.class_name} ({countByClass[c.id] || 0})
                </option>
              ))}
            </select>
            <button
              onClick={resetFilters}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>

          {/* Roster table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="px-4 py-3">Student Code</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">DOB & Age</th>
                    <th className="px-4 py-3">Current Class</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                  {visibleChildren.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                        {children.length === 0
                          ? 'No students enrolled yet.'
                          : 'No students match your filters.'}
                      </td>
                    </tr>
                  ) : (
                    visibleChildren.map(ch => (
                      <tr key={ch.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-mono font-semibold">
                            {ch.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {initials(ch.name)}
                            </div>
                            <span className="font-medium text-gray-900">{ch.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span>{formatDate(ch.date_of_birth)}</span>
                            <span className="text-xs text-gray-500">{formatAge(ch.date_of_birth)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            {classNameById[ch.class_id] ?? 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setTransferChild(ch)}
                            disabled={classes.length < 2}
                            title={classes.length < 2 ? 'Need at least two classes' : ''}
                            className="px-3 py-1 rounded text-teal-700 hover:bg-teal-50 disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            Transfer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-600 border-t border-gray-200">
              Showing <strong>{visibleChildren.length}</strong> of <strong>{children.length}</strong> students
            </div>
          </div>
        </>
      )}

      {showClassModal && (
        <CreateClassModal onClose={() => setShowClassModal(false)} onSaved={handleSaved} />
      )}
      {showStudentModal && (
        <AddStudentModal
          classes={classes}
          onClose={() => setShowStudentModal(false)}
          onSaved={handleSaved}
        />
      )}
      {transferChild && (
        <TransferModal
          child={transferChild}
          currentClassName={classNameById[transferChild.class_id] ?? 'Unknown'}
          classes={classes}
          onClose={() => setTransferChild(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
    </AdminLayout>
  )
}