import { Logo } from './Logo'

const LINKS = [
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Service', href: '#terms' },
  { label: 'Cookie Policy', href: '#cookies' },
  { label: 'Support', href: '#support' },
  { label: 'Careers', href: '#careers' },
]

export function Footer() {
  return (
    <footer id="contact" className="bg-teal-900 text-teal-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 sm:py-14 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo tone="on-dark" />
          <p className="mt-4 max-w-xs text-[0.8125rem] leading-relaxed text-teal-300">
            © {new Date().getFullYear()} NurseryLink. All rights reserved.
            <br />
            Professional nursery management, simplified.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-[0.8125rem] md:justify-end">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-teal-100/80 transition-colors duration-200 hover:text-paper"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
