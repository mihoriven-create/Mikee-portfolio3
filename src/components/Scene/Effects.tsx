import { Bloom, EffectComposer, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

// Soft bloom and light film grain. No vignette: the screen edges stay clear.
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={0.35} luminanceSmoothing={0.3} intensity={0.5} radius={0.55} />
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.18} />
    </EffectComposer>
  )
}
