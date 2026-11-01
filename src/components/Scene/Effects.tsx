import { Bloom, EffectComposer, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

// Soft bloom and light film grain. No vignette: the screen edges stay clear.
// Multisampling smooths the thin glowing strips; without it their slanted edges render as pixel
// steps that crawl in a zig-zag while the camera sways.
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={0.35} luminanceSmoothing={0.3} intensity={0.5} radius={0.55} />
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.18} />
    </EffectComposer>
  )
}
