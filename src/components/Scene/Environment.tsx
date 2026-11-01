import { useMemo } from 'react'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { site } from '../../config/site'
import { CAMERA_ROUTE, MAZE_BOUNDS, END_FOCUS, createHorizonTexture, railSegments, routeSegments } from './layout'

const { minX, maxX, minZ, maxZ } = MAZE_BOUNDS
const CENTER_X = (minX + maxX) / 2
const CENTER_Z = (minZ + maxZ) / 2
const FLOOR_SIZE = Math.max(maxX - minX, maxZ - minZ) + 60

// Floor grid, glowing guide rails through the maze, lights, horizon glow and drifting embers.
export function Environment({ lite, animate }: { lite: boolean; animate: boolean }) {
  const horizon = useMemo(createHorizonTexture, [])
  const railColor = useMemo(() => new THREE.Color(site.colors.red).multiplyScalar(1.3), [])
  const horizonTint = useMemo(() => new THREE.Color(1.3, 1.3, 1.3), [])

  const rails = useMemo(
    () =>
      [...railSegments(2.2), ...railSegments(-2.2)].map(({ a, b }) => {
        const dx = b[0] - a[0]
        const dz = b[1] - a[1]
        return { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, len: Math.hypot(dx, dz), yaw: Math.atan2(dx, dz) }
      }),
    [],
  )

  // A light at every corner, plus mid-corridor on desktop
  const lights = useMemo(() => {
    const pts = CAMERA_ROUTE.slice(1, -1).map(([x, z]) => [x, z] as const)
    if (!lite) routeSegments(CAMERA_ROUTE).forEach(({ a, b }) => pts.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]))
    return pts
  }, [lite])

  return (
    <>
      <ambientLight intensity={0.12} />
      {lights.map(([x, z], i) => (
        <pointLight
          key={i}
          color={i % 2 ? site.colors.orange : site.colors.red}
          intensity={22}
          distance={20}
          decay={2}
          position={[x, 6, z]}
        />
      ))}

      <mesh rotation-x={-Math.PI / 2} position={[CENTER_X, 0, CENTER_Z]}>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial color="#050205" metalness={0.9} roughness={0.35} />
      </mesh>
      <gridHelper args={[FLOOR_SIZE, FLOOR_SIZE / 2, site.colors.deep, '#2a0607']} position={[CENTER_X, 0.01, CENTER_Z]} />

      {rails.map((r, i) => (
        <mesh key={i} position={[r.x, 0.02, r.z]} rotation-y={r.yaw}>
          <boxGeometry args={[0.03, 0.01, r.len]} />
          <meshBasicMaterial color={railColor} toneMapped={false} />
        </mesh>
      ))}

      <mesh position={[END_FOCUS[0], 16, END_FOCUS[2] - 40]}>
        <planeGeometry args={[170, 50]} />
        <meshBasicMaterial
          map={horizon}
          color={horizonTint}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <Sparkles
        count={lite ? 50 : 160}
        scale={[maxX - minX, 10, maxZ - minZ]}
        position={[CENTER_X, 5, CENTER_Z]}
        size={2.5}
        speed={animate ? 0.35 : 0}
        color={site.colors.orange}
        opacity={0.45}
      />
    </>
  )
}
