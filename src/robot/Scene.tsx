// The 3D viewport: studio-style lighting, a shop-floor grid, contact shadows and
// orbit controls wrapped around the Kawasaki arm.

import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Grid,
  ContactShadows,
  GizmoHelper,
  GizmoViewport,
} from '@react-three/drei'
import { KawasakiArm } from './KawasakiArm'

export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [3.2, 2.6, 3.6], fov: 42 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#0a0e14']} />
      <fog attach="fog" args={['#0a0e14', 9, 22]} />

      {/* Key + fill + rim lighting */}
      <hemisphereLight intensity={0.45} color="#cfe0ff" groundColor="#0a0e14" />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.1, 30]} />
      </directionalLight>
      <directionalLight position={[-5, 4, -3]} intensity={0.6} color="#4a78ff" />
      {/* Self-contained fill lights so the cell renders fully offline (no HDR fetch) */}
      <pointLight position={[0, 3.5, 2]} intensity={18} distance={14} color="#cfe0ff" />
      <pointLight position={[3, 1.5, -2]} intensity={10} distance={12} color="#ffd9a8" />
      <spotLight position={[-2, 6, 3]} angle={0.6} penumbra={0.8} intensity={12} color="#ffffff" />

      <KawasakiArm />

      {/* Shop floor */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.55}
        scale={14}
        blur={2.2}
        far={6}
        color="#000000"
      />
      <Grid
        position={[0, 0, 0]}
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#1b2536"
        sectionSize={2.5}
        sectionThickness={1.1}
        sectionColor="#2f73ff"
        fadeDistance={26}
        fadeStrength={1.4}
        infiniteGrid
      />

      <OrbitControls
        enablePan
        minDistance={1.6}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1.0, 0]}
        makeDefault
      />

      <GizmoHelper alignment="bottom-right" margin={[60, 70]}>
        <GizmoViewport axisColors={['#ff5b6e', '#7dd35f', '#3f8cff']} labelColor="#0a0e14" />
      </GizmoHelper>
    </Canvas>
  )
}
