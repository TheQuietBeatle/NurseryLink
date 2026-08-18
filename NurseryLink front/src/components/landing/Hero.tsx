import lockupUrl from '../../assets/nurserylink-lockup.png'

export function Hero() {
  return (
    <section
      id="top"
      className="bg-grain relative isolate overflow-hidden px-5 pt-8 pb-10 sm:px-8 sm:pt-16 sm:pb-16 lg:pt-16 lg:pb-16"
    >
      {/* Soft light behind the crest, so the paper never reads as flat white. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-14rem] -z-10 h-[34rem] w-[46rem] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(62,124,138,0.20),transparent)] blur-2xl"
      />

      <div className="mx-auto max-w-3xl text-center">
        <div
          className="reveal mx-auto mb-9 grid h-36 w-72 place-items-center rounded-2xl border border-rule bg-paper-raised px-4 shadow-card sm:mb-11 sm:h-44 sm:w-80"
          style={{ animationDelay: '40ms' }}
        >
          <img src={lockupUrl} alt="NurseryLink" className="h-32 w-auto sm:h-36" />
        </div>

        <h1
          className="reveal text-display text-teal-900"
          style={{ animationDelay: '120ms' }}
        >
          Seamless tracking for those who matter most.
        </h1>

        <p
          className="reveal mx-auto mt-5 max-w-xl text-[0.9375rem] text-ink-soft sm:mt-6 sm:text-base"
          style={{ animationDelay: '200ms' }}
        >
          A professional, clinical-grade management suite for modern nurseries.
          Trusted by administrators, teachers, and parents.
        </p>

        <div
          className="reveal mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center"
          style={{ animationDelay: '280ms' }}
        >
          <button
            onClick={() => alert('Sign in / Register')}
            className="rounded-lg bg-teal-700 px-7 py-3.5 text-center text-sm font-semibold text-paper shadow-card transition-all duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:bg-teal-900 hover:shadow-lift active:translate-y-0"
          >
                     Sign in / Register

          </button>
          <a
            href="#learnmore"
            className="group rounded-lg border border-rule bg-paper-raised px-7 py-3.5 text-center text-sm font-semibold text-teal-900 transition-all duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-card"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="h-3.5 w-3.5 fill-teal-500 transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M4.5 2.6 13 8l-8.5 5.4z" />
              </svg>
              Learn about us more
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
