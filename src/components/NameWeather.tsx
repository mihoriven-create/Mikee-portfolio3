import { useEffect, useRef } from 'react'
import { LIGHTNING, WEATHER_CHANGE, getSeason } from '../lib/weather'
import { WIND, drawDrop, drawLeaf, drawPetal, flashLevel, pick, rand, type Particle } from './Weather'

// Weather that touches the hero name, on a canvas laid over the heading. The letters are traced into
// a mask so the weather knows where their top edges are: snow settles on them in winter, rain
// splashes and runs down them in a storm (and they light up with each lightning strike), leaves
// catch on them in autumn, blossoms drift past in spring, and summer brings a heat shimmer and the
// sun glinting across the letters, beads of sweat running down them. Restrained so the name stays readable, running only while the hero is on
// screen, and a still frame for reduced-motion visitors.

const PAD_TOP = 90 // room above the name for weather to fall in from
const PAD_X = 40
const PAD_BOTTOM = 32
const COL = 2 // letter edges are sampled every 2px
const SOLID = 140 // mask alpha that counts as inside a letter
const TAU = Math.PI * 2

const LEAF = ['#d9622b', '#e8892f', '#b8401f', '#f0b23c']
const PETAL = ['#ffc4dc', '#ffd9e8', '#f7a8c8', '#fbe6ef']
const SPROUT = ['#9ccc65', '#7cb342', '#aed581']

// A flat top edge of a letter: where snow piles up and leaves come to rest
type Ledge = { x: number; y: number; max: number; snow: number; left: number; right: number }
// A falling flake, drop, leaf or petal; leaves can rest on a ledge for a while
type Mote = Particle & { rest: number; floor: number }
// A water bead on a letter: it swells, slides down the face, then drips off the bottom
type Bead = { x: number; y: number; y0: number; r: number; max: number; hold: number; vy: number; state: 0 | 1 | 2; alpha: number }
type Splash = { x: number; y: number; vx: number; vy: number; life: number }
type Glyph = { ch: string; x: number; y: number; font: string }

function paintGlyphs(ctx: CanvasRenderingContext2D, glyphs: Glyph[], scale: number, color: string) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.fillStyle = color
  ctx.textBaseline = 'alphabetic'
  for (const g of glyphs) {
    ctx.font = g.font
    ctx.fillText(g.ch, g.x, g.y)
  }
}

