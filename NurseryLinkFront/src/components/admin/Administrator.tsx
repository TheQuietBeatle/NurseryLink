import { useEffect, useState } from 'react'

type Privilege = {
  id: number
  description: string
}

export function Administrator() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [primaryRole, setPrimaryRole] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Step 1: fetched privilege catalog
  const [availablePrivileges, setAvailablePrivileges] = useState<Privilege[]>([])

  // Step 2: permissions now keyed by privilege id instead of five hardcoded names
  const [permissions, setPermissions] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetch('http://localhost:3000/GetPriviledges', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then((data: Privilege[]) => {
        setAvailablePrivileges(data)
        const initial: Record<number, boolean> = {}
        data.forEach(p => { initial[p.id] = false })
        setPermissions(initial)
      })
      .catch(error => {
        console.error('Error fetching privileges:', error)
      })
  }, [])

  // Step 3: toggle handler now takes a privilege id
  const handlePermissionToggle = (privilegeId: number) => {
    setPermissions(prev => ({
      ...prev,
      [privilegeId]: !prev[privilegeId]
    }))
  }

  // Step 6: cancel rebuilds the permissions map from the fetched list
  const handleCancel = () => {
    setFullName('')
    setEmail('')
    setPrimaryRole('')
    setUsername('')
    setPassword('')
    const reset: Record<number, boolean> = {}
    availablePrivileges.forEach(p => { reset[p.id] = false })
    setPermissions(reset)
  }

  const handleCreate = async () => {
    const token = localStorage.getItem('token')

    try {
      if (!primaryRole.trim()) {
        alert('Please select a role')
        return
      }
      //function .trim makes the big space like this " " trated like short space
      if(!username.trim() || !fullName.trim() || !email.trim() || !password.trim()) {
        alert('Please fill in all required fields')
        return
      }

      const response = await fetch('http://localhost:3000/CreateAccount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username,
          full_name: fullName,
          email: email,
          password: password,
          role: primaryRole
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`Error creating account: ${errorData.message || 'Unknown error'}`)
        return
      }

      // Step 7: read the new account id from the RETURNING-backed response
      const data = await response.json()
      const newAccountId = data.account.id

      // Step 8: only for admins with at least one checked privilege
      const checkedIds = Object.entries(permissions)
        .filter(([_, enabled]) => enabled)
        .map(([id]) => Number(id))

      if (primaryRole === 'admin' && checkedIds.length > 0) {
        console.log('Assigning privileges:', checkedIds, 'to account ID:', newAccountId)
        const assignResponse = await fetch('http://localhost:3000/AssignPrivilege', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            account_id: newAccountId,
            privilege_ids: checkedIds
          })
        })

        // Step 9: distinct messaging since the account already exists at this point
        if (!assignResponse.ok) {
          console.log('Privilege assignment failed:', assignResponse.status, assignResponse.statusText)
          const assignError = await assignResponse.json().catch(() => ({}))
          alert(
            `Administrator account created, but assigning privileges failed: ${
              assignError.message || 'Unknown error'
            }`
          )
          handleCancel()
          return
        }
      }

      alert(`${primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1)} account created successfully!`)
      handleCancel()
    } catch (error) {
      console.error('Error creating account:', error)
      alert('Error creating account')
    }
  }

  // Step 5: capabilities derived straight from the fetched list, no separate labels map
  const grantedCapabilities = primaryRole === 'admin'
    ? availablePrivileges
        .filter(p => permissions[p.id])
        .map(p => p.description)
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-medium">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-2">
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users
            </a>
            <a href="#" className="flex items-center px-4 py-2 bg-teal-50 text-teal-700 rounded-lg font-medium">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Administrators
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Reports
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Create New Account</h1>
              <p className="text-gray-600 mt-1">Add a new account to the system </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Account Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {primaryRole === 'admin' ? 'Admin Account Details' :
                     primaryRole === 'parent' ? 'Parent Account Details' :
                     primaryRole === 'teacher' ? 'Teacher Account Details' : 'Account Details'}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder={`Enter ${primaryRole === 'admin' ? 'administrator' : primaryRole === 'parent' ? 'parent' : primaryRole === 'teacher' ? 'teacher' : 'user'}'s full name`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Enter password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Role Designation
                      </label>
                      <select
                        value={primaryRole}
                        onChange={(e) => setPrimaryRole(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Select role...</option>
                        <option value="parent">Parent</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Access Permissions - Only show for Admin role, driven by fetched privileges */}
                {primaryRole === 'admin' && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Access Permissions</h2>

                    <div className="space-y-3">
                      {availablePrivileges.length === 0 && (
                        <p className="text-sm text-gray-500 italic">Loading available privileges...</p>
                      )}
                      {availablePrivileges.map(privilege => (
                        <div key={privilege.id} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{privilege.description}</span>
                          </div>
                          <button
                            onClick={() => handlePermissionToggle(privilege.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              permissions[privilege.id] ? 'bg-teal-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                permissions[privilege.id] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    {primaryRole === 'admin' ? 'Create Administrator' :
                     primaryRole === 'parent' ? 'Create Parent' :
                     primaryRole === 'teacher' ? 'Create Teacher' : 'Create Account'}
                  </button>
                </div>
              </div>

              {/* Profile Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Profile Summary</h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        The new {primaryRole === 'admin' ? 'administrator' : primaryRole === 'parent' ? 'parent' : primaryRole === 'teacher' ? 'teacher' : 'user'} will receive:
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mr-2 mt-0.5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>System access credentials</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mr-2 mt-0.5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Email notification setup</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-4 h-4 mr-2 mt-0.5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Dashboard access</span>
                        </li>
                      </ul>
                    </div>

                    {primaryRole === 'admin' && (
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">Granted Capabilities:</p>
                        {grantedCapabilities.length > 0 ? (
                          <ul className="text-sm text-gray-700 space-y-1">
                            {grantedCapabilities.map((capability, index) => (
                              <li key={index} className="flex items-start">
                                <svg className="w-4 h-4 mr-2 mt-0.5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{capability}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No capabilities granted yet</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}