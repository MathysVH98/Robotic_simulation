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
import { useCalib } from '../store/useCalib'
import { useBxGeometries, MM } from './bxMeshes'
import { Tool } from './tools'

const D2R = Math.PI / 180
const H = Math.PI / 2

// --- BX200L link lengths [m] for the lower arm (fixed) ----------------------
// The wrist (JT4–JT6) offsets/rotations/axes come from the calibration store so
// they can be positioned by hand (CalibPanel, ?calib).
const L = {
  j0: 0.49, // base → JT2 (vertical)
  j1: 0.2, // JT1 → JT2 lateral offset
  j2: 1.3, // lower arm  JT2 → JT3 (elbow)
}

// BX200L livery (per the reference photo): white body, black upper arm + wrist.
const WHITE = '#edeff1' // base, turret, lower arm
const BLACK = '#1e2024' // upper arm, forearm, wrist housings
const FLANGE = '#c7ccd1' // tool flange

// Where the end-of-arm tool bolts onto the flange (tuned to the flange face).
const TOOL_MOUNT = { off: [0, 0, 0] as [number, number, number], rot: [0, 0, 0] as [number, number, number] }

const DEBUG = typeof window !== 'undefined' && window.location.search.includes('debug')
const DBG = ['#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0', '#b5179e', '#fb8500', '#ffffff']

const Q =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()

/** Rotate a joint group about a single local axis (deg), zeroing the others. */
function setAxis(grp: THREE.Group | null, axis: 'x' | 'y' | 'z', deg: number) {
  if (!grp) return
  grp.rotation.set(0, 0, 0)
  grp.rotation[axis] = deg * D2R
}

const degRot = (r: [number, number, number]): [number, number, number] => [
  r[0] * D2R,
  r[1] * D2R,
  r[2] * D2R,
]

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
  const c4 = useCalib((s) => s.j4)
  const c5 = useCalib((s) => s.j5)
  const c6 = useCalib((s) => s.j6)
  const REST = useCalib((s) => s.rest)

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
    // HOME (all joints 0) is anchored to a natural upright "ready" stance via
    // REST; joint read-outs stay honest (0 at HOME).
    const rp = p.map((v, i) => v + REST[i])
    // Base + shoulder + elbow hinge about the frame Z.
    if (j1.current) j1.current.rotation.z = -rp[0] * D2R
    if (j2.current) j2.current.rotation.z = rp[1] * D2R
    if (j3.current) j3.current.rotation.z = -rp[2] * D2R
    // In-line wrist — each joint rotates about its configured axis.
    setAxis(j4.current, c4.axis, c4.sign * rp[3])
    setAxis(j5.current, c5.axis, c5.sign * rp[4])
    setAxis(j6.current, c6.axis, c6.sign * rp[5])
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
                  <Link geom={g[3]} idx={3} color={BLACK} rotation={[0, H, 0]} />

                  {/* JT4 — forearm roll (calibratable) */}
                  <group position={c4.off}>
                    <group ref={j4}>
                      {DEBUG && <axesHelper args={[0.4]} />}
                      <Link geom={g[4]} idx={4} color={BLACK} rotation={degRot(c4.rot)} />

                      {/* JT5 — wrist bend (calibratable) */}
                      <group position={c5.off}>
                        <group ref={j5}>
                          {DEBUG && <axesHelper args={[0.4]} />}
                          <Link geom={g[5]} idx={5} color={WHITE} rotation={degRot(c5.rot)} />

                          {/* JT6 — tool twist (calibratable) */}
                          <group position={c6.off}>
                            <group ref={j6}>
                              {DEBUG && <axesHelper args={[0.4]} />}
                              <Link geom={g[6]} idx={6} color={FLANGE} rotation={degRot(c6.rot)} />
                              {/* End-of-arm tool mounted on the flange */}
                              <group position={TOOL_MOUNT.off} rotation={degRot(TOOL_MOUNT.rot)}>
                                <Tool />
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
    </group>
  )
}
