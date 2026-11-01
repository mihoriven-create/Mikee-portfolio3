import * as THREE from 'three'
import { CAMERA_ROUTE, ROUTE_LENGTH, TURN_AT, TURNS, type P2 } from '../../config/route'

// The route itself lives in config/route.ts. The walls follow WALL_ROUTE (the camera route,
// extended behind the start and past the end); the camera follows CAMERA_ROUTE.
export { CAMERA_ROUTE, CAMERA_START_Z } from '../../config/route'
const WALL_ROUTE: P2[] = [[0, 18], ...TURNS, [0, -112]]
// Where the camera settles its gaze at the end of the maze (the glowing end wall).
export const END_FOCUS: [number, number, number] = [0, 4.6, -102]

export const EYE_Y = 2.4
const CORNER_RADIUS = 3.2

// Straight corridors joined by rounded corners, so the camera sweeps around each turn.
function createCameraRoute() {
  const pts = CAMERA_ROUTE.map(([x, z]) => new THREE.Vector3(x, EYE_Y, z))
  const path = new THREE.CurvePath<THREE.Vector3>()
  let from = pts[0]
  for (let i = 1; i < pts.length - 1; i++) {
    const corner = pts[i]
    const inDir = corner.clone().sub(pts[i - 1]).normalize()
    const outDir = pts[i + 1].clone().sub(corner).normalize()
    const enter = corner.clone().addScaledVector(inDir, -CORNER_RADIUS)
    const exit = corner.clone().addScaledVector(outDir, CORNER_RADIUS)
    path.add(new THREE.LineCurve3(from, enter))
    path.add(new THREE.QuadraticBezierCurve3(enter, corner, exit))
    from = exit
  }
  path.add(new THREE.LineCurve3(from, pts[pts.length - 1]))
  return path
}

export const cameraRoute = createCameraRoute()

if (import.meta.env.DEV) {
  if (Math.abs(cameraRoute.getLength() - ROUTE_LENGTH) > 0.5) {
    console.warn(`ROUTE_LENGTH in config/route.ts should be ${cameraRoute.getLength().toFixed(1)}`)
  }
  // Each turn is a bezier between two straights: curve indices 1, 3, 5, 7
  const lengths = cameraRoute.getCurveLengths()
  TURN_AT.forEach((at, i) => {
    const mid = (lengths[i * 2] + lengths[i * 2 + 1]) / 2
    if (Math.abs(mid - at) > 0.5) console.warn(`TURN_AT[${i}] in config/route.ts should be ${mid.toFixed(1)}`)
  })
}

export const CORRIDOR_HALF_WIDTH = 3.6
const WALL_THICKNESS = 0.45
export const MAZE_BOUNDS = { minX: -40, maxX: 10, minZ: -118, maxZ: 22 }

export type Panel = {
  cx: number
  cz: number
  yaw: number // rotates local +x onto the corridor-facing normal, local +z along the wall
  w: number // length along the wall
  h: number
  d: number // thickness
  inner: boolean // faces the corridor (gets edge strips and light traces)
  // Lights its far edge too. Off where the next panel in the wall sits right beside it, whose own
  // near-edge strip already marks the seam (two strips there read as a doubled line).
  farEdge?: boolean
}

type Seg = { a: P2; b: P2 }

function dirOf(a: P2, b: P2): P2 {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const len = Math.hypot(dx, dz)
  return [dx / len, dz / len]
}

// Left-hand normal of a heading on the floor (heading -z → left is -x).
const leftOf = (d: P2): P2 => [d[1], -d[0]]

