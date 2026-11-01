import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowDown, FileDown, MessageSquare } from 'lucide-react'
import { site } from '../config/site'
import { externalProps, openContactForm, scrollToHash } from '../lib/motion'
import { THEME_CHANGE, getTheme, nextTheme, setTheme, themeLabel } from '../lib/theme'

const HeroOrb = lazy(() => import('./HeroOrb'))

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: site.timeZone })

// The orb doubles as a theme switch: each click moves to the next colour theme.
function OrbButton({ reducedMotion }: { reducedMotion: boolean }) {
  const [current, setCurrent] = useState(getTheme)
  useEffect(() => {
    const sync = () => setCurrent(getTheme())
    window.addEventListener(THEME_CHANGE, sync)
    return () => window.removeEventListener(THEME_CHANGE, sync)
  }, [])
  const next = themeLabel(nextTheme())

  return (
    <div className="relative flex flex-col items-center xl:absolute xl:left-1/2 xl:top-1/2 xl:w-[min(56vh,38vw)] xl:-translate-x-1/2 xl:-translate-y-1/2">
      <button
        type="button"
        onClick={() => setTheme(nextTheme())}
        aria-label={`Change colour theme. Current: ${themeLabel(current)}. Next: ${next}.`}
        title={`Switch to ${next}`}
        className="group block aspect-square w-[min(62vw,240px)] cursor-pointer rounded-full sm:w-[min(74vw,390px)] xl:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
      >
        {/* Only opacity is animated on this layer. Scaling the canvas's box would make the 3D
            canvas measure itself smaller, so the orb's intro and hover growth happen inside the scene. */}
        <span data-hero-orb className="relative block h-full w-full">
          <span aria-hidden className="pointer-events-none absolute inset-[18%] rounded-full bg-red/25 opacity-80 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
          <Suspense fallback={null}>
            <HeroOrb reducedMotion={reducedMotion} />
          </Suspense>
        </span>
      </button>

      {/* The note: beside the orb on wide screens, under it on small ones */}
      <p
        data-hero-fade
        className="label pointer-events-none mt-1 flex items-center justify-center gap-2 text-center text-[10px] text-white/65 xl:absolute xl:left-[92%] xl:top-1/2 xl:mt-0 xl:w-48 xl:-translate-y-1/2 xl:justify-start xl:text-left"
      >
        <span aria-hidden className="hidden h-px w-8 shrink-0 bg-gradient-to-r from-transparent to-red xl:block" />
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-red shadow-[0_0_8px_rgb(var(--c-red)/0.9)]" />
        Click the orb to change the color theme
      </p>
    </div>
  )
}

function LocalTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20_000)
    return () => clearInterval(id)
  }, [])
  return <time className="tabular-nums">{timeFormat.format(now)}</time>
}

const pill =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-grotesk text-[11px] font-semibold uppercase tracking-[0.22em] transition duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
const outlinePill = `${pill} border border-white/20 bg-black/40 text-white backdrop-blur-md hover:border-red hover:bg-red/10 hover:shadow-glow`

