import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Orb } from './HeroOrb'
import { THEME_CHANGE, getTheme, nextTheme, setTheme, themeLabel } from '../lib/theme'

// The orb that travels with the page after the hero. It fades in beside "Leads arrive from forms…",
// then sits in the left or right margin, switching sides at each section (left, right, left…), and
// settles into the space reserved below the Contact links ([data-orb-dock]).
//
// To switch sides it slides out past its own screen edge and back in from the other one, so it never
// crosses the content in the middle. Visitors can drag it anywhere; it stays where it is dropped
// until they scroll again, then returns to its section's side. A click without a drag changes the
// colour theme, like the hero orb.
//
// The canvas box never changes size (the 3D scene scales the orb instead), which keeps it from
// shrinking or drifting when the browser re-measures.

const BOX = 260 // canvas size in px; the orb's full width (orbits included) is about 90% of it
const SECTIONS = ['approach', 'work', 'capabilities', 'about', 'experience', 'organizations', 'education', 'feedback']
const SWITCH_SECONDS = 0.9 // time to slide out one side and in the other
const RETURN_SECONDS = 0.6 // time to glide back from a dropped position once scrolling resumes
const DRAG_THRESHOLD = 5 // px of movement before a press counts as a drag rather than a click

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

type Point = { x: number; y: number }

