import { useEffect, useState } from 'react'
import { Logo } from '../landing/Logo'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

        
      </div>
    </header>
  )
}
