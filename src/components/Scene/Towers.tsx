import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { site } from '../../config/site'
import { createCircuitTexture, type Panel } from './layout'

const EDGES_PER_PANEL = 3
const UP = new THREE.Vector3(0, 1, 0)

// Base transform of a panel: standing on the floor, rotated so local +x faces the corridor.
export function panelFrame(p: Panel, target = new THREE.Matrix4()) {
  const q = new THREE.Quaternion().setFromAxisAngle(UP, p.yaw)
  return target.compose(new THREE.Vector3(p.cx, 0, p.cz), q, new THREE.Vector3(1, 1, 1))
}

// Dark maze walls with a circuit emissive map, plus glowing strips on the corridor-facing edges.
export function Towers({ panels }: { panels: Panel[] }) {
  const bodies = useRef<THREE.InstancedMesh>(null!)
  const edges = useRef<THREE.InstancedMesh>(null!)
  const circuit = useMemo(createCircuitTexture, [])
  const edgeColor = useMemo(() => new THREE.Color(site.colors.red).multiplyScalar(1.25), [])

  useLayoutEffect(() => {
    const frame = new THREE.Matrix4()
    const local = new THREE.Matrix4()
    const noRot = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const scale = new THREE.Vector3()

    panels.forEach((p, i) => {
      panelFrame(p, frame)
      local.compose(pos.set(0, p.h / 2, 0), noRot, scale.set(p.d, p.h, p.w))
      bodies.current.setMatrixAt(i, local.premultiply(frame))

      const fx = p.d / 2 + 0.01
      const strips: [number, number, number, number, number, number][] = [
        [fx, p.h / 2, -p.w / 2, 0.035, p.h, 0.035],
        // Far edge, collapsed to nothing where the next panel's near edge already marks the seam
        [fx, p.h / 2, p.w / 2, 0.035, p.farEdge === false ? 0 : p.h, 0.035],
        [fx, p.h, 0, 0.035, 0.035, p.w],
      ]
      strips.forEach(([x, y, z, sx, sy, sz], j) => {
        local.compose(pos.set(x, y, z), noRot, scale.set(sx, sy, sz))
        edges.current.setMatrixAt(i * EDGES_PER_PANEL + j, local.premultiply(frame))
      })
    })
    bodies.current.instanceMatrix.needsUpdate = true
    edges.current.instanceMatrix.needsUpdate = true
  }, [panels])

  return (
    <>
      <instancedMesh ref={bodies} args={[undefined, undefined, panels.length]}>
        <boxGeometry />
        <meshStandardMaterial
          color="#0c0609"
          metalness={0.75}
          roughness={0.4}
          emissive={site.colors.red}
          emissiveMap={circuit}
          emissiveIntensity={0.55}
        />
      </instancedMesh>
      <instancedMesh ref={edges} args={[undefined, undefined, panels.length * EDGES_PER_PANEL]}>
        <boxGeometry />
        <meshBasicMaterial color={edgeColor} toneMapped={false} />
      </instancedMesh>
    </>
  )
}
