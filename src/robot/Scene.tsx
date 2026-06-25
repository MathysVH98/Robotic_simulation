// The 3D viewport: studio-style lighting, a shop-floor grid, contact shadows and
// orbit controls wrapped around the Kawasaki arm.

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import {
  OrbitControls,
  Grid,
  ContactShadows,
  GizmoHelper,
  GizmoViewport,
} from '@react-three/drei'
import { RobotArm } from './RobotArm'
import { BxPartsGrid, BxStack, BxWristParts } from './bxMeshes'

const SHOW_PARTS = typeof window !== 'undefined' && window.location.search.includes('parts')
const SHOW_STACK = typeof window !== 'undefined' && window.location.search.includes('stack')
const SHOW_WRIST = typeof window !== 'undefined' && window.location.search.includes('wrist')
const VIEW = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null
const PARTS_CAM: [number, number, number] =
  VIEW === 'side' ? [8, 0.4, 0] : VIEW === 'top' ? [0, 8, 0.01] : [0, 0.4, 8]
const ROBOT_CAM: [number, number, number] =
  VIEW === 'front'
    ? [0, 1.3, 6.5]
    : VIEW === 'side'
      ? [6.5, 1.3, 0]
      : VIEW === 'top'
        ? [0, 6.5, 0.01]
        : [4.0, 2.4, 4.6]

export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: SHOW_WRIST
          ? VIEW === 'side'
            ? [1.5, 0, 0]
            : VIEW === 'top'
              ? [0, 1.5, 0.01]
              : [0, 0, 1.5]
          : SHOW_PARTS
            ? PARTS_CAM
            : SHOW_STACK
              ? [4.2, 2.2, 4.6]
              : ROBOT_CAM,
        fov: 42,
      }}
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

      <Suspense fallback={null}>
        {SHOW_WRIST ? (
          <BxWristParts />
        ) : SHOW_STACK ? (
          <BxStack />
        ) : SHOW_PARTS ? (
          <BxPartsGrid />
        ) : (
          <RobotArm />
        )}
      </Suspense>

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
        minDistance={1.8}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2.05}
        target={SHOW_WRIST ? [0, 0, 0] : SHOW_PARTS ? [0, 0.4, 0] : [0, 1.25, 0]}
        makeDefault
      />

      <GizmoHelper alignment="bottom-right" margin={[60, 70]}>
        <GizmoViewport axisColors={['#ff5b6e', '#7dd35f', '#3f8cff']} labelColor="#0a0e14" />
      </GizmoHelper>
    </Canvas>
  )
}
