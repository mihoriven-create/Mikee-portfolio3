import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { About } from './components/About'
import { Approach } from './components/Approach'
import { Capabilities } from './components/Capabilities'
import { Contact } from './components/Contact'
import { Education } from './components/Education'
import { Experience } from './components/Experience'
import { Feedback } from './components/Feedback'
import { Hero } from './components/Hero'
import { Loader } from './components/Loader'
import { Nav } from './components/Nav'
import { Organizations } from './components/Organizations'
import { Work } from './components/Work'
import { WorkflowSignal } from './components/WorkflowSignal'
import { useContactGlide, useReveal, useSmoothScroll } from './lib/motion'
import { useMediaQuery } from './lib/useMediaQuery'

const Scene = lazy(() => import('./components/Scene/Scene'))
const OrbTraveler = lazy(() => import('./components/OrbTraveler'))

export default function App() {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const mobile = useMediaQuery('(max-width: 767px)')
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  useSmoothScroll(!reducedMotion)
  useReveal(!reducedMotion)
  useContactGlide(!reducedMotion)

  // Expanding details, tabs or the contact form changes the page height; re-measure scroll positions.
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    let timer = 0
    let lastHeight = main.offsetHeight
    const observer = new ResizeObserver(() => {
      if (Math.abs(main.offsetHeight - lastHeight) < 2) return
      lastHeight = main.offsetHeight
      clearTimeout(timer)
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 150)
    })
    observer.observe(main)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [])

  return (
    <>
      <Loader ready={ready} />

      <div className="fixed inset-0 z-0 [filter:var(--scene-filter)] [transition:filter_600ms_ease]" aria-hidden>
        <Suspense fallback={null}>
          <Scene mobile={mobile} reducedMotion={reducedMotion} onReady={onReady} />
        </Suspense>
      </div>

      <Nav />

      <main className="relative z-10">
        <Hero ready={ready} reducedMotion={reducedMotion} />
        {/* The Approach sits directly over the maze, with no scrim */}
        <Approach reducedMotion={reducedMotion} />

        {/* Each section walks one stretch of the maze. A soft dark column sits behind the centred
            content only, so the left and right edges of the screen stay clear. The camera takes a
            turn as Selected Work, What I Work On, Systems People Rely On and In Their Words arrive. */}
        <div className="relative isolate">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-bg/60 [mask-image:linear-gradient(to_bottom,transparent,black_20vh,black_calc(100%_-_20vh),transparent)] md:bg-transparent md:bg-[linear-gradient(to_right,transparent,rgba(7,3,10,0.6)_16%,rgba(7,3,10,0.66)_50%,rgba(7,3,10,0.6)_84%,transparent)]"
          />
          <Work reducedMotion={reducedMotion} />
          <Capabilities />
          <About reducedMotion={reducedMotion} />
          <Experience />
          <Organizations />
          <Education />
          <Feedback />
        </div>

        <Contact />
      </main>

      {/* The lead workflow pulse beside The Approach, and the orb that follows the page to Contact */}
      <WorkflowSignal reducedMotion={reducedMotion} />
      {ready && (
        <Suspense fallback={null}>
          <OrbTraveler reducedMotion={reducedMotion} />
        </Suspense>
      )}
    </>
  )
}