export function NameWeather({ ready, reducedMotion }: { ready: boolean; reducedMotion: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    const h1 = el?.parentElement
    const ctx = el?.getContext('2d')
    if (!el || !h1 || !ctx || !ready) return

    let season = getSeason()
    let W = 0
    let H = 0
    let dpr = 1
    let big = 100
    let textL = 0
    let textR = 0
    let textT = 0
    let mask = new Uint8ClampedArray(0)
    let ledges: Ledge[] = []
    let cols: number[][] = []
    let warm: HTMLCanvasElement | null = null // the letters in a heat tint, for the shimmer
    let cool: HTMLCanvasElement | null = null // the letters in lightning white
  let sun: HTMLCanvasElement | null = null // the letters in sunlight, for the glint
  let glint: HTMLCanvasElement | null = null // scratch canvas the glint is cut out on
    let edges: HTMLCanvasElement | null = null // glossy wet top edges
    let motes: Mote[] = []
    let beads: Bead[] = []
    let splashes: Splash[] = []
    let raf = 0
    let last = 0
    let t = 0
    let nextSweat = 0
    let flashAt = -10
    let live = false
    let visible = true
    let swap = 0
    let start = 0
    let rebuild = 0

    const inside = (x: number, y: number) => {
      const xi = x | 0
      const yi = y | 0
      if (xi < 0 || yi < 0 || xi >= W || yi >= H) return false
      return mask[(yi * W + xi) * 4 + 3] > SOLID
    }

    // Trace the name's letters into a mask, from where the browser actually laid each one out
    const build = () => {
      const hr = h1.getBoundingClientRect()
      const padL = Math.min(PAD_X, Math.max(0, hr.left))
      const padR = Math.min(PAD_X, Math.max(0, window.innerWidth - hr.right))
      W = Math.ceil(hr.width + padL + padR)
      H = Math.ceil(hr.height + PAD_TOP + PAD_BOTTOM)
      Object.assign(el.style, { left: `${-padL}px`, top: `${-PAD_TOP}px`, width: `${W}px`, height: `${H}px` })
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      el.width = Math.round(W * dpr)
      el.height = Math.round(H * dpr)
      const ox = hr.left - padL
      const oy = hr.top - PAD_TOP

      const glyphs: Glyph[] = []
      const lines: { top: number; bottom: number; size: number }[] = []
      const range = document.createRange()
      textL = W
      textR = 0
      textT = H
      big = 0
      h1.querySelectorAll<HTMLElement>('[data-hero-line]').forEach((line) => {
        const node = line.firstChild
        if (!node || node.nodeType !== Node.TEXT_NODE) return
        const cs = getComputedStyle(line)
        const size = parseFloat(cs.fontSize)
        const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
        ctx.font = font
        const ascent = ctx.measureText('M').fontBoundingBoxAscent
        const lr = line.getBoundingClientRect()
        lines.push({ top: lr.top - oy, bottom: lr.bottom - oy, size })
        big = Math.max(big, size)
        const text = (node as Text).data
        for (let i = 0; i < text.length; i++) {
          if (!text[i].trim()) continue
          range.setStart(node, i)
          range.setEnd(node, i + 1)
          const r = range.getBoundingClientRect()
          const x = r.left - ox
          const y = r.top - oy
          const ch = cs.textTransform === 'uppercase' ? text[i].toUpperCase() : text[i]
          glyphs.push({ ch, x, y: y + ascent, font })
          textL = Math.min(textL, x)
          textR = Math.max(textR, x + r.width)
          textT = Math.min(textT, y)
        }
      })

      const m = document.createElement('canvas')
      m.width = W
      m.height = H
      const mc = m.getContext('2d', { willReadFrequently: true })!
      paintGlyphs(mc, glyphs, 1, '#fff')
      mask = mc.getImageData(0, 0, W, H).data

      // Top edges: solid pixels with empty space just above them
      ledges = []
      cols = []
      for (let c = 0, x = 0; x < W; c++, x += COL) {
        cols[c] = []
        for (let y = 1; y < H - 2; y++) {
          if (!inside(x, y) || inside(x, y - 1) || !inside(x, y + 2)) continue
          const size = lines.find((l) => y >= l.top && y <= l.bottom)?.size ?? big
          cols[c].push(ledges.length)
          ledges.push({ x, y, max: size * 0.05, snow: 0, left: -1, right: -1 })
        }
      }
      // Link each edge to its neighbours so settled snow spreads into soft mounds
      cols.forEach((list, c) =>
        list.forEach((i) => {
          const l = ledges[i]
          const near = (cc: number) => (cols[cc] ?? []).find((j) => Math.abs(ledges[j].y - l.y) <= 2) ?? -1
          l.left = near(c - 1)
          l.right = near(c + 1)
        }),
      )

      const tint = (color: string) => {
        const c = document.createElement('canvas')
        c.width = el.width
        c.height = el.height
        paintGlyphs(c.getContext('2d')!, glyphs, dpr, color)
        return c
      }
      warm = tint('rgb(255, 196, 120)')
      cool = tint('rgb(232, 238, 255)')
      sun = tint('rgb(255, 240, 200)')
      glint = document.createElement('canvas')
      glint.width = el.width
      glint.height = el.height
      edges = document.createElement('canvas')
      edges.width = el.width
      edges.height = el.height
      const ec = edges.getContext('2d')!
      ec.setTransform(dpr, 0, 0, dpr, 0, 0)
      ec.fillStyle = 'rgb(215, 228, 255)'
      for (const l of ledges) ec.fillRect(l.x, l.y, COL, 1)
    }

    // Edges whose top a falling thing crossed this frame, between y0 and y1
    const crossed = (x: number, y0: number, y1: number) => {
      const list = cols[Math.round(x / COL)]
      if (!list) return -1
      for (const i of list) {
        const top = ledges[i].y - ledges[i].snow
        if (y0 < top && y1 >= top) return i
      }
      return -1
    }

    const fresh = (anywhere: boolean): Mote => {
      const k = Math.min(1, Math.max(0.55, big / 120))
      const p: Mote = {
        x: rand(textL - 60, textR + 60),
        y: anywhere ? rand(0, H) : rand(-30, -8),
        vx: 0,
        vy: 0,
        size: 0,
        rot: rand(0, TAU),
        spin: 0,
        phase: rand(0, TAU),
        color: '#ffffff',
        alpha: 1,
        rest: 0,
        floor: -1,
      }
      switch (season) {
        case 'winter': {
          const d = Math.random()
          p.size = 1.4 + d * 2.2
          p.vx = rand(-5, 8)
          p.vy = 16 + d * 26
          p.alpha = 0.45 + d * 0.5
          break
        }
        case 'storm': {
          const d = Math.random()
          p.x = rand(textL - 40, textR + 40 + H * Math.abs(WIND))
          p.vy = 650 + d * 350
          p.vx = p.vy * WIND
          p.size = 9 + d * 9
          p.alpha = 0.16 + d * 0.26
          p.color = pick(['#c9d6e8', '#dfe8f5'])
          break
        }
        case 'autumn':
          p.size = rand(7, 11) * k
          p.vx = rand(-8, 18)
          p.vy = rand(26, 48)
          p.spin = rand(-2, 2)
          p.alpha = rand(0.8, 0.95)
          p.color = pick(LEAF)
          break
        case 'spring':
          // Blossoms and the odd fresh leaf blow past from the left
          p.color = Math.random() < 0.75 ? pick(PETAL) : pick(SPROUT)
          p.size = rand(6, 10) * k
          p.x = anywhere ? rand(textL - 60, textR + 60) : textL - rand(60, 140)
          p.y = rand(PAD_TOP * 0.3, H - PAD_BOTTOM)
          p.vx = rand(26, 52)
          p.vy = rand(-3, 10)
          p.spin = rand(-1.4, 1.4)
          p.alpha = rand(0.7, 0.95)
          break
      }
      return p
    }

    const addBead = (x: number, y: number, sweat: boolean) =>
      beads.push({
        x,
        y,
        y0: y,
        r: 0.3,
        max: (sweat ? rand(1.6, 2.8) : rand(1.1, 2.1)) * Math.min(1, Math.max(0.6, big / 110)),
        hold: sweat ? rand(1.5, 4) : rand(0.6, 3),
        vy: 0,
        state: 0,
        alpha: 1,
      })

    const randomLedge = () => ledges[Math.floor(Math.random() * ledges.length)]

    // A fresh start for the current season (also the whole picture for reduced motion)
    const seed = () => {
      motes = []
      beads = []
      splashes = []
      nextSweat = t + rand(0.5, 1.5)
      for (const l of ledges) l.snow = 0
      if (season === 'off' || !ledges.length) return
      const per = Math.max(200, textR - textL) / 1000
      const many = (n: number, min: number) => Array.from({ length: Math.max(min, Math.round(n * per)) }, () => fresh(true))
      if (season === 'winter') {
        // Patchy caps of snow already lying on the letters
        const p1 = rand(0, 9)
        const p2 = rand(0, 9)
        for (const l of ledges) l.snow = Math.max(0, Math.sin(l.x * 0.045 + p1) + Math.sin(l.x * 0.11 + p2) - 0.3) * 0.5 * l.max
        motes = many(40, 12)
      } else if (season === 'storm') {
        motes = many(70, 18)
        for (let i = 0; i < 8; i++) {
          const l = randomLedge()
          addBead(l.x + rand(0, COL), l.y + 3, false)
        }
      } else if (season === 'summer') {
        for (let i = 0; i < 4; i++) sweat()
      } else if (season === 'autumn') {
        motes = many(9, 5)
        // A couple of leaves already caught on the letters
        for (const p of motes.slice(0, 2)) {
          const l = randomLedge()
          p.x = l.x
          p.y = l.y - p.size * 0.35
          p.rot = 0
          p.rest = rand(2, 4)
          p.floor = l.y + 4
        }
      } else {
        motes = many(16, 8)
      }
    }

    // A bead of sweat somewhere on a letter face
    const sweat = () => {
      for (let i = 0; i < 30; i++) {
        const x = rand(textL, textR)
        const y = rand(textT, H - PAD_BOTTOM)
        if (inside(x, y) && inside(x, y + 6)) return addBead(x, y, true)
      }
    }

    const settle = (hit: number) => {
      const add = (i: number, a: number) => {
        if (i < 0) return -1
        const l = ledges[i]
        l.snow = Math.min(l.max, l.snow + a)
        return i
      }
      const a = 0.3 * ledges[hit].max
      add(hit, a)
      const l1 = add(ledges[hit].left, a * 0.7)
      if (l1 >= 0) add(ledges[l1].left, a * 0.35)
      const r1 = add(ledges[hit].right, a * 0.7)
      if (r1 >= 0) add(ledges[r1].right, a * 0.35)
    }

    const step = (dt: number) => {
      for (let i = 0; i < motes.length; i++) {
        const p = motes[i]
        if (p.rest > 0) {
          // A caught leaf settles flat, then the breeze tips it off
          p.rest -= dt
          p.rot += (Math.round(p.rot / Math.PI) * Math.PI - p.rot) * Math.min(1, dt * 4)
          if (p.rest <= 0) {
            p.vx = pick([-1, 1]) * rand(14, 28)
            p.vy = rand(20, 34)
          }
          continue
        }
        const y0 = p.y
        const sway = season === 'winter' ? Math.sin(t * 0.9 + p.phase) * 10 : season === 'autumn' ? Math.sin(t * 1.4 + p.phase) * 30 : 0
        p.x += (p.vx + sway) * dt
        p.y += (season === 'spring' ? p.vy + Math.sin(t * 1.3 + p.phase) * 14 : p.vy) * dt
        p.rot += p.spin * dt
        const hit = season === 'spring' ? -1 : crossed(p.x, Math.max(y0, p.floor), p.y)
        if (hit >= 0) {
          const l = ledges[hit]
          if (season === 'winter' && Math.random() < 0.6) {
            settle(hit)
            motes[i] = fresh(false)
            continue
          }
          if (season === 'storm') {
            if (Math.random() < 0.7) {
              for (let s = 0, n = 1 + Math.round(Math.random()); s < n; s++)
                splashes.push({ x: p.x, y: l.y - 1, vx: rand(-45, 45), vy: rand(-110, -50), life: rand(0.18, 0.32) })
            }
            if (Math.random() < 0.025 && beads.length < 20) addBead(l.x + rand(0, COL), l.y + 3, false)
            motes[i] = fresh(false)
            continue
          }
          if (season === 'autumn' && Math.random() < 0.55) {
            p.rest = rand(1.5, 4.5)
            p.y = l.y - p.size * 0.35
            p.floor = l.y + 4
            continue
          }
        }
        const out = season === 'spring' ? p.x > W + 30 || p.y > H + 20 || p.y < -30 : p.y > H + 20 || p.x < -40 || p.x > W + 40
        if (out) motes[i] = fresh(false)
      }

      if (season === 'winter') for (const l of ledges) if (l.snow > 0) l.snow = Math.max(0, l.snow - dt * 0.004 * l.max)

      if (season === 'summer' && t >= nextSweat) {
        if (beads.length < 12) sweat()
        nextSweat = t + rand(0.5, 1.6)
      }

      for (let i = beads.length - 1; i >= 0; i--) {
        const b = beads[i]
        if (b.state === 0) {
          b.r = Math.min(b.max, b.r + (dt * b.max) / 1.6)
          if (b.r >= b.max && (b.hold -= dt) <= 0) b.state = 1
        } else if (b.state === 1) {
          b.vy = Math.min(b.vy + 50 * dt, 70)
          b.y += b.vy * dt
          if (!inside(b.x, b.y + b.r + 1)) b.state = 2
        } else {
          b.vy += 900 * dt
          b.y += b.vy * dt
          b.alpha -= dt * 2.5
        }
        if (b.alpha <= 0 || b.y > H) beads.splice(i, 1)
      }

      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]
        s.vy += 900 * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        if ((s.life -= dt) <= 0) splashes.splice(i, 1)
      }
    }

    function draw() {
      const c = ctx!
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, W, H)
      c.globalAlpha = 1
      if (season === 'off') return

      if (season === 'summer' && warm && !reducedMotion) {
        // Heat shimmer: a faint warm copy of the letters, wavering in thin rows, coming and going
        const e = 0.75 + 0.25 * Math.sin(t * 0.35)
        c.globalAlpha = 0.34 * e
        for (let y = Math.max(0, Math.floor(textT) - 4); y < H - PAD_BOTTOM; y += 3) {
          const dx = Math.sin(y * 0.11 + t * 3.1) * 2.4 * e
          c.drawImage(warm, 0, y * dpr, W * dpr, 3 * dpr, dx, y, W, 3)
        }
      }

      if (season === 'summer' && sun && glint && !reducedMotion) {
        // Sunlight glinting across the letters: a bright diagonal band that sweeps by every 6 seconds
        const g = (t % 6) / 1.8
        if (g < 1) {
          const gc = glint.getContext('2d')!
          const x = textL - 160 + (textR - textL + 320) * g
          gc.setTransform(1, 0, 0, 1, 0, 0)
          gc.globalCompositeOperation = 'source-over'
          gc.clearRect(0, 0, glint.width, glint.height)
          gc.drawImage(sun, 0, 0)
          gc.globalCompositeOperation = 'source-in'
          gc.setTransform(dpr, 0, 0, dpr, 0, 0)
          const band = gc.createLinearGradient(x - 70, textT, x + 70, textT + 90)
          band.addColorStop(0, 'rgba(255, 244, 214, 0)')
          band.addColorStop(0.5, 'rgba(255, 244, 214, 1)')
          band.addColorStop(1, 'rgba(255, 244, 214, 0)')
          gc.fillStyle = band
          gc.fillRect(0, 0, W, H)
          c.globalAlpha = 0.7 * Math.sin(g * Math.PI)
          c.drawImage(glint, 0, 0, W, H)
        }
      }

      let flash = 0
      if (season === 'storm' && edges) {
        // Wet, glossy top edges; the letters catch each lightning strike
        flash = reducedMotion ? 0 : flashLevel(t - flashAt)
        c.globalAlpha = 0.4 + 0.5 * flash
        c.drawImage(edges, 0, 0, W, H)
        if (flash > 0.01 && cool) {
          c.globalAlpha = 0.32 * flash
          c.drawImage(cool, 0, 0, W, H)
        }
      }

      if (season === 'winter') {
        // Snow caps: overlapping soft blobs, with a cool shade underneath so they read on light themes too
        for (const pass of [0, 1]) {
          c.globalAlpha = pass ? 0.95 : 0.55
          c.fillStyle = pass ? '#ffffff' : '#b9c8dc'
          c.beginPath()
          for (const l of ledges) {
            if (l.snow < 0.25) continue
            const r = l.snow * 0.6 + 0.6
            const cx = l.x + COL / 2
            const cy = l.y - l.snow * 0.45 + (pass ? 0 : 0.8)
            c.moveTo(cx + r, cy)
            c.arc(cx, cy, r, 0, TAU)
          }
          c.fill()
        }
      }

      for (const b of beads) {
        const tone = season === 'summer' ? '255, 244, 228' : '228, 238, 255'
        if (b.state > 0) {
          c.globalAlpha = 0.16 * b.alpha
          c.strokeStyle = `rgb(${tone})`
          c.lineWidth = b.r * 0.9
          c.beginPath()
          c.moveTo(b.x, b.y0)
          c.lineTo(b.x, b.y)
          c.stroke()
        }
        c.globalAlpha = 0.55 * b.alpha
        c.fillStyle = `rgb(${tone})`
        c.beginPath()
        c.arc(b.x, b.y, b.r, 0, TAU)
        c.fill()
        c.globalAlpha = 0.9 * b.alpha
        c.fillStyle = '#ffffff'
        c.beginPath()
        c.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.35, 0, TAU)
        c.fill()
      }

      c.fillStyle = '#dfe8f5'
      for (const s of splashes) {
        c.globalAlpha = Math.min(1, s.life / 0.2) * 0.6
        c.fillRect(s.x, s.y, 1.2, 1.2)
      }

      for (const p of motes) {
        if (season === 'winter') {
          c.globalAlpha = p.alpha
          c.fillStyle = p.color
          c.beginPath()
          c.arc(p.x, p.y, p.size, 0, TAU)
          c.fill()
        } else if (season === 'storm') drawDrop(c, p, 1 + 1.4 * flash)
        else if (season === 'autumn' || SPROUT.includes(p.color)) drawLeaf(c, p)
        else drawPetal(c, p)
      }
      c.globalAlpha = 1
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

    // Animate only after the intro, while the name is on screen, the tab is visible and there is weather
    function loop() {
      if (reducedMotion || !live || !visible || season === 'off' || document.hidden || raf) return
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
      last = 0
    }

    const reset = () => {
      build()
      seed()
      draw()
    }

    // Trace the letters once the fonts are in and the name has finished rising into place
    let cancelled = false
    document.fonts.ready.then(() => {
      if (cancelled) return
      start = window.setTimeout(
        () => {
          live = true
          reset()
          el.style.opacity = '1'
          loop()
        },
        reducedMotion ? 0 : 1300,
      )
    })

    const resizer = new ResizeObserver(() => {
      if (!live) return
      clearTimeout(rebuild)
      rebuild = window.setTimeout(reset, 150)
    })
    resizer.observe(h1)

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) loop()
      else stop()
    })
    seen.observe(h1)

    const onChange = () => {
      clearTimeout(swap)
      el.style.opacity = '0'
      swap = window.setTimeout(
        () => {
          season = getSeason()
          stop()
          seed()
          draw()
          if (live) el.style.opacity = '1'
          loop()
        },
        reducedMotion ? 0 : 450,
      )
    }
    const onLightning = () => {
      flashAt = t
    }
    const onVisibility = () => (document.hidden ? stop() : loop())

    window.addEventListener(WEATHER_CHANGE, onChange)
    window.addEventListener(LIGHTNING, onLightning)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      stop()
      clearTimeout(start)
      clearTimeout(swap)
      clearTimeout(rebuild)
      resizer.disconnect()
      seen.disconnect()
      window.removeEventListener(WEATHER_CHANGE, onChange)
      window.removeEventListener(LIGHTNING, onLightning)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [ready, reducedMotion])

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 opacity-0 transition-opacity duration-500 ease-out"
      // Fade the top and bottom so weather drifts in and out instead of cutting off
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, #000 50px, #000 calc(100% - 20px), transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 50px, #000 calc(100% - 20px), transparent)',
      }}
    />
  )
}
