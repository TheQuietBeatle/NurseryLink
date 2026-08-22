import { Routes, Route } from 'react-router-dom'
import { Header } from './components/parents/Header'
import { Hero } from './components/landing/Hero'
import { TrustBar } from './components/landing/TrustBar'

import { CtaPanel } from './components/landing/CtaPanel'
import { Footer } from './components/landing/Footer'
import { SignIn } from './components/signpage/signing'
import { ParentDashboard } from './components/parents/ParentDashboard'

function Landing() {
  return (
    <>
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

function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
      >
        Skip to content
      </a>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/parent" element={<ParentDashboard />} />
      </Routes>
    </>
  )
}

export default App
