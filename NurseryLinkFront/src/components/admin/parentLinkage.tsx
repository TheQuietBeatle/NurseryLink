import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AdminLayout } from './adminPortal'
import { getApiUrl } from '../../lib/api'

const API = getApiUrl()

type LinkedChild = { id: number; name: string }
type Parent = {
  id: number
  full_name: string
  username?: string
  email?: string
  is_active?: boolean
  children: LinkedChild[]
}
type Student = { id: number; name: string; class_id?: number }
type ClassItem = { id: number; class_name: string }

const ROUTES = {
  parents: '/parent/getParents',
  students: '/child/getchildren',
  classes: '/class/GetClasses',
  createAccount: '/account/CreateAccount',
  assign: '/parent/assignParentToChild',
  remove: '/parent/removeParentLinkage',
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
    if (typeof data === 'string' && data.trim().startsWith('<!DOCTYPE')) {
      throw new Error(`Route not found: ${path}`)
    }
    throw new Error(
      typeof data === 'string' ? data : data?.error || data?.message || 'Request failed'
    )
  }
  return data
}

function listOf<T>(r: PromiseSettledResult<unknown>): T[] {
  return r.status === 'fulfilled' && Array.isArray(r.value) ? (r.value as T[]) : []
}

// accepts either [...] or { parents: [...] }
function parentList(r: PromiseSettledResult<unknown>): Parent[] {
  if (r.status !== 'fulfilled') return []
  if (Array.isArray(r.value)) return r.value as Parent[]
  if (r.value && typeof r.value === 'object' && Array.isArray((r.value as { parents?: unknown }).parents)) {
    return (r.value as { parents: Parent[] }).parents
  }
  return []
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

// ---------- Register parent account (and link the first student) ----------
function RegisterParentModal({
  students,
  classNameById,
  onClose,
  onDone,
}: {
  students: Student[]
  classNameById: Record<number, string>
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentId, setStudentId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim() || !studentId) {
      setError('All fields are required, including the first linked student')
      return
    }
    const student = students.find(s => s.id === Number(studentId))
    if (!student) {
      setError('Please choose a student')
      return
    }

    setSaving(true)
    setError('')

    // 1) create the account
    let parentId = NaN
    try {
      const created = await api(ROUTES.createAccount, {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          role: 'parent',
        }),
      })
      parentId = Number(created?.account?.id)
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
      return
    }

    if (Number.isNaN(parentId)) {
      onDone(
        `Parent account created, but its id was not returned, so ${student.name} could not be linked. Use Manage Links to finish.`
      )
      return
    }

    // 2) link the first student
    try {
      await api(ROUTES.assign, {
        method: 'POST',
        body: JSON.stringify({ parent_name: fullName.trim(), child_name: student.name }),
      })
      onDone(`Parent account created and linked to ${student.name}`)
    } catch (e: any) {
      onDone(
        `Account created, but linking to ${student.name} failed (${e.message}). Use Manage Links to finish.`
      )
    }
  }

  return (
    <Modal title="Register Parent Account" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input className={inputClass} value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input className={inputClass} value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
          <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Linked Student *</label>
          <select className={inputClass} value={studentId} onChange={e => setStudentId(e.target.value)}>
            <option value="">-- Choose student --</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} (code {s.id}){s.class_id ? ` • ${classNameById[s.class_id] ?? ''}` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Every parent must be linked to at least one student. More can be added afterwards.
          </p>
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
          {saving ? 'Creating...' : 'Create Parent'}
        </button>
      </div>
    </Modal>
  )
}

