import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { site } from '../config/site'

// Fills to ~85% while the scene boots, then completes and fades once `ready` is true.
export function Loader({ ready }: { ready: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [pct, setPct] = useState(0)
  const [gone, setGone] = useState(false)
  const state = useRef({ v: 0 })

  useEffect(() => {
    const tween = gsap.to(state.current, {
      v: 85,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => setPct(Math.round(state.current.v)),
    })
    return () => {
      tween.kill()
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const tl = gsap.timeline({ onComplete: () => setGone(true) })
    tl.to(state.current, {
      v: 100,
      duration: 0.5,
      ease: 'power2.inOut',
      onUpdate: () => setPct(Math.round(state.current.v)),
    }).to(root.current, { autoAlpha: 0, duration: 0.8, ease: 'power2.out' }, '+=0.15')
    return () => {
      tl.kill()
    }
  }, [ready])

  if (gone) return null

  return (
    <div ref={root} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-red animate-pulse-dot" />
        <span className="font-display text-sm font-extrabold tracking-[0.4em] text-white">{site.wordmark}</span>
      </div>
      <div className="mt-8 h-px w-56 overflow-hidden bg-white/10">
        <div ref={bar} className="h-full bg-gradient-to-r from-blood via-red to-ember shadow-glow" style={{ width: `${pct}%` }} />
      </div>
      <p className="label mt-4 tabular-nums">
        Initializing network · {pct.toString().padStart(3, '0')}%
      </p>
    </div>
  )
}
