import { useEffect, useRef } from 'react'
import { LIGHTNING, WEATHER_CHANGE, getSeason, type SeasonId } from '../lib/weather'

// Seasonal weather drawn on one full-screen 2D canvas between the maze and the page content, so
// text always sits on top of it: cherry petals in spring, warm sunlight and drifting light motes in
// summer, tumbling leaves in autumn, snow in winter, and a rainstorm with lightning every 2–5 seconds.
// Decorative only (hidden from assistive tech), paused while the tab is hidden, and a still frame
// (no lightning) for reduced-motion visitors.

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  spin: number
  phase: number
  color: string
  alpha: number
}

type Season = Exclude<SeasonId, 'off'>

// Particles per 1440×900 screen; smaller screens get proportionally fewer
const DENSITY: Record<Season, number> = { spring: 42, summer: 46, autumn: 30, winter: 120, storm: 260 }

const PALETTE: Record<Season, string[]> = {
  spring: ['#ffc4dc', '#ffd9e8', '#fbe6ef', '#f7a8c8', '#ffffff'],
  summer: ['#ffd27a', '#ffe8ad', '#fff3d1', '#ffbf57'],
  autumn: ['#d9622b', '#e8892f', '#b8401f', '#f0b23c', '#9c3d17'],
  winter: ['#ffffff', '#eef6ff', '#dbe9ff'],
  storm: ['#c9d6e8', '#b4c3d9', '#dfe8f5'],
}

// Rain slants with one shared wind, so every drop falls at the same angle (to the left)
export const WIND = -0.12

// A lightning strike: a bright flash, a weaker re-strike flicker, then a fade. Most strikes show a
// forked bolt; the rest are sheet lightning lighting the sky from behind the clouds.
type Strike = { at: number; bolt: { x: number; y: number }[][] | null; glowX: number }

// Flash brightness for a strike `age` seconds old: two pulses, never more than 3 flashes a second
export function flashLevel(age: number) {
  if (age < 0) return 0
  const first = age < 0.05 ? age / 0.05 : Math.exp(-(age - 0.05) / 0.08)
  const second = age < 0.17 ? 0 : 0.65 * Math.exp(-(age - 0.17) / 0.28)
  return Math.max(first, second)
}

// A jagged bolt from the top of the screen, plus a couple of shorter forks
function makeBolt(w: number, h: number) {
  const paths: { x: number; y: number }[][] = []
  const main = [{ x: rand(w * 0.08, w * 0.92), y: -10 }]
  const end = h * rand(0.42, 0.78)
  while (main[main.length - 1].y < end) {
    const last = main[main.length - 1]
    main.push({ x: last.x + rand(-34, 34), y: last.y + rand(16, 42) })
  }
  paths.push(main)
  const forks = 1 + Math.floor(Math.random() * 3)
  for (let f = 0; f < forks; f++) {
    const from = main[2 + Math.floor(Math.random() * Math.max(1, main.length - 4))]
    const dir = Math.random() < 0.5 ? -1 : 1
    const fork = [{ ...from }]
    const steps = 3 + Math.floor(Math.random() * 4)
    for (let s = 0; s < steps; s++) {
      const last = fork[fork.length - 1]
      fork.push({ x: last.x + dir * rand(10, 34), y: last.y + rand(12, 30) })
    }
    paths.push(fork)
  }
  return paths
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

function spawn(season: Season, w: number, h: number, anywhere: boolean): Particle {
  const p: Particle = {
    x: rand(-40, w + 40),
    y: anywhere ? rand(-20, h) : rand(-60, -10),
    vx: 0,
    vy: 0,
    size: 0,
    rot: rand(0, Math.PI * 2),
    spin: 0,
    phase: rand(0, Math.PI * 2),
    color: pick(PALETTE[season]),
    alpha: 1,
  }
  switch (season) {
    case 'spring':
      p.size = rand(7, 12)
      p.vx = rand(14, 38)
      p.vy = rand(26, 52)
      p.spin = rand(-1.6, 1.6)
      p.alpha = rand(0.65, 0.95)
      break
    case 'summer':
      p.size = rand(1.6, 3.4)
      p.vx = rand(-6, 6)
      p.vy = rand(-18, -6)
      p.y = anywhere ? rand(0, h) : h + rand(10, 40)
      p.alpha = rand(0.4, 0.9)
      break
    case 'autumn':
      p.size = rand(12, 20)
      p.vx = rand(-10, 28)
      p.vy = rand(38, 72)
      p.spin = rand(-2.4, 2.4)
      p.alpha = rand(0.75, 0.95)
      break
    case 'winter': {
      const depth = Math.random()
      p.size = 1.4 + depth * 3
      p.vx = rand(-6, 10)
      p.vy = 22 + depth * 46
      p.alpha = 0.35 + depth * 0.6
      break
    }
    case 'storm': {
      // Nearer drops fall faster, look longer and brighter; all share the wind's slant
      const depth = Math.random()
      p.x = rand(-40, w + h * Math.abs(WIND) + 40)
      p.y = anywhere ? rand(-30, h) : rand(-120, -20)
      p.vy = 900 + depth * 600
      p.vx = p.vy * WIND
      p.size = 12 + depth * 16
      p.alpha = 0.12 + depth * 0.33
      break
    }
  }
  return p
}

export function drawPetal(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  // Squash with the tumble so petals flip as they fall
  ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(p.rot * 1.3 + p.phase)))
  ctx.globalAlpha = p.alpha
  ctx.fillStyle = p.color
  ctx.beginPath()
  // A rounded petal with a small notch at the tip
  ctx.moveTo(0, -p.size)
  ctx.bezierCurveTo(p.size, -p.size * 0.9, p.size * 0.9, p.size * 0.6, 0, p.size)
  ctx.bezierCurveTo(-p.size * 0.9, p.size * 0.6, -p.size, -p.size * 0.9, 0, -p.size)
  ctx.fill()
  ctx.restore()
}

