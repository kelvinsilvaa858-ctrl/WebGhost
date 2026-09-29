import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Beacon } from './Beacon'
import { CAM_Z, FOV } from './poses'
import { rig } from '../../lib/rig'
import { markLoaded } from '../../lib/load'
import { hasWebGL, isLowPower } from '../../lib/device'

/**
 * Canvas único e fixo atrás da página (opaco, #050505).
 * O brilho vem de bloom real sobre a peça emissiva, não de sombras em CSS.
 */
export default function Scene({ mobile }: { mobile: boolean }) {
  const [ok] = useState(() => hasWebGL())
  const low = mobile || isLowPower()
  const [dpr, setDpr] = useState<number>(low ? 1.25 : 1.6)

  useEffect(() => {
    if (!ok) markLoaded('scene')
    const onMove = (e: PointerEvent) => {
      rig.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      rig.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [ok])

  if (!ok) return null

  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        dpr={dpr}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.05, far: 40 }}
        onCreated={() => requestAnimationFrame(() => markLoaded('scene'))}
      >
        <color attach="background" args={['#050505']} />
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <ambientLight intensity={0.03} />
        <Beacon mobile={mobile} />
        <EffectComposer multisampling={low ? 0 : 4}>
          <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.15} intensity={low ? 0.55 : 0.7} radius={0.62} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
