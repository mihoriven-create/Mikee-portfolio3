import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  AppWindow,
  Bot,
  Calculator,
  Handshake,
  Lightbulb,
  Route,
  ServerCog,
  Sheet,
  Target,
  TrendingUp,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { site, type CaseStudy } from '../config/site'
import { EASE, EASE_IN, prefersReducedMotion } from '../lib/easing'
import { DscrCalculator, LeadAgeDemo } from './demos'
import { Gallery } from './Gallery'
import { Chip, SectionHeader, pad2 } from './ui'

const CASE_ICONS: Record<string, LucideIcon> = {
  'case-01': AppWindow,
  'case-02': Workflow,
  'case-03': Bot,
  'case-04': Sheet,
  'case-05': Calculator,
  'case-06': ServerCog,
}

// A labelled block inside a case study, always visible.
function Block({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-4 sm:p-5">
      <p className="label mb-3 flex items-center gap-2 text-[10px] text-white/85">
        <Icon size={14} className="text-red" aria-hidden /> {title}
      </p>
      {children}
    </div>
  )
}

function Flow({ c }: { c: CaseStudy }) {
  if (!c.flow) return null
  return (
    <>
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {c.flow.map((step, i) => (
          <li key={step.title} className="flex items-center gap-2 sm:flex-1">
            <div className="story-light flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-3">
              <p className="font-grotesk text-sm font-semibold text-white">{step.title}</p>
              <p className="mt-0.5 text-xs text-white/55">{step.detail}</p>
            </div>
            {i < c.flow!.length - 1 && (
              <span aria-hidden className="hidden text-red sm:block">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      {c.flowNote && <p className="mt-3 text-xs text-white/45">{c.flowNote}</p>}
    </>
  )
}

// Challenge / Solution / Implementation / Outcome as tabs; the chosen one opens in a compact box.
// Switching crossfades: the old text leaves a little faster than the new text arrives, and a thin
// indicator glides to the selected tab.
function StoryTabs({ c }: { c: CaseStudy }) {
  const tabs = [
    { key: 'challenge', label: 'Challenge', icon: Target, body: c.challenge },
    { key: 'solution', label: 'Solution', icon: Lightbulb, body: c.solution },
    { key: 'implementation', label: 'Implementation', icon: Wrench, body: c.implementation },
    { key: 'outcome', label: 'Outcome', icon: TrendingUp, body: c.outcome },
  ] as const
  type Key = (typeof tabs)[number]['key']
  const [active, setActive] = useState<Key>('outcome')
  const [shown, setShown] = useState<Key>('outcome') // what the panel currently displays
  const latest = useRef<Key>('outcome')
  const list = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const buttons = useRef<Partial<Record<Key, HTMLButtonElement | null>>>({})
  const first = useRef(true)
  const current = tabs.find((t) => t.key === shown)!

  // Measure the active tab once per change (or resize) and glide the indicator there
  useLayoutEffect(() => {
    const place = (animate: boolean) => {
      const b = buttons.current[active]
      if (!b || !bar.current) return
      gsap.to(bar.current, {
        x: b.offsetLeft + 12,
        y: b.offsetTop + b.offsetHeight + 3,
        scaleX: (b.offsetWidth - 24) / 100,
        duration: animate && !prefersReducedMotion() ? 0.5 : 0,
        ease: EASE,
        overwrite: true,
      })
    }
    place(!first.current)
    const ro = new ResizeObserver(() => place(false))
    if (list.current) ro.observe(list.current)
    return () => ro.disconnect()
  }, [active])

  // Incoming content: slide in from the right and fade up (slightly slower than the exit)
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const reduced = prefersReducedMotion()
    gsap.fromTo(
      panel.current,
      { opacity: 0, x: reduced ? 0 : 14 },
      { opacity: 1, x: 0, duration: reduced ? 0.15 : 0.32, ease: EASE, overwrite: true },
    )
  }, [shown])

  const select = (key: Key) => {
    if (key === latest.current) return
    latest.current = key
    setActive(key)
    // Outgoing content leaves to the left, a little faster than the new content arrives
    gsap.to(panel.current, {
      opacity: 0,
      x: prefersReducedMotion() ? 0 : -10,
      duration: 0.18,
      ease: EASE_IN,
      overwrite: true,
      onComplete: () => setShown(latest.current),
    })
  }

  return (
    <div>
      <div ref={list} role="tablist" aria-label={`${c.title} details`} className="relative flex flex-wrap gap-2">
        {tabs.map((t) => {
          const on = t.key === active
          return (
            <button
              key={t.key}
              ref={(el) => {
                buttons.current[t.key] = el
              }}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${c.id}-panel`}
              onClick={() => select(t.key)}
              className={`focus-ring press inline-flex items-center gap-2 rounded-full border px-4 py-2 font-grotesk text-[11px] font-semibold uppercase tracking-[0.18em] ${
                on
                  ? 'border-signal bg-signal/15 text-white shadow-[0_0_18px_-4px_rgb(var(--c-signal)/0.9),inset_0_0_10px_-4px_rgb(var(--c-signal)/0.8)] [text-shadow:0_0_10px_rgb(var(--c-signal)/0.8)]'
                  : 'border-white/15 text-white/60 hover:border-signal/60 hover:text-white'
              }`}
            >
              <t.icon size={13} aria-hidden /> {t.label}
            </button>
          )
        })}
        {/* Gliding indicator under the selected tab (positioned with transforms only) */}
        <span
          ref={bar}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-[2px] w-[100px] origin-left rounded-full bg-signal shadow-[0_0_8px_rgb(var(--c-signal)/0.9)]"
        />
      </div>
      <div
        ref={panel}
        id={`${c.id}-panel`}
        role="tabpanel"
        aria-live="polite"
        className="story-light mt-3 rounded-xl border-l-2 border-signal bg-signal/[0.08] px-5 py-4 shadow-[inset_4px_0_14px_-8px_rgb(var(--c-signal)/0.7)]"
      >
        <p className="label flex items-center gap-2 text-[10px] text-signal">
          <current.icon size={13} aria-hidden /> {current.label}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/90 sm:text-base">{current.body}</p>
      </div>
    </div>
  )
}

function CaseCard({ c, index, total }: { c: CaseStudy; index: number; total: number }) {
  const Icon = CASE_ICONS[c.id] ?? Workflow
  const flowIcon = c.id === 'case-06' ? ServerCog : c.id === 'case-04' ? Route : Workflow
  const words = c.title.split(' ')

  return (
    // Scroll triggers measure the shell, so the card's own lean-in transform never skews them
    <div data-shell>
      <article
        id={c.id}
        data-case
        className="group relative scroll-mt-28 overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-5 sm:p-8 md:backdrop-blur-sm"
      >

        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-red/40 bg-red/10 text-red">
            <Icon size={17} aria-hidden />
          </span>
          <span className="label text-red">
            Case {pad2(index + 1)} / {pad2(total)}
          </span>
          <span className="h-px w-6 bg-red/40" />
          <span className="label">
            <span className="inline-block">
              {c.category} ·
            </span>{' '}
            <span className={`inline-block ${c.status === 'Implemented' ? 'text-white/80' : 'text-ember'}`}>
              {c.status}
            </span>
          </span>
        </div>

        <h3 className="mt-4 max-w-3xl font-display text-xl font-extrabold uppercase leading-tight tracking-wide text-white sm:text-3xl">
          {/* Each word rises from behind a mask; the padding / negative margin pair keeps descenders
              unclipped without changing the line box */}
          {words.map((w, n) => (
            <span key={n}>
              <span className="-mb-[0.1em] inline-block overflow-hidden pb-[0.1em] align-top">
                <span data-word className="inline-block">
                  {w}
                </span>
              </span>
              {n < words.length - 1 && ' '}
            </span>
          ))}
        </h3>
        <p className="mt-3 max-w-3xl text-white/75">
          {c.summary}
        </p>

        <dl className="mt-6 grid gap-4 border-y border-white/10 py-4 text-sm sm:grid-cols-[1fr_1fr_1.5fr]">
          <div>
            <dt className="label text-[10px]">Role</dt>
            <dd className="mt-1.5 text-white/85">{c.role}</dd>
          </div>
          <div>
            <dt className="label text-[10px]">Context</dt>
            <dd className="mt-1.5 text-white/85">{c.context}</dd>
          </div>
          <div>
            <dt className="label text-[10px]">Built with</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {c.builtWith.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </dd>
          </div>
        </dl>

        <div className={`mt-6 grid gap-6 ${c.shots ? 'lg:grid-cols-[1.05fr_1fr]' : ''}`}>
          {c.shots && (
            <div data-parallax>
              <Gallery shots={c.shots} />
            </div>
          )}
          <StoryTabs c={c} />
        </div>

        {(c.flow || c.demo || c.partners) && (
          <div className="mt-6 flex flex-col gap-4">
            {c.flow && (
              <Block title={c.flowLabel ?? 'How it works'} icon={flowIcon}>
                <Flow c={c} />
              </Block>
            )}
            {c.demo === 'leadAge' && (
              <div>
                <LeadAgeDemo />
              </div>
            )}
            {c.demo === 'dscr' && (
              <div>
                <DscrCalculator />
              </div>
            )}
            {c.partners && (
              <Block title="Partner organizations supported" icon={Handshake}>
                <div className="flex flex-wrap gap-2">
                  {c.partners.map((p) => (
                    <Chip key={p}>{p}</Chip>
                  ))}
                </div>
              </Block>
            )}
          </div>
        )}
      </article>
    </div>
  )
}

// A small "Case 03 / 06" pill with a hairline progress bar, fixed at the bottom left. It appears
// while the project list is on screen, the digits roll to the case being read, and the bar fills
// as you move through the section. Tablet and up only.
function WorkProgress({ total }: { total: number }) {
  const root = useRef<HTMLDivElement>(null)
  const roll = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const section = document.getElementById('work')
      const shells = gsap.utils.toArray<HTMLElement>('#work [data-shell]')
      if (!section || !root.current || !roll.current || !bar.current || shells.length === 0) return
      const reduced = prefersReducedMotion()
      const setBar = gsap.quickSetter(bar.current, 'scaleX')

      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) =>
          gsap.to(root.current, { autoAlpha: self.isActive ? 1 : 0, duration: reduced ? 0 : 0.4, ease: 'power2.out' }),
        onUpdate: (self) => setBar(self.progress),
      })
      shells.forEach((el, i) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => {
            if (!self.isActive) return
            gsap.to(roll.current, { yPercent: -(100 / total) * i, duration: reduced ? 0 : 0.7, ease: EASE, overwrite: true })
          },
        }),
      )
    },
    { dependencies: [total] },
  )

  // Portal to <body> so ancestors with transforms can't trap position: fixed
  return createPortal(
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none invisible fixed bottom-6 left-6 z-30 hidden items-center gap-3 rounded-full border border-white/15 bg-bg/85 px-4 py-2 opacity-0 backdrop-blur md:flex"
    >
      <span className="label">Case</span>
      <span className="relative block h-[1.1em] overflow-hidden font-mono text-xs tabular-nums text-white">
        <span ref={roll} className="block will-change-transform">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className="block h-[1.1em] leading-[1.1em]">
              {pad2(i + 1)}
            </span>
          ))}
        </span>
      </span>
      <span className="label">/ {pad2(total)}</span>
      <span className="relative block h-px w-16 bg-white/10">
        <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-signal" />
      </span>
    </div>,
    document.body,
  )
}

export function Work({ reducedMotion }: { reducedMotion: boolean }) {
  const { work } = site
  const root = useRef<HTMLElement>(null)

  // Motion for the project list:
  //  - titles rise word by word through a mask (every screen size)
  //  - each case leans in as it arrives and recedes as it leaves, scrubbed to the scroll (desktop)
  //  - the screenshots drift against the scroll for depth (desktop)
  //  - the story panel and flow steps get a soft light that follows the cursor (mouse only)
  // Everything is scroll-driven, so it reverses exactly. Reduced-motion visitors get none of it.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const mm = gsap.matchMedia()

      // Titles: word-by-word mask reveal
      gsap.utils.toArray<HTMLElement>('[data-case] h3').forEach((h3) => {
        const words = h3.querySelectorAll('[data-word]')
        gsap.fromTo(words, { y: 0, yPercent: 115 }, {
          y: 0,
          yPercent: 0,
          duration: 1.1,
          ease: EASE,
          stagger: 0.07,
          scrollTrigger: { trigger: h3, start: 'top 88%', toggleActions: 'play none none reverse' },
        })
      })

      // Desktop depth
      mm.add('(min-width: 1024px)', () => {
        // Each case: lean in on arrival, hold, then recede on the way out. One scrubbed timeline per case.
        gsap.utils.toArray<HTMLElement>('[data-case]').forEach((article) => {
          gsap.set(article, { transformPerspective: 1400, transformOrigin: '50% 50%' })
          gsap
            .timeline({
              defaults: { ease: 'none' },
              scrollTrigger: { trigger: article.parentElement, start: 'top 100%', end: 'bottom 0%', scrub: 0.6 },
            })
            .fromTo(article, { y: 70, rotateX: 5, scale: 0.985 }, { y: 0, rotateX: 0, scale: 1, duration: 0.18 })
            .to({}, { duration: 0.52 })
            .to(article, { y: -40, scale: 0.965, opacity: 0.5, duration: 0.3 })
        })

        // Screenshots drift against the scroll
        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
          gsap.fromTo(
            el,
            { y: 48 },
            { y: -48, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
          )
        })
      })

      // A soft light follows the cursor across the story panel and flow steps (mouse only)
      mm.add('(hover: hover) and (pointer: fine)', () => {
        const move = (e: globalThis.PointerEvent) => {
          const el = (e.target as HTMLElement | null)?.closest?.('#work .story-light') as HTMLElement | null
          if (!el) return
          const r = el.getBoundingClientRect()
          el.style.setProperty('--mx', `${e.clientX - r.left}px`)
          el.style.setProperty('--my', `${e.clientY - r.top}px`)
        }
        document.addEventListener('pointermove', move, { passive: true })
        return () => document.removeEventListener('pointermove', move)
      })

      return () => mm.revert()
    },
    { scope: root, dependencies: [reducedMotion] },
  )

  return (
    <section id="work" ref={root} className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-8">
      <SectionHeader index="01" label={work.label} headline={['Selected', 'work']} intro={work.intro} />
      <div className="mt-12 flex flex-col gap-6">
        {work.cases.map((c, i) => (
          <CaseCard key={c.id} c={c} index={i} total={work.cases.length} />
        ))}
      </div>
      <WorkProgress total={work.cases.length} />
    </section>
  )
}
