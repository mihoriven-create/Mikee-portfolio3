import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { site } from '../config/site'

// Real loading steps, not a timer: the bar fills one step at a time as each actually finishes, and
// the label names the step still running. Byte-level progress of the 3D scene can't be measured,
// so no percentage is shown.
const STEPS = ['page', 'fonts', 'scene', 'render'] as const
type Step = (typeof STEPS)[number]
const LABEL: Record<Step, string> = {
  page: 'Loading page',
  fonts: 'Loading fonts',
  scene: 'Loading 3D scene',
  render: 'Rendering scene',
}

// "System initialising": segmented navy and cyan rings turning around a glowing central node.
// Decorative (the status text below is what screen readers hear); with reduced motion the global
// rule in index.css stops the spin and it shows as a still emblem.
function SystemInit() {
  return (
    <svg viewBox="0 0 120 120" className="sys-init h-24 w-24" aria-hidden>
      <defs>
        <radialGradient id="sys-init-core">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#22e3ff" />
          <stop offset="1" stopColor="#22e3ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Thin outer arcs */}
      <g className="sys-init-slow">
        <circle cx="60" cy="60" r="56" fill="none" stroke="#22b8e0" strokeOpacity="0.7" strokeWidth="1.2" strokeDasharray="44 43.96" />
      </g>
      {/* The main ring: a navy track with cyan segments running round it */}
      <circle cx="60" cy="60" r="46" fill="none" stroke="#123b73" strokeWidth="7" />
      <g className="sys-init-spin">
        <circle cx="60" cy="60" r="46" fill="none" stroke="#22e3ff" strokeWidth="7" strokeDasharray="56 88.5" />
        <circle cx="60" cy="60" r="46" fill="none" stroke="#1d6fd1" strokeWidth="7" strokeDasharray="20 124.5" strokeDashoffset="-64" />
      </g>
      {/* Tick ring, turning the other way */}
      <g className="sys-init-rev">
        <circle cx="60" cy="60" r="36" fill="none" stroke="#22e3ff" strokeOpacity="0.6" strokeWidth="3.5" strokeDasharray="1.2 3.51" />
      </g>
      {/* Bracket ring and crosshair around the node */}
      <circle cx="60" cy="60" r="21" fill="none" stroke="#1d6fd1" strokeWidth="3" strokeDasharray="26 7" transform="rotate(-45 60 60)" />
      <path d="M60 31v8M60 81v8M31 60h8M81 60h8" stroke="#22e3ff" strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round" />
      <circle className="sys-init-pulse" cx="60" cy="60" r="12" fill="url(#sys-init-core)" />
      <circle cx="60" cy="60" r="4.5" fill="#ffffff" />
    </svg>
  )
}

export function Loader({ ready }: { ready: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const [done, setDone] = useState<Record<Step, boolean>>({ page: false, fonts: false, scene: false, render: false })
  const [gone, setGone] = useState(false)
  const finish = (step: Step) => setDone((d) => (d[step] ? d : { ...d, [step]: true }))

  useEffect(() => {
    let live = true
    const mark = (step: Step) => () => live && finish(step)
    if (document.readyState === 'complete') finish('page')
    else window.addEventListener('load', mark('page'), { once: true })
    if (document.fonts) document.fonts.ready.then(mark('fonts'), mark('fonts'))
    else finish('fonts')
    // Same module App loads lazily: this waits on that download rather than starting a second one
    import('./Scene/Scene').then(mark('scene'), mark('scene'))
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (ready) finish('render')
  }, [ready])

  const count = STEPS.filter((s) => done[s]).length
  const current = STEPS.find((s) => !done[s])
  const complete = count === STEPS.length

  useEffect(() => {
    if (!complete) return
    const tween = gsap.to(root.current, { autoAlpha: 0, duration: 0.8, ease: 'power2.out', delay: 0.35, onComplete: () => setGone(true) })
    return () => {
      tween.kill()
    }
  }, [complete])

  if (gone) return null

  return (
    <div ref={root} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg" role="status" aria-live="polite">
      <SystemInit />
      <span className="mt-7 font-display text-sm font-extrabold tracking-[0.4em] text-white">{site.wordmark}</span>
      <div
        className="mt-8 h-px w-56 overflow-hidden bg-white/10"
        role="progressbar"
        aria-label="Loading"
        aria-valuemin={0}
        aria-valuemax={STEPS.length}
        aria-valuenow={count}
        aria-valuetext={complete ? 'Ready' : `${LABEL[current!]}, step ${count + 1} of ${STEPS.length}`}
      >
        <div
          className="h-full bg-gradient-to-r from-blood via-red to-ember shadow-glow transition-[width] duration-500 ease-out"
          style={{ width: `${(count / STEPS.length) * 100}%` }}
        />
      </div>
      <p className="label mt-4">{complete ? 'Ready' : `${LABEL[current!]} · ${count + 1}/${STEPS.length}`}</p>
    </div>
  )
}
