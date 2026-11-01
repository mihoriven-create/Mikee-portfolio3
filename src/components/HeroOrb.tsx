import { type MutableRefObject, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Reads an "R G B" theme variable from index.css as a three.js colour.
const themeColor = (name: string) => {
  const rgb = getComputedStyle(document.documentElement).getPropertyValue(name).trim().split(/\s+/).map(Number)
  return rgb.length === 3 && rgb.every((n) => !Number.isNaN(n))
    ? new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
    : new THREE.Color('#ff2a1f')
}

// The accent and tint colours of the active theme; updates when the palette button switches theme.
function useThemeColors() {
  const read = () => ({ accent: themeColor('--c-red'), ember: themeColor('--c-ember'), tint: themeColor('--c-tint') })
  const [colors, setColors] = useState(read)
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(read()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return colors
}

// One tilted orbit: a thin ring with beads travelling along it.
function Orbit({
  radius,
  tilt,
  speed,
  beads,
  color,
}: {
  radius: [number, number]
  tilt: [number, number, number]
  speed: number
  beads: number
  color: THREE.Color
}) {
  const group = useRef<THREE.Group>(null)
  const beadRefs = useRef<(THREE.Mesh | null)[]>([])
  const curve = useMemo(() => new THREE.EllipseCurve(0, 0, radius[0], radius[1]), [radius])
  const ring = useMemo(() => new THREE.BufferGeometry().setFromPoints(curve.getPoints(160)), [curve])
  const offsets = useMemo(() => Array.from({ length: beads }, (_, i) => i / beads + Math.random() * 0.08), [beads])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed
    beadRefs.current.forEach((m, i) => {
      if (!m) return
      const p = curve.getPoint((offsets[i] + t) % 1)
      m.position.set(p.x, p.y, 0)
    })
  })

  return (
    <group ref={group} rotation={tilt}>
      <lineLoop geometry={ring}>
        <lineBasicMaterial color={color} transparent opacity={0.45} />
      </lineLoop>
      {offsets.map((_, i) => (
        <mesh key={i} ref={(m) => (beadRefs.current[i] = m)}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

// `size` scales the whole orb inside the scene (the travelling orb uses it); the canvas itself never resizes.
export function Orb({
  animate,
  hovered,
  size,
}: {
  animate: boolean
  hovered: { current: boolean }
  size?: { current: number }
}) {
  const { accent, ember, tint } = useThemeColors()
  const gem = useRef<THREE.Mesh>(null)
  const shell = useRef<THREE.LineSegments>(null)
  const rig = useRef<THREE.Group>(null)
  const shellGeometry = useMemo(() => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.32, 2)), [])
  // Grows in on load and swells a little on hover
  const swell = useRef(animate ? 0.85 : 1)
  // Extra spin that kicks in when the theme changes and eases back to normal
  const boost = useRef(0)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    boost.current = 9
  }, [accent])

  useFrame(({ pointer }, delta) => {
    if (!animate) {
      rig.current?.scale.setScalar(size?.current ?? 1)
      return
    }
    if (gem.current) {
      gem.current.rotation.y += delta * (0.25 + boost.current)
      boost.current = THREE.MathUtils.damp(boost.current, 0, 3, delta)
      gem.current.rotation.x += delta * 0.08
    }
    if (shell.current) shell.current.rotation.y -= delta * 0.06
    // Gentle tilt toward the cursor
    if (rig.current) {
      swell.current = THREE.MathUtils.damp(swell.current, hovered.current ? 1.05 : 1, 4, delta)
      rig.current.scale.setScalar(swell.current * (size?.current ?? 1))
      rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, -pointer.y * 0.1, 0.05)
      rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, pointer.x * 0.12, 0.05)
    }
  })

  return (
    <group ref={rig} scale={(animate ? 0.85 : 1) * (size?.current ?? 1)}>
      <ambientLight intensity={0.15} />
      <directionalLight position={[-3, 4, 5]} intensity={2.2} color={tint} />
      <pointLight position={[3, -2, 3]} intensity={10} color={accent} />
      <directionalLight position={[4, 2, 3]} intensity={0.8} color="#ffffff" />
      <pointLight position={[0, 0, -3]} intensity={10} color={ember} />

      {/* Faceted gem: flat shading so every face catches the light differently */}
      <mesh ref={gem}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.12}
          metalness={0.3}
          roughness={0.35}
          flatShading
        />
      </mesh>

      {/* Wireframe shell around it */}
      <lineSegments ref={shell} geometry={shellGeometry}>
        <lineBasicMaterial color={tint} transparent opacity={0.16} />
      </lineSegments>

      <Orbit radius={[1.95, 1.2]} tilt={[0.35, 0.2, 0.3]} speed={0.05} beads={4} color={accent} />
      <Orbit radius={[1.7, 1.55]} tilt={[1.25, -0.3, -0.3]} speed={0.035} beads={3} color={ember} />
      <Orbit radius={[2.05, 0.9]} tilt={[-0.25, 0.4, -0.2]} speed={0.04} beads={3} color={accent} />
    </group>
  )
}

// How far the canvas reaches past the orb's circle on each side, as a share of its size, and the
// field of view that shows the orb at the same size as a 35° view of the circle alone would.
const OVERHANG = 0.2
const OVERHANG_FOV = 2 * THREE.MathUtils.radToDeg(Math.atan((1 + 2 * OVERHANG) * Math.tan(THREE.MathUtils.degToRad(35 / 2))))

// Centre-stage orb for the hero. Its own small canvas with a transparent background; it stops
// drawing while the hero is off screen, and holds still for reduced-motion visitors.
export default function HeroOrb({ reducedMotion }: { reducedMotion: boolean }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const hovered = useRef(false)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const animate = !reducedMotion
  return (
    <div
      ref={wrap}
      className="relative h-full w-full"
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
    >
      {/* The canvas overhangs the clickable circle so the orbits never get cut off at its edge when
          the orb tilts toward the cursor; the wider field of view keeps the orb the same size. */}
      <div className="pointer-events-none absolute" style={{ inset: `${-OVERHANG * 100}%` }}>
        <Canvas
          // Size from layout only: re-measuring on scroll read the box mid-animation and shrank the orb
          resize={{ scroll: false, debounce: { scroll: 0, resize: 100 } }}
          dpr={[1, 2]}
          frameloop={animate && visible ? 'always' : 'demand'}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: OVERHANG_FOV, position: [0, 0, 7.2] }}
          eventSource={wrap as MutableRefObject<HTMLElement>}
        >
          <Orb animate={animate} hovered={hovered} />
        </Canvas>
      </div>
    </div>
  )
}
