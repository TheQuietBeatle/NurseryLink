import { DarkModeToggle } from '../DarkModeToggle'
import { useNavigate } from 'react-router-dom'

export function AdminHeader() {
  const navigate = useNavigate()

  const handleSignOut = () => {
    localStorage.removeItem('account')
    localStorage.removeItem('token')
    navigate('/sign-in', { replace: true })
  }

  return (
    <header className="bg-paper-raised border-b border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-semibold text-ink">Admin Portal</h1>
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            {/* <button className="text-ink-soft hover:text-ink">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button> */}
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xl transition hover:bg-paper-sunk focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
            >
              🚪
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
