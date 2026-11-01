import { useEffect, useRef } from 'react'
import { Bell, CalendarCheck, LogOut, MessageSquare, Tag, Target, type LucideIcon } from 'lucide-react'
import { site } from '../config/site'
import { scrollToHash } from '../lib/motion'
import { SectionLabel, pad2 } from './ui'

const STEP_ICONS: LucideIcon[] = [CalendarCheck, Target, Tag, MessageSquare, Bell, LogOut]

// Timing of one pass of the signal through Fig. 01, in seconds
const TRAVEL = 3.6
const HOLD = 1.2
const RESET = 0.4

// First section after the hero: the approach statement and FIG. 01, a real GoHighLevel workflow.
// A blue signal travels the line; each numbered light 1–6 switches on as the signal reaches it.
export function Approach({ reducedMotion }: { reducedMotion: boolean }) {
  const { approach } = site
  const steps = approach.figure.steps
  const track = useRef<HTMLDivElement>(null)
  const nodes = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    const setProgress = (p: number, fade = 1) => {
      track.current?.style.setProperty('--p', p.toFixed(4))
      track.current?.style.setProperty('--fade', fade.toFixed(3))
      nodes.current.forEach((n, i) => {
        if (n) n.dataset.lit = String(p >= i / (steps.length - 1) - 0.002 && fade > 0.5)
      })
    }
    if (reducedMotion) {
      setProgress(1)
      return
    }
    let raf = 0
    const start = performance.now()
    const cycle = TRAVEL + HOLD + RESET
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const t = ((now - start) / 1000) % cycle
      if (t < TRAVEL) {
        const x = t / TRAVEL
        setProgress(x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2) // ease in-out
      } else if (t < TRAVEL + HOLD) setProgress(1)
      else setProgress(1, 1 - (t - TRAVEL - HOLD) / RESET)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion, steps.length])

  return (
    <section id="approach" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-20 pt-24 sm:px-8">
      <div data-reveal>
        <SectionLabel>{approach.label}</SectionLabel>
        <p className="mt-6 max-w-4xl text-balance font-grotesk text-2xl font-medium leading-snug text-white [text-shadow:0_2px_24px_rgba(7,3,10,0.9)] sm:text-4xl">
          {approach.statement}
        </p>
      </div>

      <figure data-reveal className="mt-14 rounded-2xl border border-signal/30 bg-black/60 p-5 sm:p-8">
        <p className="label mb-8 text-[10px] text-signal">Fig. {pad2(1)} — Trigger to team alert</p>

        <div ref={track} className="relative" style={{ ['--p' as string]: 0, ['--fade' as string]: 1 }}>
          {/* The signal line runs through the centres of the six lights:
              vertical on small screens, horizontal on large ones */}
          <div
            aria-hidden
            className="absolute bottom-[18px] left-[17px] top-[18px] w-[2px] rounded-full bg-signal/20 lg:bottom-auto lg:left-[calc(100%/12)] lg:right-[calc(100%/12)] lg:top-[17px] lg:h-[2px] lg:w-auto"
          >
            {/* lit part of the line, growing with the signal */}
            <span className="absolute left-0 top-0 h-[calc(var(--p)*100%)] w-full rounded-full bg-signal opacity-[var(--fade)] shadow-[0_0_14px_3px_rgb(var(--c-signal)/0.75)] lg:h-full lg:w-[calc(var(--p)*100%)]" />
            {/* the travelling signal packet */}
            <span className="absolute left-1/2 top-[calc(var(--p)*100%)] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-[var(--fade)] shadow-[0_0_16px_6px_rgb(var(--c-signal)/0.95)] lg:left-[calc(var(--p)*100%)] lg:top-1/2" />
          </div>

          <ol className="relative grid gap-6 lg:grid-cols-6 lg:gap-0">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? Bell
              return (
                <li
                  key={step.text}
                  ref={(el) => {
                    nodes.current[i] = el
                  }}
                  data-lit="false"
                  className="group flex items-start gap-4 lg:flex-col lg:items-center lg:px-2 lg:text-center"
                >
                  <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-signal/40 bg-bg font-display text-xs font-bold text-signal/60 transition-all duration-300 group-data-[lit=true]:scale-110 group-data-[lit=true]:border-signal group-data-[lit=true]:bg-signal group-data-[lit=true]:text-white group-data-[lit=true]:shadow-[0_0_22px_4px_rgb(var(--c-signal)/0.85)]">
                    {i + 1}
                  </span>
                  <div className="pt-1 lg:mt-4 lg:pt-0">
                    <p className="label flex items-center gap-1.5 text-[10px] text-white/45 transition-colors duration-300 group-data-[lit=true]:text-signal lg:justify-center">
                      <Icon size={12} aria-hidden /> {step.kind}
                    </p>
                    <p className="mt-1 text-sm text-white/60 transition-colors duration-300 group-data-[lit=true]:text-white">
                      {step.text}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <figcaption className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="label mr-3 text-signal">Fig. {pad2(1)}</span>
            {approach.figure.caption}
          </span>
          <a
            href={approach.figure.link.href}
            onClick={(e) => {
              e.preventDefault()
              scrollToHash(approach.figure.link.href)
            }}
            className="label text-white/70 transition hover:text-signal"
          >
            {approach.figure.link.label} →
          </a>
        </figcaption>
      </figure>
    </section>
  )
}
