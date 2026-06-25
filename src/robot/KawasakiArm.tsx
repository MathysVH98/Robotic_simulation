// Procedurally-modelled 6-axis Kawasaki-style industrial arm (RS-series proportions).
//
// The kinematic chain is expressed as nested groups; each joint group is rotated
// every frame from the live SimEngine pose. Because the geometry is parametric we
// can later swap in a GLTF mesh per joint without changing the control code.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useRobotStore } from '../store/useRobotStore'

const D2R = Math.PI / 180

// Kawasaki-inspired palette: warm light-grey castings, charcoal joint housings,
// and a signature accent.
const BODY = '#e7e9ee'
const BODY_DARK = '#c2c7d0'
const JOINT = '#2b2f3a'
const ACCENT = '#1763d1'
const STEEL = '#9aa1ad'

function Casting(props: React.ComponentProps<typeof RoundedBox> & { color?: string }) {
  const { color = BODY, ...rest } = props
  return (
    <RoundedBox radius={0.03} smoothness={4} {...rest}>
      <meshStandardMaterial color={color} metalness={0.35} roughness={0.45} />
    </RoundedBox>
  )
}

function JointHousing({ radius = 0.16, length = 0.34 }: { radius?: number; length?: number }) {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[radius, radius, length, 32]} />
      <meshStandardMaterial color={JOINT} metalness={0.6} roughness={0.35} />
    </mesh>
  )
}

export function KawasakiArm() {
  const j1 = useRef<THREE.Group>(null)
  const j2 = useRef<THREE.Group>(null)
  const j3 = useRef<THREE.Group>(null)
  const j4 = useRef<THREE.Group>(null)
  const j5 = useRef<THREE.Group>(null)
  const j6 = useRef<THREE.Group>(null)
  const fingerL = useRef<THREE.Mesh>(null)
  const fingerR = useRef<THREE.Mesh>(null)

  const engine = useRobotStore((s) => s.engine)

  useFrame(() => {
    const p = engine.pose
    if (j1.current) j1.current.rotation.y = p[0] * D2R
    if (j2.current) j2.current.rotation.x = -p[1] * D2R
    if (j3.current) j3.current.rotation.x = -p[2] * D2R
    if (j4.current) j4.current.rotation.y = p[3] * D2R
    if (j5.current) j5.current.rotation.x = -p[4] * D2R
    if (j6.current) j6.current.rotation.y = p[5] * D2R
    // Gripper: 0 (closed) .. 1 (open) → finger separation
    const open = 0.02 + engine.grip * 0.07
    if (fingerL.current) fingerL.current.position.x = -open
    if (fingerR.current) fingerR.current.position.x = open
  })

  return (
    <group>
      {/* Fixed base pedestal */}
      <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.12, 48]} />
        <meshStandardMaterial color={JOINT} metalness={0.5} roughness={0.4} />
      </mesh>
      <Casting args={[0.7, 0.06, 0.7]} position={[0, 0.03, 0]} color={BODY_DARK} castShadow />

      {/* ---- JT1: base swivel (about Y) ---- */}
      <group ref={j1} position={[0, 0.12, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.4, 0.3, 40]} />
          <meshStandardMaterial color={BODY} metalness={0.35} roughness={0.45} />
        </mesh>
        {/* accent ring */}
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.41, 0.41, 0.04, 40]} />
          <meshStandardMaterial color={ACCENT} metalness={0.4} roughness={0.4} />
        </mesh>

        {/* Shoulder yoke rising from the turret */}
        <Casting args={[0.5, 0.34, 0.34]} position={[0, 0.46, 0]} castShadow />

        {/* ---- JT2: shoulder (pitch about X) ---- */}
        <group ref={j2} position={[0, 0.58, 0]}>
          <JointHousing radius={0.17} length={0.5} />
          {/* Upper arm reaching up toward the elbow */}
          <Casting args={[0.26, 1.1, 0.26]} position={[0, 0.58, 0]} castShadow />
          <mesh position={[0.16, 0.58, 0]} castShadow>
            <boxGeometry args={[0.05, 1.0, 0.18]} />
            <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.3} />
          </mesh>

          {/* ---- JT3: elbow (pitch about X) ---- */}
          <group ref={j3} position={[0, 1.15, 0]}>
            <JointHousing radius={0.15} length={0.42} />
            {/* Forearm extending forward (+Z) to the wrist */}
            <Casting args={[0.2, 0.2, 0.95]} position={[0, 0.0, 0.5]} castShadow />

            {/* ---- JT4: forearm roll (about Z → modelled on Y of inner group) ---- */}
            <group ref={j4} position={[0, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.13, 0.13, 0.3, 28]} />
                <meshStandardMaterial color={BODY} metalness={0.4} roughness={0.4} />
              </mesh>

              {/* ---- JT5: wrist bend (about X) ---- */}
              <group ref={j5} position={[0, -0.18, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.12, 0.12, 0.26, 28]} />
                  <meshStandardMaterial color={JOINT} metalness={0.6} roughness={0.35} />
                </mesh>

                {/* ---- JT6: flange roll (about wrist axis) ---- */}
                <group ref={j6} position={[0, -0.16, 0]}>
                  <mesh castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 0.08, 28]} />
                    <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.25} />
                  </mesh>

                  {/* Two-finger end-effector */}
                  <group position={[0, -0.12, 0]}>
                    <Casting args={[0.22, 0.08, 0.14]} position={[0, 0.02, 0]} color={JOINT} />
                    <mesh ref={fingerL} position={[-0.05, -0.12, 0]} castShadow>
                      <boxGeometry args={[0.04, 0.2, 0.1]} />
                      <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.25} />
                    </mesh>
                    <mesh ref={fingerR} position={[0.05, -0.12, 0]} castShadow>
                      <boxGeometry args={[0.04, 0.2, 0.1]} />
                      <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.25} />
                    </mesh>
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
