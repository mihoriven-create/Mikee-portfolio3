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
  navigating: false, // a nav link's smooth scroll is under way
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

// Spread onto an <a> so off-site links (WhatsApp) and the résumé PDF open in a new tab. The PDF
// is hosted here, so it is matched by extension; its own Portfolio link then can't replace the site.
export const externalProps = (href: string) =>
  href.startsWith('http') || href.endsWith('.pdf') ? { target: '_blank', rel: 'noopener noreferrer' } : {}

export function scrollToHash(href: string) {
  if (motion.lenis) {
    motion.navigating = true
    motion.lenis.scrollTo(href, { duration: 1.6, onComplete: () => (motion.navigating = false) })
    // A wheel or touch can cut the scroll short, so onComplete may never run
    window.setTimeout(() => (motion.navigating = false), 1800)
  } else document.querySelector(href)?.scrollIntoView()
}

// Scrolling down into Contact glides the rest of the way to the bottom of the page, so the
// contact options and footer land fully in view. It waits until the visitor pauses (never
// fighting a wheel or a phone's momentum), runs once per visit (re-armed after scrolling back
// up above Contact), and any wheel or touch during the glide takes over from where the page is.
// Skipped for nav-link jumps, while a dialog is open, and with reduced motion (no Lenis).
const SETTLE_MS = 220
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function useContactGlide(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    let pending = false
    let gliding = false
    let timer = 0

    const glide = () => {
      const lenis = motion.lenis
      if (!pending || !lenis || motion.navigating || document.querySelector('[role="dialog"]')) return
      const distance = lenis.limit - lenis.scroll
      pending = false
      if (distance < 4) return
      gliding = true
      lenis.scrollTo('bottom', {
        duration: Math.min(1.6, Math.max(0.8, distance / 700)),
        easing: ease,
        onComplete: () => (gliding = false),
      })
    }

    const trigger = ScrollTrigger.create({
      trigger: '#contact',
      start: 'top 65%',
      end: 'max',
      onEnter: () => {
        pending = !motion.navigating
      },
      onLeaveBack: () => {
        pending = false
        clearTimeout(timer)
        timer = 0
      },
    })

    // Wait for the scroll to settle before gliding; the glide's own frames don't count, and neither
    // does the smooth scroll's last slow creep of a pixel or two per frame
    const off = motion.lenis?.on('scroll', (lenis: Lenis) => {
      if (gliding || !pending) return
      if (Math.abs(lenis.velocity) < 1.5 && timer) return
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = 0
        glide()
      }, SETTLE_MS)
    })
    // Any wheel or touch ends the glide's claim, so a later pause can't restart it
    const interrupt = () => (gliding = false)
    window.addEventListener('wheel', interrupt, { passive: true })
    window.addEventListener('touchstart', interrupt, { passive: true })

    return () => {
      trigger.kill()
      off?.()
      clearTimeout(timer)
      window.removeEventListener('wheel', interrupt)
      window.removeEventListener('touchstart', interrupt)
    }
  }, [enabled])
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
