import { Header } from './components/landing/Header'
import { Hero } from './components/landing/Hero'
import { TrustBar } from './components/landing/TrustBar'

import { CtaPanel } from './components/landing/CtaPanel'
import { Footer } from './components/landing/Footer'

function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
      >
        Skip to content
      </a>

      <Header />

      <main id="main">
        <Hero />
        <TrustBar />
        
        <CtaPanel />
      </main>

      <Footer />
    </>
  )
}

export default App
