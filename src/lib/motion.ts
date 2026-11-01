import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { END_SECTION, ROUTE_LENGTH, TURN_AT, TURN_SECTIONS } from '../config/route'

gsap.registerPlugin(ScrollTrigger)

// Shared mutable state read by the 3D scene every frame (no React re-renders).
export const motion = {
  routeTarget: 0, // 0 → 1 along the maze route, where the scroll position says the camera should be
  routeU: 0, // 0 → 1 along the maze route, where the camera actually is (it eases toward routeTarget)
  mx: 0, // pointer, -1 → 1
  my: 0,
  lenis: null as Lenis | null,
}

// The page sections drive the walk through the maze: the hero and The Approach walk the first
// corridor, each turn is taken as a section's heading comes into view (Selected Work, What I Work
// On, Systems People Rely On, In Their Words), and Contact walks to the end of the maze.
const TURN_WHEN_HEADING_AT = 0.65 // fraction of the viewport height, measured from the top

let stops: [scroll: number, route: number][] = [
  [0, 0],
  [1, 1],
]

function measureStops() {
  const vh = window.innerHeight
  const max = Math.max(1, document.documentElement.scrollHeight - vh)
  const top = (id: string) => {
    const el = document.getElementById(id)
    return el ? el.getBoundingClientRect().top + window.scrollY : null
  }

  const next: typeof stops = [[0, 0]]
  TURN_SECTIONS.forEach((id, i) => {
    const t = top(id)
    if (t === null) return
    const y = Math.max(t - vh * TURN_WHEN_HEADING_AT, next[next.length - 1][0] + 1)
    next.push([y, TURN_AT[i] / ROUTE_LENGTH])
  })
  const end = top(END_SECTION)
  if (end !== null) next.push([Math.max(end - vh * 0.5, next[next.length - 1][0] + 1), 0.96])
  next.push([Math.max(max, next[next.length - 1][0] + 1), 1])
  stops = next
}

function routeForScroll(y: number) {
  for (let i = 1; i < stops.length; i++) {
    const [s0, r0] = stops[i - 1]
    const [s1, r1] = stops[i]
    if (y <= s1) return s1 === s0 ? r1 : r0 + ((y - s0) / (s1 - s0)) * (r1 - r0)
  }
  return 1
}

// Spread onto an <a> so off-site links (WhatsApp, the résumé PDF) open in a new tab.
export const externalProps = (href: string) =>
  href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}

export function scrollToHash(href: string) {
  if (motion.lenis) motion.lenis.scrollTo(href, { duration: 1.6 })
  else document.querySelector(href)?.scrollIntoView()
}

export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    // Always start at the hero; restored scroll positions fight the intro animation.
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    const onRefresh = () => {
      measureStops()
      motion.routeTarget = routeForScroll(window.scrollY)
    }
    ScrollTrigger.addEventListener('refresh', onRefresh)

    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        motion.routeTarget = routeForScroll(self.scroll())
      },
    })

    const onPointer = (e: PointerEvent) => {
      motion.mx = (e.clientX / window.innerWidth) * 2 - 1
      motion.my = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    // Headings reflow when the web fonts arrive; re-measure every scroll trigger once they have.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    ScrollTrigger.refresh()

    let tick: ((time: number) => void) | undefined
    if (enabled) {
      const lenis = new Lenis({ lerp: 0.08 })
      motion.lenis = lenis
      lenis.on('scroll', ScrollTrigger.update)
      tick = (time) => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    }

    return () => {
      trigger.kill()
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      window.removeEventListener('pointermove', onPointer)
      if (tick) gsap.ticker.remove(tick)
      motion.lenis?.destroy()
      motion.lenis = null
    }
  }, [enabled])
}

// Opens the "Email me" pop-up with the message form, wherever the visitor is on the page.
export const OPEN_CONTACT_FORM = 'open-contact-form'
export function openContactForm() {
  window.dispatchEvent(new Event(OPEN_CONTACT_FORM))
}

// Subtle entrance and exit for every [data-reveal] element: it slides in from the left or right
// as it enters the screen, and eases back out to the same side as it leaves past the top.
// data-reveal="left" | "right" picks the side; an empty value alternates down the page.
// Put data-reveal on wrappers, not on elements with CSS transform transitions (they fight GSAP).
export function useReveal(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const els = gsap.utils.toArray<HTMLElement>('[data-reveal]')
    const distance = window.innerWidth < 768 ? 18 : 44
    const triggers = els.map((el, i) => {
      const side = el.dataset.reveal === 'left' ? -1 : el.dataset.reveal === 'right' ? 1 : i % 2 ? 1 : -1
      const hidden = { opacity: 0, x: side * distance }
      const shown = { opacity: 1, x: 0 }
      const go = (to: gsap.TweenVars) =>
        gsap.to(el, { ...to, duration: 0.75, ease: 'power3.out', overwrite: 'auto' })
      gsap.set(el, hidden)
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        end: 'bottom 8%',
        onEnter: () => go(shown),
        onEnterBack: () => go(shown),
        onLeave: () => go({ opacity: 0, x: side * distance * 0.6 }),
        onLeaveBack: () => go(hidden),
      })
    })
    ScrollTrigger.refresh()
    // Anything already on screen is shown straight away
    triggers.forEach((t) => {
      if (t.isActive) gsap.set(t.trigger!, { opacity: 1, x: 0 })
    })
    return () => {
      triggers.forEach((t) => t.kill())
      gsap.set(els, { clearProps: 'opacity,transform' })
    }
  }, [enabled])
}
