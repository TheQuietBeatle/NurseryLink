export function CtaPanel() {
  return (
    <section id="learnmore" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">
      <div className="bg-grain relative isolate overflow-hidden rounded-2xl border border-rule bg-paper-sunk px-6 py-14 text-center sm:px-10 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[-8rem] -z-10 mx-auto h-72 w-[36rem] max-w-full rounded-full bg-[radial-gradient(closest-side,rgba(62,124,138,0.16),transparent)] blur-2xl"
        />

        <h2 className="text-section text-teal-900">Ready to streamline your nursery?</h2>
        <p className="mx-auto mt-4  text-[1.2rem] max-w-md  text-teal-900">
          Join the modern standard in professional nursery management.
        </p> 
        <p className="mx-auto mt-2  text-[0.9375rem] text-ink-soft">
          NurseryLink is a nursery management platform built to keep everyone connected to a child's day — the people caring for them and the people who love them most. For nursery staff, it replaces scattered paper logs and end-of-day guesswork with a single, organized system: administrators manage teachers, students, parents, and class assignments from one clear dashboard, while teachers record each child's daily activity — meals and how well they ate, toilet visits, and temperature checks — in just a few taps, right as it happens. For parents, NurseryLink is a window into their child's day that was previously locked behind the nursery doors: you can see what your little one ate at lunch, follow their full temperature history, and receive instant, automatic notifications the moment something important happens, like a fever reading or an incident report that needs your attention. Every piece of information stays strictly within its proper boundaries — teachers only see the children in their own class, and parents only ever see their own children — so the trust that parents place in a nursery is protected at every level. Whether it's confirming your child arrived safely, acknowledging an incident report, or simply reading the end-of-day summary from the comfort of home, NurseryLink turns the everyday rhythm of nursery life into clear, timely, and reassuring communication — giving staff more time to focus on the children, and giving parents genuine peace of mind.</p>
        <button
          onClick={() => alert('Sign in / Register')}
          className="mt-8 inline-block rounded-lg bg-teal-700 px-8 py-3.5 text-sm font-semibold text-paper shadow-card transition-all duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:bg-teal-900 hover:shadow-lift active:translate-y-0 sm:mt-10"
        >
          Sign in / Register
        </button>
      </div>
    </section>
  )
}
