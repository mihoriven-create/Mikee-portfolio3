import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from '../../lib/motion'
import { EYE_Y, END_FOCUS, cameraRoute } from './layout'

const LOOK_AHEAD = 0.035 // fraction of the route the camera looks ahead
// Top speed along the route, in route-lengths per second, so a fast scroll can't fling the camera.
const MAX_SPEED = 0.22

// Scroll walks the camera through the maze. Smoothing is applied to the distance along the route,
// never to the camera position itself, so the camera always stays on the curve and can't cut
// across a corner into the wall. Pointer parallax is added on top and fades out in the turns.
export function CameraRig({ animate }: { animate: boolean }) {
  const route = cameraRoute
  const endFocus = useMemo(() => new THREE.Vector3(...END_FOCUS), [])
  const v = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      ahead: new THREE.Vector3(),
      look: new THREE.Vector3(),
      tanNow: new THREE.Vector3(),
      tanAhead: new THREE.Vector3(),
      right: new THREE.Vector3(),
      sway: new THREE.Vector3(),
      swayTarget: new THREE.Vector3(),
    }),
    [],
  )
  const u = useRef(0)

  useFrame(({ camera, clock }, rawDt) => {
    // Cap only long stalls (e.g. returning to a background tab). Slow devices still keep pace,
    // and even a big step stays on the route, so it can't cut through a wall.
    const dt = Math.min(rawDt, 0.25)
    const target = animate ? THREE.MathUtils.clamp(motion.routeTarget, 0, 1) : 0

    if (animate) {
      const step = (target - u.current) * (1 - Math.exp(-dt * 4))
      const maxStep = MAX_SPEED * dt
      u.current += THREE.MathUtils.clamp(step, -maxStep, maxStep)
    } else {
      u.current = 0
    }

    const at = u.current
    motion.routeU = at
    const aheadAt = Math.min(at + LOOK_AHEAD, 1)
    route.getPointAt(at, v.pos)
    route.getPointAt(aheadAt, v.ahead)

    // Near the end, swing the gaze from the corridor onto the end wall and rise slightly.
    const settle = THREE.MathUtils.smoothstep(at, 0.86, 1)
    v.look.copy(v.ahead).setY(EYE_Y + 0.4).lerp(endFocus, settle)
    v.pos.y += settle * 1.2

    if (animate) {
      // 1 on a straight, 0 mid-turn: parallax sway only where there's room for it.
      route.getTangentAt(at, v.tanNow)
      route.getTangentAt(aheadAt, v.tanAhead)
      const straight = THREE.MathUtils.smoothstep(v.tanNow.dot(v.tanAhead), 0.7, 1)

      const t = clock.elapsedTime
      v.right.copy(v.tanNow).setY(0).normalize().cross(camera.up)
      v.swayTarget
        .copy(v.right)
        .multiplyScalar((motion.mx * 0.6 + Math.sin(t * 0.12) * 0.25) * straight)
        .setY(motion.my * 0.3 + Math.sin(t * 0.17) * 0.1)
      v.sway.lerp(v.swayTarget, 1 - Math.exp(-dt * 3))

      v.pos.add(v.sway)
      v.look.addScaledVector(v.sway, 1.2)
    }

    camera.position.copy(v.pos)
    camera.lookAt(v.look)
  })

  return null
}
