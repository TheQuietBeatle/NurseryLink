import { useEffect, useState } from 'react'
import { Logo } from '../landing/Logo'
import type { Account } from '../../lib/api'

const NAV = [
  { label: 'Temperature History', href: '#temperature_history' },
  { label: 'Incident History', href: '#incident_history' },
  { label: 'Meal History', href: '#meal_history' },
  { label: 'Supply History', href: '#supply_history' },
]

export function Header({ account }: { account?: Account }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The drawer is a fixed overlay on small screens; lock the page behind it.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'border-b border-rule/80 bg-paper/85 backdrop-blur-md'
          : 'border-b border-transparent bg-paper'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:h-[4.5rem] sm:px-8">
        <a href="#top" className="shrink-0" aria-label="NurseryLink home">
          <Logo />
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7 lg:gap-9">
            {NAV.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="relative text-[0.875rem] font-medium text-ink-soft transition-colors duration-200 hover:text-teal-700 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-teal-500 after:transition-[width] after:duration-300 after:ease-[var(--ease-out-soft)] hover:after:w-full"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
         {account ? <p>{account.full_name}</p> : <p>Sign in / Register</p>}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="-mr-1.5 grid h-10 w-10 place-items-center rounded-lg text-teal-900 transition-colors hover:bg-paper-sunk md:hidden"
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={`absolute left-0 h-[1.75px] w-full rounded bg-current transition-all duration-300 ease-[var(--ease-out-soft)] ${
                  open ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-[1.75px] w-full rounded bg-current transition-opacity duration-200 ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 h-[1.75px] w-full rounded bg-current transition-all duration-300 ease-[var(--ease-out-soft)] ${
                  open ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-rule bg-paper md:hidden"
      >
        <ul className="mx-auto max-w-6xl px-5 py-3">
          {NAV.map((item, i) => (
            <li key={item.label}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${i * 45}ms` }}
                className="reveal block border-b border-rule/60 py-3.5 font-display text-lg text-teal-900"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li className="pt-4 pb-2">
            <a
              href="#demo"
              onClick={() => setOpen(false)}
              className="block rounded-lg bg-teal-700 px-4 py-3 text-center text-sm font-semibold text-paper"
            >
              Book a Demo
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}
