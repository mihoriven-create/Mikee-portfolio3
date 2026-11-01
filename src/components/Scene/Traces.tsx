import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { site } from '../../config/site'
import { mulberry32, type Panel } from './layout'
import { panelFrame } from './Towers'

type Pulse = {
  frame: THREE.Matrix4
  quat: THREE.Quaternion
  vertical: boolean
  x: number // local, on the corridor-facing face
  y: number
  z: number
  span: number // distance travelled before wrapping
  len: number
  speed: number
  offset: number
}

// Short bright light packets running up and along the corridor-facing walls.
export function Traces({ panels, perPanel, animate }: { panels: Panel[]; perPanel: number; animate: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const color = useMemo(() => new THREE.Color(site.colors.orange).multiplyScalar(1.2), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const pulses = useMemo(() => {
    const rand = mulberry32(23)
    const list: Pulse[] = []
    for (const p of panels) {
      if (!p.inner) continue
      const frame = panelFrame(p)
      const quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.yaw)
      for (let k = 0; k < perPanel; k++) {
        const vertical = rand() < 0.65
        list.push({
          frame,
          quat,
          vertical,
          x: p.d / 2 + 0.02,
          y: vertical ? 0 : 0.4 + rand() * (p.h - 0.8),
          z: vertical ? (rand() - 0.5) * p.w * 0.85 : -p.w / 2,
          span: vertical ? p.h : p.w,
          len: vertical ? 0.4 + rand() * 1.1 : 0.2 + rand() * 0.5,
          speed: 0.6 + rand() * 2.2,
          offset: rand() * 10,
        })
      }
    }
    return list
  }, [panels, perPanel])

  const place = (time: number) => {
    pulses.forEach((p, i) => {
      // The packet's head runs from the panel's start edge to past its end edge; clip it to the
      // panel so it never pokes beyond the box onto the floor, the sky, or a neighbouring panel.
      const head = (p.offset + time * p.speed) % (p.span + p.len)
      const from = Math.max(0, head - p.len)
      const to = Math.min(p.span, head)
      const visible = Math.max(to - from, 0.0001)
      const mid = (from + to) / 2
      if (p.vertical) {
        dummy.position.set(p.x, mid, p.z)
        dummy.scale.set(0.025, visible, 0.025)
      } else {
        dummy.position.set(p.x, p.y, p.z + mid)
        dummy.scale.set(0.025, 0.025, visible)
      }
      dummy.position.applyMatrix4(p.frame)
      dummy.quaternion.copy(p.quat)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => place(0), [pulses]) // eslint-disable-line react-hooks/exhaustive-deps
  useFrame(({ clock }) => {
    if (animate) place(clock.elapsedTime)
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pulses.length]} frustumCulled={false}>
      <boxGeometry />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  )
}
