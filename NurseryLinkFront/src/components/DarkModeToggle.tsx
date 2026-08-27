import { useTheme } from '../context/ThemeContext'

export function DarkModeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex h-7 w-[3.25rem] shrink-0 items-center rounded-full border border-rule transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      style={{
        backgroundColor: isDark ? 'var(--color-teal-700)' : 'var(--color-paper-sunk)',
        borderColor: isDark ? 'var(--color-teal-700)' : 'var(--color-rule)',
      }}
    >
      {/* Sun icon */}
      <span
        aria-hidden
        className="absolute left-1.5 text-[0.7rem] transition-opacity duration-200"
        style={{ opacity: isDark ? 0 : 1 }}
      >
        ☀️
      </span>

      {/* Moon icon */}
      <span
        aria-hidden
        className="absolute right-1.5 text-[0.7rem] transition-opacity duration-200"
        style={{ opacity: isDark ? 1 : 0 }}
      >
        🌙
      </span>

      {/* Thumb */}
      <span
        className="absolute top-0.5 h-5.5 w-5.5 rounded-full shadow-sm transition-transform duration-300"
        style={{
          height: '1.375rem',
          width: '1.375rem',
          backgroundColor: isDark ? 'var(--color-paper-raised)' : 'var(--color-teal-500)',
          transform: isDark ? 'translateX(1.625rem)' : 'translateX(0.25rem)',
        }}
      />
    </button>
  )
}
