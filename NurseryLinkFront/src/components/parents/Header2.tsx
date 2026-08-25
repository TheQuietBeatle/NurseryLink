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

        

        <div className="flex items-center gap-2">
         {account ? <p>{account.full_name}</p> : <p>Sign in / Register</p>}

         
        </div>
      </div>

      
    </header>
  )
}
