import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { site } from '../../config/site'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
import { Environment } from './Environment'
import { CAMERA_START_Z, generateMaze } from './layout'
import { Towers } from './Towers'
import { Traces } from './Traces'

type Props = { mobile: boolean; reducedMotion: boolean; onReady: () => void }

// Fires once a few frames have actually rendered, so the loader hides on a finished image.
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0)
  useFrame(({ invalidate }) => {
    if (frames.current > 3) return
    frames.current++
    if (frames.current === 3) onReady()
    else invalidate()
  })
  return null
}

export default function Scene({ mobile, reducedMotion, onReady }: Props) {
  const panels = useMemo(() => generateMaze(mobile ? 10 : 40), [mobile])
  const animate = !reducedMotion

  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 2]}
      frameloop={animate ? 'always' : 'demand'}
      gl={{ antialias: mobile, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: mobile ? 70 : 55, near: 0.1, far: 220, position: [0, 2.2, CAMERA_START_Z] }}
    >
      <color attach="background" args={[site.colors.bg]} />
      <fog attach="fog" args={[site.colors.bg, 8, 75]} />

      <Environment lite={mobile} animate={animate} />
      <Towers panels={panels} />
      <Traces panels={panels} perPanel={mobile ? 1 : 2} animate={animate} />
      <CameraRig animate={animate} />
      {!mobile && <Effects />}
      <ReadySignal onReady={onReady} />
    </Canvas>
  )
}