// ---------- Page ----------
export function ParentManagement() {
  const [parents, setParents] = useState<Parent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unlinked' | 'linked'>('all')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [showRegister, setShowRegister] = useState(false)
  const [studentToLink, setStudentToLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [panelError, setPanelError] = useState('')
  const [unlinkTarget, setUnlinkTarget] = useState<LinkedChild | null>(null)
  const [unlinkError, setUnlinkError] = useState('')

  const loadData = async () => {
    setError('')
    const [pRes, sRes, cRes] = await Promise.allSettled([
      api(ROUTES.parents),
      api(ROUTES.students),
      api(ROUTES.classes),
    ])

    setParents(
      parentList(pRes).map(p => ({
        ...p,
        id: Number(p.id),
        children: (Array.isArray(p.children) ? p.children : []).map((c: any) => ({
          id: Number(c.id),
          name: c.name,
        })),
      }))
    )
    setStudents(listOf<any>(sRes).map(s => ({ ...s, id: Number(s.id) })))
    setClasses(listOf<any>(cRes).map(c => ({ ...c, id: Number(c.id) })))

    const failed = [pRes, sRes, cRes].find(r => r.status === 'rejected') as
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

  const classNameById = useMemo(() => {
    const map: Record<number, string> = {}
    classes.forEach(c => {
      map[c.id] = c.class_name
    })
    return map
  }, [classes])

  const selected = parents.find(p => p.id === selectedId) ?? null
  const unlinkedCount = parents.filter(p => p.children.length === 0).length

  const visibleParents = useMemo(() => {
    const q = search.trim().toLowerCase()
    return parents.filter(p => {
      const matchesFilter =
        filter === 'all' || (filter === 'unlinked' ? p.children.length === 0 : p.children.length > 0)
      const matchesSearch =
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.username || '').toLowerCase().includes(q) ||
        p.children.some(c => c.name.toLowerCase().includes(q))
      return matchesFilter && matchesSearch
    })
  }, [parents, search, filter])

  const selectParent = (id: number) => {
    setSelectedId(id)
    setStudentToLink('')
    setPanelError('')
  }

  const availableStudents = selected
    ? students.filter(s => !selected.children.some(c => c.id === s.id))
    : []

  const linkStudent = async () => {
    if (!selected || !studentToLink) return
    const student = students.find(s => s.id === Number(studentToLink))
    if (!student) return
    setBusy(true)
    setPanelError('')
    try {
      await api(ROUTES.assign, {
        method: 'POST',
        body: JSON.stringify({ parent_name: selected.full_name, child_name: student.name }),
      })
      setNotice(`${student.name} linked to ${selected.full_name}`)
      setStudentToLink('')
      await loadData()
    } catch (e: any) {
      setPanelError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const confirmUnlink = async () => {
    if (!selected || !unlinkTarget) return
    setBusy(true)
    setUnlinkError('')
    try {
      await api(ROUTES.remove, {
        method: 'DELETE',
        body: JSON.stringify({ parent_name: selected.full_name, child_name: unlinkTarget.name }),
      })
      setNotice(`${unlinkTarget.name} unlinked from ${selected.full_name}`)
      setUnlinkTarget(null)
      await loadData()
    } catch (e: any) {
      setUnlinkError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleRegistered = (message: string) => {
    setShowRegister(false)
    setNotice(message)
    loadData()
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        {/* Title + actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parent Management</h1>
            <p className="text-gray-600 mt-1">
              Manage parent accounts and which students they are linked to. Links decide what each
              parent can see and who receives notifications.
            </p>
          </div>
          <button
            onClick={() => setShowRegister(true)}
            disabled={students.length === 0}
            title={students.length === 0 ? 'Add a student first' : ''}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Register Parent Account
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
        ) : (
          <>
            {/* Summary (computed from the loaded parents) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Total Parents</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{parents.length}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Linked to Students</p>
                <p className="text-2xl font-semibold text-teal-700 mt-1">{parents.length - unlinkedCount}</p>
              </div>
              <div
                className={`rounded-lg border p-4 ${
                  unlinkedCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
                }`}
              >
                <p className="text-xs uppercase tracking-wider text-gray-500">Needs a Link</p>
                <p
                  className={`text-2xl font-semibold mt-1 ${
                    unlinkedCount > 0 ? 'text-amber-700' : 'text-gray-900'
                  }`}
                >
                  {unlinkedCount}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
              <input
                className={`${inputClass} md:max-w-md`}
                placeholder="Search by parent, username, email or student..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select
                className={`${inputClass} md:w-56`}
                value={filter}
                onChange={e => setFilter(e.target.value as 'all' | 'unlinked' | 'linked')}
              >
                <option value="all">All parents ({parents.length})</option>
                <option value="unlinked">Needs a link ({unlinkedCount})</option>
                <option value="linked">Linked ({parents.length - unlinkedCount})</option>
              </select>
              <button
                onClick={loadData}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              {/* Parents table */}
              <div className="xl:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                        <th className="px-4 py-3">Parent</th>
                        <th className="px-4 py-3">Username & Email</th>
                        <th className="px-4 py-3">Linked Students</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                      {visibleParents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                            {parents.length === 0
                              ? 'No parent accounts yet. Register one to get started.'
                              : 'No parents match your filters.'}
                          </td>
                        </tr>
                      ) : (
                        visibleParents.map(p => {
                          const isSelected = p.id === selectedId
                          const needsLink = p.children.length === 0
                          return (
                            <tr
                              key={p.id}
                              onClick={() => selectParent(p.id)}
                              className={`cursor-pointer align-top ${
                                isSelected
                                  ? 'bg-teal-50'
                                  : needsLink
                                  ? 'bg-amber-50/60 hover:bg-amber-50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                                    {initials(p.full_name)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">{p.full_name}</span>
                                    {needsLink && (
                                      <span className="text-[11px] font-semibold text-amber-700">
                                        NEEDS ATTENTION
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-teal-700 font-medium">
                                    {p.username ? `@${p.username}` : '-'}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate">{p.email}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {needsLink ? (
                                  <span className="inline-flex px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                                    0 students linked
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {p.children.map(c => (
                                      <span
                                        key={c.id}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                                      >
                                        {c.name}
                                        <span className="font-mono text-gray-500">({c.id})</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {p.is_active === false ? (
                                  <span className="inline-flex px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                                    Inactive
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    selectParent(p.id)
                                  }}
                                  className="px-3 py-1 rounded text-teal-700 hover:bg-teal-100"
                                >
                                  {needsLink ? 'Assign Link' : 'Manage Links'}
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-gray-50 text-xs text-gray-600 border-t border-gray-200">
                  Showing <strong>{visibleParents.length}</strong> of <strong>{parents.length}</strong> parents
                </div>
              </div>

              {/* Student links panel */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 xl:sticky xl:top-6">
                {!selected ? (
                  <div className="text-center text-gray-500 py-10">
                    <p className="font-medium text-gray-700">Student Links</p>
                    <p className="text-sm mt-1">Select a parent to see and edit their linked students.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-teal-700 font-semibold">
                        Student Links
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">
                          {initials(selected.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{selected.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {selected.username ? `@${selected.username} • ` : ''}
                            {selected.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Linked students */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">Currently linked</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {selected.children.length}{' '}
                          {selected.children.length === 1 ? 'student' : 'students'}
                        </span>
                      </div>

                      {selected.children.length === 0 ? (
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                          No students linked yet. Add one below.
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {selected.children.map(c => {
                            const lastLink = selected.children.length <= 1
                            return (
                              <li
                                key={c.id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                                  <p className="text-xs text-gray-500 font-mono">Code {c.id}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setUnlinkError('')
                                    setUnlinkTarget(c)
                                  }}
                                  disabled={lastLink}
                                  title={
                                    lastLink
                                      ? 'A parent must stay linked to at least one student. Link another student first.'
                                      : ''
                                  }
                                  className="px-2.5 py-1 rounded text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent"
                                >
                                  Unlink
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      {selected.children.length === 1 && (
                        <p className="text-xs text-gray-500 mt-2">
                          A parent must keep at least one student. To replace this link, add the new student
                          first, then unlink the old one.
                        </p>
                      )}
                    </div>

                    {/* Add link */}
                    <div className="rounded-lg bg-gray-50 p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">Add student link</h4>
                      <select
                        className={inputClass}
                        value={studentToLink}
                        onChange={e => setStudentToLink(e.target.value)}
                      >
                        <option value="">-- Choose student --</option>
                        {availableStudents.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} (code {s.id})
                            {s.class_id ? ` • ${classNameById[s.class_id] ?? ''}` : ''}
                          </option>
                        ))}
                      </select>
                      {availableStudents.length === 0 && (
                        <p className="text-xs text-gray-500">This parent is already linked to every student.</p>
                      )}
                      {panelError && <p className="text-sm text-red-600">{panelError}</p>}
                      <button
                        onClick={linkStudent}
                        disabled={!studentToLink || busy}
                        className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busy ? 'Saving...' : 'Add Link'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {showRegister && (
          <RegisterParentModal
            students={students}
            classNameById={classNameById}
            onClose={() => setShowRegister(false)}
            onDone={handleRegistered}
          />
        )}

        {unlinkTarget && selected && (
          <Modal title="Unlink student?" onClose={() => setUnlinkTarget(null)}>
            <p className="text-sm text-gray-600">
              Remove <strong className="text-gray-900">{unlinkTarget.name}</strong> (code {unlinkTarget.id}) from{' '}
              <strong className="text-gray-900">{selected.full_name}</strong>? The parent will no longer see
              this student or receive notifications about them.
            </p>
            {unlinkError && <p className="text-sm text-red-600">{unlinkError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setUnlinkTarget(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnlink}
                disabled={busy}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? 'Removing...' : 'Confirm Unlink'}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  )
}
