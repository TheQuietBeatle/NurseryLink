import { useEffect, useRef, useState } from 'react'
import { Logo } from '../landing/Logo'
import type { Account } from '../../lib/api'
import { DarkModeToggle } from '../DarkModeToggle'

const NAV = [
  { label: 'Temperature History', href: '#temperature_history' },
  { label: 'Incident History', href: '#incident_history' },
  { label: 'Meal History', href: '#meal_history' },
  { label: 'Supply History', href: '#supply_history' },
]

export function Header({ account }: { account?: Account }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

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

  // These hrefs are always in-page anchors. Following them as real links
  // triggers a full browser navigation, which wipes react-router location
  // state (e.g. the selected child on the dashboard) and bounces the user
  // off the page. Scroll instead of navigating.
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.querySelector<HTMLElement>(href)
    if (!target) return
    const headerHeight = headerRef.current?.offsetHeight ?? 0
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <header
      ref={headerRef}
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
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="relative text-[0.875rem] font-medium text-ink-soft transition-colors duration-200 hover:text-teal-700 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-teal-500 after:transition-[width] after:duration-300 after:ease-[var(--ease-out-soft)] hover:after:w-full"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <DarkModeToggle />
          {account ? <p className=' cursor-pointer font-semibold'> {account.full_name}</p> : <p>Sign in / Register</p>}
          <a onClick={()=>{localStorage.removeItem('account')}} className=" font-semibold border border-teal-700 px-3 py-1 rounded-lg cursor-pointer text-teal-700 hover:bg-teal-700 hover:text-white transition-all duration-300" href="/">logout</a>
        </div>
      </div>

      
    </header>
  )
}