export function drawLeaf(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.cos(p.rot * 0.8 + p.phase)))
  ctx.globalAlpha = p.alpha
  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.moveTo(-p.size, 0)
  ctx.quadraticCurveTo(0, -p.size * 0.62, p.size, 0)
  ctx.quadraticCurveTo(0, p.size * 0.62, -p.size, 0)
  ctx.fill()
  // Midrib and stem
  ctx.strokeStyle = 'rgba(60, 20, 5, 0.45)'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(-p.size * 1.25, 0)
  ctx.lineTo(p.size * 0.85, 0)
  ctx.stroke()
  ctx.restore()
}

function drawMote(ctx: CanvasRenderingContext2D, p: Particle, t: number) {
  const twinkle = 0.55 + 0.45 * Math.sin(t * 1.7 + p.phase)
  ctx.globalAlpha = p.alpha * twinkle * 0.22
  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = p.alpha * twinkle
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fill()
}

function drawFlake(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalAlpha = p.alpha
  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fill()
}

// A raindrop as a short streak along its direction of travel
export function drawDrop(ctx: CanvasRenderingContext2D, p: Particle, boost: number) {
  ctx.globalAlpha = Math.min(1, p.alpha * boost)
  ctx.strokeStyle = p.color
  ctx.lineWidth = p.size > 22 ? 1.3 : 0.9
  ctx.beginPath()
  ctx.moveTo(p.x, p.y)
  ctx.lineTo(p.x - (p.vx / p.vy) * p.size, p.y - p.size)
  ctx.stroke()
}

// The storm sky: a slight darkening, then the lightning flash and bolt on top
function drawStorm(ctx: CanvasRenderingContext2D, w: number, h: number, strike: Strike | null, t: number) {
  ctx.globalAlpha = 1
  ctx.fillStyle = 'rgba(14, 20, 32, 0.14)'
  ctx.fillRect(0, 0, w, h)
  if (!strike) return 0
  const age = t - strike.at
  const level = flashLevel(age)
  if (level < 0.01) return 0
  // Light from behind the clouds, brightest above where it struck
  const g = ctx.createRadialGradient(strike.glowX, -h * 0.1, 0, strike.glowX, -h * 0.1, Math.max(w, h))
  g.addColorStop(0, `rgba(225, 233, 255, ${0.26 * level})`)
  g.addColorStop(0.5, `rgba(200, 212, 245, ${0.1 * level})`)
  g.addColorStop(1, 'rgba(200, 212, 245, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  if (strike.bolt && age < 0.6) {
    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.shadowColor = 'rgba(190, 210, 255, 0.9)'
    ctx.shadowBlur = 18
    strike.bolt.forEach((path, i) => {
      ctx.globalAlpha = level * (i === 0 ? 1 : 0.6)
      ctx.strokeStyle = '#f4f7ff'
      ctx.lineWidth = i === 0 ? 2.2 : 1.1
      ctx.beginPath()
      path.forEach((pt, j) => (j ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)))
      ctx.stroke()
    })
    ctx.restore()
  }
  return level
}

