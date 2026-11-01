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
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-red animate-pulse-dot" />
        <span className="font-display text-sm font-extrabold tracking-[0.4em] text-white">{site.wordmark}</span>
      </div>
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