// Offsets a right-angled polyline sideways; outer corners grow, inner corners shrink.
function offsetRoute(route: P2[], dist: number): P2[] {
  return route.map((p, i) => {
    const nPrev = i > 0 ? leftOf(dirOf(route[i - 1], p)) : null
    const nNext = i < route.length - 1 ? leftOf(dirOf(p, route[i + 1])) : null
    let nx = 0
    let nz = 0
    if (nPrev && nNext && (nPrev[0] !== nNext[0] || nPrev[1] !== nNext[1])) {
      nx = nPrev[0] + nNext[0]
      nz = nPrev[1] + nNext[1]
    } else {
      const n = (nPrev ?? nNext)!
      nx = n[0]
      nz = n[1]
    }
    return [p[0] + nx * dist, p[1] + nz * dist]
  })
}

export function routeSegments(route: P2[]): Seg[] {
  return route.slice(1).map((b, i) => ({ a: route[i], b }))
}

export const railSegments = (dist: number) => routeSegments(offsetRoute(CAMERA_ROUTE, dist))

function distToSegment(px: number, pz: number, { a, b }: Seg) {
  const vx = b[0] - a[0]
  const vz = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((px - a[0]) * vx + (pz - a[1]) * vz) / (vx * vx + vz * vz)))
  return Math.hypot(px - (a[0] + vx * t), pz - (a[1] + vz * t))
}

// Lines up panels along one wall line. `inward` is the floor normal pointing into the corridor.
function lineWall(seg: Seg, inward: P2, rand: () => number, out: Panel[], hRange: [number, number]) {
  const [ax, az] = seg.a
  const dir = dirOf(seg.a, seg.b)
  const total = Math.hypot(seg.b[0] - ax, seg.b[1] - az)
  const yaw = Math.atan2(-inward[1], inward[0])
  let s = 0
  while (s < total - 0.2) {
    const w = Math.min(1.8 + rand() * 2.6, total - s)
    const d = WALL_THICKNESS
    const mid = s + w / 2
    const tall = rand() < 0.15
    const panel: Panel = {
      cx: ax + dir[0] * mid - inward[0] * (d / 2),
      cz: az + dir[1] * mid - inward[1] * (d / 2),
      yaw,
      w: w - 0.08,
      h: tall ? hRange[1] + 3 + rand() * 4 : hRange[0] + rand() * (hRange[1] - hRange[0]),
      d,
      inner: true,
    }
    out.push(panel)
    const gap = rand() < 0.2 ? 0.25 + rand() * 0.5 : 0.04
    s += w + gap
    panel.farEdge = gap > 0.1 || s >= total - 0.2
  }
}

// Square column that fills the joint where two walls meet, flush with both inner faces.
function cornerPillar(corner: P2, in1: P2, in2: P2): Panel {
  const D = WALL_THICKNESS
  return {
    cx: corner[0] - (in1[0] + in2[0]) * (D / 2),
    cz: corner[1] - (in1[1] + in2[1]) * (D / 2),
    yaw: Math.atan2(-in1[1], in1[0]),
    w: D,
    h: 12,
    d: D,
    inner: false,
  }
}