// Warm sunlight falling in from the top-right corner
function drawSun(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const r = Math.max(w, h) * 0.75
  const g = ctx.createRadialGradient(w * 0.92, -h * 0.08, 0, w * 0.92, -h * 0.08, r)
  const pulse = 0.04 * Math.sin(t * 0.5)
  g.addColorStop(0, `rgba(255, 196, 92, ${0.3 + pulse})`)
  g.addColorStop(0.35, 'rgba(255, 170, 70, 0.1)')
  g.addColorStop(1, 'rgba(255, 150, 60, 0)')
  ctx.globalAlpha = 1
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

export function Weather({ reducedMotion }: { reducedMotion: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return

    let season = getSeason()
    let particles: Particle[] = []
    let w = 0
    let h = 0
    let raf = 0
    let last = 0
    let t = 0
    let swap = 0
    let strike: Strike | null = null
    let nextStrike = rand(1.2, 3)

    const fill = () => {
      if (season === 'off') {
        particles = []
        return
      }
      const count = Math.max(8, Math.round((DENSITY[season] * (w * h)) / (1440 * 900)))
      particles = Array.from({ length: count }, () => spawn(season as Season, w, h, true))
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth
      h = window.innerHeight
      el.width = Math.round(w * dpr)
      el.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fill()
      if (reducedMotion) draw()
    }

    const step = (dt: number) => {
      if (season === 'off') return
      // Lightning at a random moment every 2–5 seconds
      if (season === 'storm' && t >= nextStrike) {
        strike = { at: t, bolt: Math.random() < 0.65 ? makeBolt(w, h) : null, glowX: rand(0.15, 0.85) * w }
        nextStrike = t + rand(2, 5)
        // The hero name lights up with the same flash
        window.dispatchEvent(new Event(LIGHTNING))
      }
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const sway = Math.sin(t * (season === 'winter' ? 0.9 : 1.4) + p.phase)
        const swayX = season === 'autumn' ? 38 : season === 'spring' ? 22 : season === 'winter' ? 12 : season === 'storm' ? 0 : 10
        p.x += (p.vx + sway * swayX) * dt
        p.y += p.vy * dt
        p.rot += p.spin * dt
        const gone = season === 'summer' ? p.y < -30 : p.y > h + 30
        if (gone || p.x < -80 || p.x > w + 80) particles[i] = spawn(season, w, h, false)
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h)
      if (season === 'off') return
      if (season === 'summer') drawSun(ctx!, w, h, t)
      if (season === 'storm') {
        // Drops catch the light while the sky flashes
        const boost = 1 + 1.4 * drawStorm(ctx!, w, h, strike, t)
        for (const p of particles) drawDrop(ctx!, p, boost)
        ctx!.globalAlpha = 1
        return
      }
      for (const p of particles) {
        if (season === 'spring') drawPetal(ctx!, p)
        else if (season === 'autumn') drawLeaf(ctx!, p)
        else if (season === 'summer') drawMote(ctx!, p, t)
        else drawFlake(ctx!, p)
      }
      ctx!.globalAlpha = 1
    }

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min((now - (last || now)) / 1000, 0.05)
      last = now
      t += dt
      step(dt)
      draw()
      loop()
    }

    // Animate only while there is weather to show and the tab is visible
    function loop() {
      if (reducedMotion || season === 'off' || document.hidden || raf) return
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
      last = 0
    }

    // Switching seasons fades the old weather out and the new one in
    const onChange = () => {
      clearTimeout(swap)
      el.style.opacity = '0'
      swap = window.setTimeout(
        () => {
          season = getSeason()
          strike = null
          nextStrike = t + rand(1.2, 3)
          stop()
          fill()
          draw()
          el.style.opacity = '1'
          loop()
        },
        reducedMotion ? 0 : 450,
      )
    }
    const onVisibility = () => (document.hidden ? stop() : loop())

    resize()
    draw()
    loop()
    window.addEventListener('resize', resize)
    window.addEventListener(WEATHER_CHANGE, onChange)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      clearTimeout(swap)
      window.removeEventListener('resize', resize)
      window.removeEventListener(WEATHER_CHANGE, onChange)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reducedMotion])

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] h-full w-full transition-opacity duration-500 ease-out"
    />
  )
}
