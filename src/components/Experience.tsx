import { useLayoutEffect, useRef, useState } from 'react'
import { Briefcase, ChevronDown } from 'lucide-react'
import { site } from '../config/site'
import { motion } from '../lib/motion'
import { LogoIcon, SectionHeader } from './ui'

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((b) => (
        <li key={b.slice(0, 32)} className="flex gap-3">
          <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red" />
          {b}
        </li>
      ))}
    </ul>
  )
}

// Timeline of roles. One role is open at a time; only its circle is lit.
// The rail is its own layer behind the circles, so it never runs across them.
export function Experience() {
  const { experience } = site
  const [active, setActive] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  // Where the clicked role's header sat on screen before the change
  const anchor = useRef<{ index: number; top: number } | null>(null)

  const toggle = (i: number) => {
    const b = buttons.current[i]
    if (b) anchor.current = { index: i, top: b.getBoundingClientRect().top }
    setActive((a) => (a === i ? -1 : i))
  }

  // Closing a long role above the clicked one shrinks the page above it, which would throw the
  // view several screens down. Scroll by the difference so the clicked header stays where it was.
  useLayoutEffect(() => {
    const a = anchor.current
    anchor.current = null
    const b = a && buttons.current[a.index]
    if (!a || !b) return
    const delta = b.getBoundingClientRect().top - a.top
    if (Math.abs(delta) < 1) return
    const y = window.scrollY + delta
    if (motion.lenis) motion.lenis.scrollTo(y, { immediate: true, force: true })
    else window.scrollTo(0, y)
  }, [active])

  return (
    <section id="experience" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-8">
      <SectionHeader index="04" label="Experience" headline={['Where I', 'have worked']} />

      <div className="relative mt-12 pl-10">
        {/* the rail: centred on the circles at x = 15px, from the first circle to the last */}
        <span aria-hidden className="absolute bottom-8 left-[15px] top-8 z-0 w-px bg-gradient-to-b from-red/50 via-red/25 to-red/10" />

        <ol className="relative z-10 flex flex-col gap-4">
          {experience.map((job, i) => {
            const on = i === active
            const id = `role-${i}`
            return (
              <li key={job.role + job.period} className="relative">
                <span
                  aria-hidden
                  className={`absolute -left-10 top-[26px] z-10 ml-[8px] h-[15px] w-[15px] rounded-full border-2 transition-all duration-300 ${
                    on
                      ? 'border-red bg-red shadow-[0_0_0_4px_rgb(var(--c-red)/0.18),0_0_18px_2px_rgb(var(--c-red)/0.7)]'
                      : 'border-white/25 bg-bg'
                  }`}
                />
                {/* Only the card slides in; the circle stays fixed on the rail */}
                <div
                  data-reveal={i % 2 ? 'right' : 'left'}
                  className={`rounded-2xl border bg-black/55 transition-colors duration-300 md:backdrop-blur-sm ${
                    on ? 'border-red/40' : 'border-white/10'
                  }`}
                >
                  <button
                    ref={(el) => {
                      buttons.current[i] = el
                    }}
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={on}
                    aria-controls={id}
                    className="flex w-full flex-col gap-1 p-5 text-left sm:flex-row sm:items-center sm:gap-6 sm:p-6"
                  >
                    <span className={`label w-44 shrink-0 text-[10px] ${on ? 'text-red' : ''}`}>{job.period}</span>
                    <span className="flex flex-1 items-center gap-4">
                      <LogoIcon src={job.logo} name={job.org} fallback={<Briefcase size={18} aria-hidden />} />
                      <span className="min-w-0">
                        <span className="block font-display text-base font-extrabold uppercase text-white">{job.role}</span>
                        <span className="mt-1 block text-sm text-white/60">{job.org}</span>
                      </span>
                    </span>
                    {job.current && (
                      <span className="label w-fit rounded-full border border-red/60 px-3 py-1 text-[9px] text-red">Current</span>
                    )}
                    <ChevronDown
                      size={18}
                      aria-hidden
                      className={`hidden shrink-0 text-red transition sm:block ${on ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {on && (
                    <div
                      id={id}
                      className="flex animate-[fade-in_250ms_ease-out] flex-col gap-4 px-5 pb-6 text-sm leading-relaxed text-white/75 sm:px-6 lg:pl-[18.5rem]"
                    >
                      {job.summary && (
                        <p className="border-l-2 border-red/60 pl-3 font-medium text-white/90">{job.summary}</p>
                      )}
                      <BulletList items={job.bullets} />
                      {job.highlights && (
                        <div>
                          <p className="label mb-2 text-[10px] text-red">Key contributions</p>
                          <BulletList items={job.highlights} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