export default function OrbTraveler({ reducedMotion }: { reducedMotion: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const hit = useRef<HTMLButtonElement>(null)
  const size = useRef(0.5)
  const hovered = useRef(false)
  const [visible, setVisible] = useState(false)
  const [theme, setThemeState] = useState(getTheme)

  // Where the orb is drawn this frame, its diameter, and drag state shared with the pointer handlers
  const current = useRef<Point & { d: number }>({ x: 0, y: 0, d: 0 })
  const press = useRef<{ id: number; start: Point; origin: Point; dragging: boolean } | null>(null)
  const dragAt = useRef<Point | null>(null) // follows the pointer during a drag
  const pinned = useRef<(Point & { d: number; scroll: number }) | null>(null) // dropped, waiting for a scroll
  const suppressClick = useRef(false)

  useEffect(() => {
    const sync = () => setThemeState(getTheme())
    window.addEventListener(THEME_CHANGE, sync)
    return () => window.removeEventListener(THEME_CHANGE, sync)
  }, [])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let shown = false
    let lane: number | null = null // 0 = left margin, 1 = right margin; in between it is off screen, changing sides
    let pull = 0 // 1 = at the dropped spot, easing to 0 = back on the section's side
    let release: Point & { d: number } = { x: 0, y: 0, d: 0 }
    let edges: { left: number; right: number } | null = null
    const remeasure = () => (edges = null)
    window.addEventListener('resize', remeasure)

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const el = box.current
      const button = hit.current
      const start = document.querySelector('[data-orb-start]')
      const dock = document.querySelector('[data-orb-dock]')
      const contact = document.getElementById('contact')
      if (!el || !button || !start || !dock || !contact) return

      const vw = document.documentElement.clientWidth
      const vh = window.innerHeight

      // The content's left and right edges, measured from The Approach (every section shares its
      // width and padding). The orb stays in the margins outside them.
      if (edges === null) {
        const approach = document.getElementById('approach')
        if (!approach) return
        const r = approach.getBoundingClientRect()
        const cs = getComputedStyle(approach)
        edges = { left: r.left + parseFloat(cs.paddingLeft), right: r.right - parseFloat(cs.paddingRight) }
      }
      const margin = Math.min(edges.left, vw - edges.right)
      const travelD = Math.min(170, margin - 32)
      const canTravel = travelD >= 52 // a 1280px screen (with scrollbar) still fits a small orb
      const leftX = Math.max(edges.left / 2, travelD / 2 + 12)
      const rightX = Math.min(vw - (vw - edges.right) / 2, vw - travelD / 2 - 12)

      // Fade in as the "Leads arrive" line comes up the screen, once the hero's bottom-left text has
      // scrolled out of the way
      const heroText = document.querySelector('[data-orb-clear]')?.getBoundingClientRect().bottom ?? 0
      const appear = smooth(
        Math.min(
          clamp01((vh * 0.85 - start.getBoundingClientRect().top) / (vh * 0.25)),
          clamp01((vh * 0.22 - heroText) / (vh * 0.17)),
        ),
      )

      // The section in the middle of the screen picks the side: left, right, left…
      let index = 0
      SECTIONS.forEach((id, i) => {
        const s = document.getElementById(id)
        if (s && s.getBoundingClientRect().top <= vh * 0.5) index = i
      })
      const targetLane = index % 2
      // A dropped orb stays put, so it doesn't switch sides until scrolling resumes
      const held = pinned.current || dragAt.current
      if (lane === null) lane = targetLane
      else if (!held) {
        const step = reducedMotion ? 1 : dt / SWITCH_SECONDS
        lane = lane < targetLane ? Math.min(targetLane, lane + step) : Math.max(targetLane, lane - step)
      }
      const off = travelD / 2 + 24
      const laneX = lane <= 0.5 ? lerp(leftX, -off, smooth(lane * 2)) : lerp(vw + off, rightX, smooth((lane - 0.5) * 2))
      const laneFade = smooth(Math.abs(lane - 0.5) * 2)
      const laneY = Math.min(vh - 72 - travelD / 2, Math.max(96 + travelD / 2, vh * 0.5))

      // Settle into the dock as Contact arrives: fully there by the end of the page. The orb first
      // runs down its margin to the dock's height, then slides across the empty row below the links,
      // so it never cuts across the content above.
      const scroll = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - vh
      const begin = contact.getBoundingClientRect().top + scroll - vh
      const end = Math.max(begin + 1, maxScroll - 40)
      const t = clamp01((scroll - begin) / (end - begin))
      const down = smooth(clamp01(t / 0.6))
      const across = smooth(clamp01((t - 0.55) / 0.45))

      const d = dock.getBoundingClientRect()
      const dockX = d.left + d.width / 2
      const dockY = d.top + d.height / 2
      const dockD = d.width
      // Until it slides across, stay on screen even while the dock is still below the fold
      const railY = lerp(Math.min(dockY, vh - travelD / 2 - 24), dockY, across)

      // On narrow screens there is no margin to travel in: the orb only appears in its dock
      let x = canTravel ? lerp(laneX, dockX, across) : dockX
      let y = canTravel ? lerp(laneY, railY, down) : dockY
      let diameter = canTravel ? lerp(travelD, dockD, across) : dockD
      let opacity = canTravel ? Math.max(appear * laneFade, across) : smooth(t)
      let grow = canTravel ? lerp(0.6 + 0.4 * appear, 1, across) : 0.6 + 0.4 * smooth(t)

      // Dragging, dropped, or gliding back from a drop
      const pin = pinned.current
      if (pin && Math.abs(scroll - pin.scroll) > 4) {
        release = { x: pin.x, y: pin.y, d: pin.d }
        pinned.current = null
        pull = 1
      }
      const hold = dragAt.current ?? pinned.current
      if (hold) {
        x = hold.x
        y = hold.y
        diameter = current.current.d
        opacity = 1
        grow = 1
      } else if (pull > 0) {
        pull = reducedMotion ? 0 : Math.max(0, pull - dt / RETURN_SECONDS)
        const k = smooth(pull)
        x = lerp(x, release.x, k)
        y = lerp(y, release.y, k)
        diameter = lerp(diameter, release.d, k)
        opacity = Math.max(opacity, k)
        grow = lerp(grow, 1, k)
      }

      current.current = { x, y, d: diameter }
      el.style.transform = `translate3d(${x - BOX / 2}px, ${y - BOX / 2}px, 0)`
      el.style.opacity = opacity.toFixed(3)
      size.current = (diameter / (BOX * 0.9)) * grow
      button.style.width = button.style.height = `${diameter * 0.8}px`

      const nowShown = opacity > 0.05
      if (nowShown !== shown) {
        shown = nowShown
        setVisible(nowShown)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', remeasure)
    }
  }, [reducedMotion])

  // Mouse and pen drag the orb; on touch screens a swipe over it keeps scrolling the page
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'touch' || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    press.current = {
      id: e.pointerId,
      start: { x: e.clientX, y: e.clientY },
      origin: { x: current.current.x, y: current.current.y },
      dragging: false,
    }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    const dx = e.clientX - p.start.x
    const dy = e.clientY - p.start.y
    if (!p.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    p.dragging = true
    const r = current.current.d / 2
    dragAt.current = {
      x: Math.min(window.innerWidth - r, Math.max(r, p.origin.x + dx)),
      y: Math.min(window.innerHeight - r, Math.max(r, p.origin.y + dy)),
    }
  }
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    press.current = null
    if (p.dragging && dragAt.current) {
      pinned.current = { ...dragAt.current, d: current.current.d, scroll: window.scrollY }
      dragAt.current = null
      suppressClick.current = true // the click that follows a drag shouldn't change the theme
    }
  }

  const next = themeLabel(nextTheme())
  return (
    <div
      ref={box}
      className="pointer-events-none fixed left-0 top-0 z-20 opacity-0 will-change-transform"
      style={{ width: BOX, height: BOX }}
    >
      <Canvas
        resize={{ scroll: false, debounce: { scroll: 0, resize: 100 } }}
        dpr={[1, 2]}
        frameloop={visible ? 'always' : 'demand'}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 35, position: [0, 0, 7.2] }}
      >
        <Orb animate={!reducedMotion} hovered={hovered} size={size} />
      </Canvas>
      {/* Only the orb itself takes the pointer, so the rest of the box never blocks the page */}
      <button
        ref={hit}
        type="button"
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false
            return
          }
          setTheme(nextTheme())
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={() => (hovered.current = true)}
        onPointerLeave={() => (hovered.current = false)}
        aria-label={`Change colour theme. Current: ${themeLabel(theme)}. Next: ${next}.`}
        title={`Click to switch to ${next}, or drag to move`}
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-pan-y rounded-full active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70 ${
          visible ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      />
    </div>
  )
}
