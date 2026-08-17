import markUrl from '../../assets/nurserylink-mark.png'

type LogoProps = {
  /** `on-dark` flips the wordmark to paper for use in the footer. */
  tone?: 'on-light' | 'on-dark'
  className?: string
}

/**
 * The NurseryLink mark, cut out of the master brand artwork with a transparent
 * background so it sits on any surface. Rendered from a 512px source, so it
 * stays sharp on high-DPI phones and large classroom displays alike.
 */
export function LogoMark({ className }: { className?: string }) {
  return <img src={markUrl} alt="" aria-hidden="true" className={className} />
}

export function Logo({ tone = 'on-light', className = '' }: LogoProps) {
  const onDark = tone === 'on-dark'

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-7 w-7 shrink-0" />
      <span
        className={`font-wordmark text-[1.1rem] font-semibold tracking-[-0.015em] ${
          onDark ? 'text-paper' : 'text-charcoal'
        }`}
      >
        Nursery
        <span className={onDark ? 'text-teal-300' : 'text-teal-500'}>Link</span>
      </span>
    </span>
  )
}
