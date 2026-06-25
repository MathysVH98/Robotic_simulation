// Kawasaki BX200L — assembled from the genuine CAD meshes (binary STL) using the
// standard Kawasaki 6R kinematic convention (matching the published khi_robot
// URDF structure). Link lengths are calibrated to the BX200L meshes.
//
// The chain is built in the URDF Z-up frame and the whole robot is tipped to the
// scene's Y-up frame at the root. Each joint group rotates about its local Z.

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRobotStore } from '../store/useRobotStore'
import { useBxGeometries, MM } from './bxMeshes'

const D2R = Math.PI / 180
const H = Math.PI / 2

// --- BX200L link lengths [m] (calibrated to the CAD meshes) -----------------
const L = {
  j0: 0.49, // base → JT2 (vertical)
  j1: 0.2, // JT1 → JT2 lateral offset
  j2: 1.3, // lower arm  JT2 → JT3
  j3: 0.3, // JT3 → JT4
  j4: 0.55, // upper arm  JT4 → JT5 (forearm, along -Y in CAD frame)
  j5: 0.24, // wrist JT5 → JT6
}

// BX200L livery (per the reference photo): white body, black upper arm + wrist.
const WHITE = '#edeff1' // base, turret, lower arm
const BLACK = '#1e2024' // upper arm, forearm, wrist housings
const FLANGE = '#c7ccd1' // tool flange

// Rendered rest-posture offset (deg) so HOME (0,0,0,0,0,0) shows a natural
// upright industrial stance instead of the CAD's folded mechanical zero.
const REST = [0, -20, 55, 0, 35, 0]

const DEBUG = typeof window !== 'undefined' && window.location.search.includes('debug')
const DBG = ['#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0', '#b5179e', '#fb8500', '#ffffff']

// URL-tunable JT6 transform for calibration: ?j6x=&j6y=&j6z=&j6ry=&j6rz=
const Q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
const qn = (k: string, d: number) => (Q.has(k) ? Number(Q.get(k)) : d)
const J6_OFF: [number, number, number] = [qn('j6x', 0), qn('j6y', 0), qn('j6z', -0.12)]
const J6_ROT: [number, number, number] = [qn('j6rx', 0), qn('j6ry', Math.PI / 2), qn('j6rz', 0)]

function Link({
  geom,
  idx,
  color = WHITE,
  rotation,
  position,
}: {
  geom: THREE.BufferGeometry
  idx: number
  color?: string
  rotation?: [number, number, number]
  position?: [number, number, number]
}) {
  return (
    <mesh
      geometry={geom}
      scale={MM}
      rotation={rotation}
      position={position}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={DEBUG ? DBG[idx] : color}
        metalness={0.25}
        roughness={0.55}
      />
    </mesh>
  )
}

export function RobotArm() {
  const g = useBxGeometries()
  const j1 = useRef<THREE.Group>(null)
  const j2 = useRef<THREE.Group>(null)
  const j3 = useRef<THREE.Group>(null)
  const j4 = useRef<THREE.Group>(null)
  const j5 = useRef<THREE.Group>(null)
  const j6 = useRef<THREE.Group>(null)
  const engine = useRobotStore((s) => s.engine)

  // Optional pose override for screenshots/hero shots: ?pose=j1,j2,j3,j4,j5,j6
  useEffect(() => {
    const p = Q.get('pose')
    if (p) {
      const v = p.split(',').map(Number)
      if (v.length === 6 && v.every((n) => Number.isFinite(n))) {
        engine.pose = v as unknown as typeof engine.pose
      }
    }
  }, [engine])

  useFrame(() => {
    const p = engine.pose
    // The CAD mechanical zero is a folded calibration pose. Anchor the displayed
    // HOME (all joints 0) to a natural industrial "ready" stance — lower arm
    // slightly back, upper arm raised, wrist level — matching how a real robot
    // rests. Joint read-outs stay honest (0 at HOME); only the rendered rest
    // posture is offset.
    const rp = [
      p[0] + REST[0],
      p[1] + REST[1],
      p[2] + REST[2],
      p[3] + REST[3],
      p[4] + REST[4],
      p[5] + REST[5],
    ]
    // URDF axis signs: j1 -Z, j2 +Z, j3 -Z, j4 +Z, j5 -Z, j6 +Z
    if (j1.current) j1.current.rotation.z = -rp[0] * D2R
    if (j2.current) j2.current.rotation.z = rp[1] * D2R
    if (j3.current) j3.current.rotation.z = -rp[2] * D2R
    if (j4.current) j4.current.rotation.z = rp[3] * D2R
    if (j5.current) j5.current.rotation.z = -rp[4] * D2R
    if (j6.current) j6.current.rotation.z = rp[5] * D2R
  })

  return (
    <group rotation={[-H, 0, 0]}>
      {/* base_link */}
      <Link geom={g[0]} idx={0} color={WHITE} />

      {/* JT1 */}
      <group position={[0, 0, L.j0]}>
        <group ref={j1}>
          {DEBUG && <axesHelper args={[0.4]} />}
          <Link geom={g[1]} idx={1} color={WHITE} />

          {/* JT2 */}
          <group position={[0, L.j1, 0]} rotation={[0, -H, 0]}>
            <group ref={j2}>
              <Link geom={g[2]} idx={2} color={WHITE} rotation={[0, H, 0]} />

              {/* JT3 */}
              <group position={[L.j2, 0, 0]}>
                <group ref={j3}>
                  <Link geom={g[3]} idx={3} color={WHITE} rotation={[0, H, 0]} />

                  {/* JT4 */}
                  <group position={[L.j3, 0, 0]} rotation={[0, H, 0]}>
                    <group ref={j4}>
                      {DEBUG && <axesHelper args={[0.4]} />}
                      <Link geom={g[4]} idx={4} color={BLACK} />

                      {/* JT5 */}
                      <group position={[0, -L.j4, 0]} rotation={[0, -H, 0]}>
                        <group ref={j5}>
                          {DEBUG && <axesHelper args={[0.4]} />}
                          <Link geom={g[5]} idx={5} color={WHITE} rotation={[0, H, 0]} />

                          {/* JT6 */}
                          <group position={J6_OFF} rotation={J6_ROT}>
                            <group ref={j6}>
                              {DEBUG && <axesHelper args={[0.4]} />}
                              <Link geom={g[6]} idx={6} color={FLANGE} />
                            </group>
                          </group>
                        </group>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