// Hero: the role above a two-size centred name, a 3D orb at centre stage, the description and a
// scroll cue in the bottom-left corner, and the three actions in the bottom-right corner.
export function Hero({ ready, reducedMotion }: { ready: boolean; reducedMotion: boolean }) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const unmask = () => {
        gsap.set('[data-hero-mask]', { overflow: 'visible' })
      }
      if (reducedMotion) return unmask()
      if (!ready) return
      gsap
        .timeline({ defaults: { ease: 'power3.out' }, onComplete: unmask })
        .from('[data-hero-line]', { yPercent: 110, duration: 1.1, stagger: 0.1 })
        .from('[data-hero-orb]', { opacity: 0, duration: 1.2, ease: 'power2.out' }, '-=0.8')
        .from('[data-hero-fade]', { y: 16, opacity: 0, duration: 0.8, stagger: 0.1 }, '-=1.1')

      // Fade the hero out as The Approach comes up
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } })
        .to('[data-hero-inner]', { opacity: 0, y: -70, ease: 'none', duration: 0.6 }, 0.3)
    },
    { scope: root, dependencies: [ready, reducedMotion] },
  )

  return (
    <section id="top" ref={root} className="relative flex min-h-[100svh] flex-col">
      <div
        data-hero-inner
        // Same width and side padding as the nav, so the corners line up with its edges
        className="relative mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col items-center px-4 pb-8 pt-24 sm:px-8 sm:pb-10 xl:pt-28"
      >
        {/* Soft scrim behind the name and orb; the screen edges stay clear */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[45%] -z-10 h-[90%] w-[min(1400px,130vw)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(7,3,10,0.78)_0%,rgba(7,3,10,0.45)_45%,transparent_72%)]"
        />

        {/* Top row: location at the left, local time at the right; the role and name sit below */}
        <header className="relative z-10 w-full text-center">
          <div data-hero-fade className="label flex items-center justify-between gap-4 text-[10px] text-white/50 sm:text-[11px]">
            <p>{site.location}</p>
            <p>
              <LocalTime /> local time
            </p>
          </div>
          <p data-hero-fade className="label mt-8 text-[10px] tracking-[0.45em] text-red sm:mt-10 sm:text-[11px] xl:mt-12">
            {site.role}
          </p>
          <h1 className="mt-4 font-display font-black uppercase leading-[0.95] tracking-tight xl:mt-5">
            <span data-hero-mask className="block overflow-hidden pb-[0.04em]">
              <span data-hero-line className="block text-[clamp(1.7rem,4.6vw,4.6rem)] text-white">
                {site.hero.headline[0]}
              </span>
            </span>
            <span data-hero-mask className="block overflow-hidden pb-[0.08em]">
              <span
                data-hero-line
                className="block bg-gradient-to-b from-[rgb(var(--c-tint))] via-red to-[rgb(var(--c-blood))] bg-clip-text text-[clamp(2.2rem,8.6vw,9rem)] text-transparent [filter:drop-shadow(0_0_28px_rgb(var(--c-red)/0.35))]"
              >
                {site.hero.headline[1]}
              </span>
            </span>
          </h1>
        </header>

        {/* The orb: in the flow below 1280px; on wider screens centred in the space between the
            name and the bottom corners. Clicking it changes the colour theme. */}
        <div className="relative flex w-full justify-center xl:flex-1">
          <OrbButton reducedMotion={reducedMotion} />
        </div>

        {/* Bottom corners: pitch and scroll cue on the left, actions on the right */}
        <div className="relative z-10 mt-4 flex w-full flex-col gap-6 sm:gap-8 xl:mt-0 xl:flex-row xl:items-end xl:justify-between">
          {/* data-orb-clear: the travelling orb waits until this has scrolled away */}
          <div data-hero-fade data-orb-clear className="max-w-[22rem]">
            <p className="text-sm leading-relaxed text-white/70">{site.hero.description}</p>
            <a
              href="#approach"
              onClick={(e) => {
                e.preventDefault()
                scrollToHash('#approach')
              }}
              className="label mt-4 inline-flex items-center gap-2 text-[10px] text-red transition hover:text-white"
            >
              <ArrowDown size={13} aria-hidden className="animate-bounce" /> Scroll
            </a>
          </div>

          <div data-hero-fade className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap xl:w-auto xl:justify-end">
            <a
              href={site.hero.primary.href}
              onClick={(e) => {
                e.preventDefault()
                scrollToHash(site.hero.primary.href)
              }}
              className={`${pill} bg-gradient-to-b from-[rgb(var(--c-tint))] via-red to-red text-white shadow-[0_0_24px_-6px_rgb(var(--c-red)/0.85)] [text-shadow:0_1px_2px_rgb(0_0_0/0.45)] hover:shadow-[0_0_36px_-6px_rgb(var(--c-ember)/0.85)]`}
            >
              {site.hero.primary.label} <ArrowDown size={14} aria-hidden />
            </a>
            <a
              href={site.hero.secondary.href}
              onClick={(e) => {
                e.preventDefault()
                openContactForm()
              }}
              className={outlinePill}
            >
              {site.hero.secondary.label} <MessageSquare size={14} aria-hidden />
            </a>
            <a href={site.hero.tertiary.href} {...externalProps(site.hero.tertiary.href)} className={outlinePill}>
              {site.hero.tertiary.label} <FileDown size={14} aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