export function generateMaze(skylineCount: number): Panel[] {
  const rand = mulberry32(7)
  const panels: Panel[] = []
  const W = CORRIDOR_HALF_WIDTH

  const D = WALL_THICKNESS
  const capIn: P2[] = [
    [0, -1], // start cap faces down the first corridor
    [0, 1], // end cap faces back down the last corridor
  ]

  // Left and right walls of every corridor. Where two walls meet at a turn, both stop short
  // of the joint and a single pillar fills it, so no panels cross through each other.
  for (const side of [1, -1] as const) {
    const segs = routeSegments(offsetRoute(WALL_ROUTE, side * W))
    const inward = segs.map(({ a, b }): P2 => {
      const l = leftOf(dirOf(a, b))
      return [-side * l[0], -side * l[1]]
    })
    // On the inside of a turn both walls' thickness lands in the same square: trim them back.
    const innerTurn = (i: number) => {
      const next = dirOf(segs[i + 1].a, segs[i + 1].b)
      return next[0] * inward[i][0] + next[1] * inward[i][1] < 0
    }

    segs.forEach(({ a, b }, i) => {
      const dir = dirOf(a, b)
      const trimA = i > 0 && innerTurn(i - 1) ? D : 0
      const trimB = i < segs.length - 1 && innerTurn(i) ? D : 0
      lineWall(
        { a: [a[0] + dir[0] * trimA, a[1] + dir[1] * trimA], b: [b[0] - dir[0] * trimB, b[1] - dir[1] * trimB] },
        inward[i],
        rand,
        panels,
        [7, 11],
      )
      if (i < segs.length - 1) panels.push(cornerPillar(b, inward[i], inward[i + 1]))
    })

    panels.push(cornerPillar(segs[0].a, inward[0], capIn[0]))
    panels.push(cornerPillar(segs[segs.length - 1].b, inward[segs.length - 1], capIn[1]))
  }

  // End caps: behind the start, and the wall at the end of the maze
  const first = WALL_ROUTE[0]
  const last = WALL_ROUTE[WALL_ROUTE.length - 1]
  lineWall({ a: [first[0] - W, first[1]], b: [first[0] + W, first[1]] }, capIn[0], rand, panels, [7, 11])
  lineWall({ a: [last[0] - W, last[1]], b: [last[0] + W, last[1]] }, capIn[1], rand, panels, [9, 12])

  // Skyline towers beyond the walls, kept clear of every corridor
  const segs = routeSegments(WALL_ROUTE)
  const { minX, maxX, minZ, maxZ } = MAZE_BOUNDS
  let guard = 0
  for (let i = 0; i < skylineCount && guard < skylineCount * 20; guard++) {
    const x = minX - 15 + rand() * (maxX - minX + 30)
    const z = minZ - 15 + rand() * (maxZ - minZ + 30)
    if (segs.some((s) => distToSegment(x, z, s) < W + 4)) continue
    panels.push({
      cx: x,
      cz: z,
      yaw: rand() < 0.5 ? 0 : Math.PI / 2,
      w: 2 + rand() * 4,
      h: 12 + rand() * 16,
      d: 1 + rand() * 2,
      inner: false,
    })
    i++
  }

  return panels
}

// Deterministic PRNG so the scene looks the same on every load.
export function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Procedural circuit-board pattern used as the towers' emissive map.
export function createCircuitTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, c.width, c.height)

  const rand = mulberry32(11)
  const grid = 16

  for (let i = 0; i < 46; i++) {
    let x = Math.round(rand() * (c.width / grid)) * grid
    let y = Math.round(rand() * (c.height / grid)) * grid
    const alpha = 0.2 + rand() * 0.6
    const color = `rgba(255,${(40 + rand() * 70) | 0},31,${alpha})`
    g.strokeStyle = color
    g.fillStyle = color
    g.lineWidth = rand() < 0.2 ? 2 : 1

    g.beginPath()
    g.arc(x, y, 2.5, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.moveTo(x, y)
    const steps = 3 + ((rand() * 6) | 0)
    for (let s = 0; s < steps; s++) {
      const len = grid * (1 + ((rand() * 4) | 0))
      if (rand() < 0.6) {
        y += rand() < 0.5 ? len : -len
      } else {
        const dx = (rand() < 0.5 ? 1 : -1) * len * 0.5
        x += dx
        y += Math.abs(dx)
      }
      g.lineTo(x, y)
    }
    g.stroke()
    g.beginPath()
    g.arc(x, y, 2.5, 0, Math.PI * 2)
    g.fill()
  }

  // Faint panel seams
  g.strokeStyle = 'rgba(255,42,31,0.18)'
  g.lineWidth = 1
  for (let y = 0; y < c.height; y += 128) g.strokeRect(6, y + 6, c.width - 12, 116)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// Soft red/orange glow for the end of the corridor.
export function createHorizonTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(256, 256, 0, 256, 256, 300)
  grad.addColorStop(0, 'rgba(255,140,40,1)')
  grad.addColorStop(0.18, 'rgba(255,60,20,0.85)')
  grad.addColorStop(0.5, 'rgba(160,10,10,0.35)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, c.width, c.height)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
