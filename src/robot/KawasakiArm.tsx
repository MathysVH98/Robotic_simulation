// Kawasaki BX200L — body-shop spot-welding robot (200 kg payload, long reach).
//
// Modelled from the published BX200L spec: tall vertical lower arm, long
// horizontal hollow upper arm, JT2 counterweight housing, side-mounted axis
// motors, hollow wrist and a C-type spot-welding gun on the flange. The kinematic
// chain is parametric, so a different Kawasaki model can later be dropped in by
// changing the link lengths / castings without touching the control code.
//
// Zero pose = the Kawasaki calibration stance: lower arm vertical, upper arm
// horizontal — the classic "L" reach silhouette.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useRobotStore } from '../store/useRobotStore'

const D2R = Math.PI / 180

// --- Kawasaki "Standard" palette -------------------------------------------
const SILVER = '#cfd3d7' // main castings (Kawasaki light silver-grey)
const SILVER_DK = '#aeb4ba' // shaded castings
const HOUSING = '#71777e' // motor / joint housings
const CHARCOAL = '#33373d' // base, counterweight, dark covers
const BLACK = '#191b1f' // cable, rubber, gun body
const COPPER = '#c07a45' // weld-gun electrodes
const KAWA_RED = '#d8202a' // river-mark accent

// --- link geometry (scene units; ~1 unit ≈ 1.3 m of the real 3.4 m robot) ---
const BASE_H = 0.32
const SHOULDER_Y = 0.62 // JT2 axis height above the turret top
const LOWER_LEN = 1.12 // JT2 → JT3
const UPPER_LEN = 1.42 // JT3 → wrist (long "L" reach)

function Std({ color = SILVER, metalness = 0.55, roughness = 0.42 }) {
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
}

/** A tapered, slab-like casting built from a 4-sided prism (clean robot-arm look). */
function TaperedLink({
  bottom,
  top,
  length,
  flatten = 0.7,
  color = SILVER,
}: {
  bottom: number
  top: number
  length: number
  flatten?: number
  color?: string
}) {
  // Cylinder with 4 radial segments → square tapered prism; rotate 45° to face front.
  return (
    <mesh
      position={[0, length / 2, 0]}
      rotation={[0, Math.PI / 4, 0]}
      scale={[1, 1, flatten]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[top, bottom, length, 4]} />
      <Std color={color} />
    </mesh>
  )
}

/** Cylindrical joint housing lying along the X axis. */
function AxisHub({ r, len, color = HOUSING }: { r: number; len: number; color?: string }) {
  return (
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[r, r, len, 32]} />
      <Std color={color} metalness={0.62} roughness={0.36} />
    </mesh>
  )
}

/** Side-mounted servo motor housing (the bulged cylinders + end cap on Kawasaki arms). */
function Motor({ x, r = 0.13, len = 0.26 }: { x: number; r?: number; len?: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, len, 28]} />
        <Std color={HOUSING} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[Math.sign(x) * (len / 2 + 0.01), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r * 0.6, r * 0.6, 0.04, 20]} />
        <Std color={CHARCOAL} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

export function KawasakiArm() {
  const j1 = useRef<THREE.Group>(null)
  const j2 = useRef<THREE.Group>(null)
  const j3 = useRef<THREE.Group>(null)
  const j4 = useRef<THREE.Group>(null)
  const j5 = useRef<THREE.Group>(null)
  const j6 = useRef<THREE.Group>(null)
  const electrode = useRef<THREE.Group>(null) // movable upper electrode

  const engine = useRobotStore((s) => s.engine)

  useFrame(() => {
    const p = engine.pose
    if (j1.current) j1.current.rotation.y = p[0] * D2R
    if (j2.current) j2.current.rotation.x = -p[1] * D2R
    if (j3.current) j3.current.rotation.x = -p[2] * D2R
    if (j4.current) j4.current.rotation.z = p[3] * D2R
    if (j5.current) j5.current.rotation.x = -p[4] * D2R
    if (j6.current) j6.current.rotation.z = p[5] * D2R
    // Spot-gun electrode: grip 1 = open, 0 = closed (welding).
    if (electrode.current) electrode.current.position.y = 0.16 + engine.grip * 0.12
  })

  return (
    <group position={[0, 0, 0]}>
      {/* ================= BASE ================= */}
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.0, 0.06, 1.0]} />
        <Std color={CHARCOAL} metalness={0.45} roughness={0.55} />
      </mesh>
      <mesh position={[0, BASE_H / 2 + 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.52, BASE_H, 40]} />
        <Std color={CHARCOAL} metalness={0.5} roughness={0.45} />
      </mesh>
      {/* yellow safety ring */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.53, 0.53, 0.02, 40]} />
        <meshStandardMaterial color="#e8b53a" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* ================= JT1 — base swivel (Y) ================= */}
      <group ref={j1} position={[0, BASE_H + 0.06, 0]}>
        {/* rotating turret */}
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.36, 0.42, 0.32, 40]} />
          <Std color={SILVER} />
        </mesh>
        {/* red Kawasaki accent band */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.425, 0.425, 0.05, 40]} />
          <Std color={KAWA_RED} metalness={0.35} roughness={0.45} />
        </mesh>

        {/* shoulder yoke: two bearing ears that carry the JT2 axis */}
        <group position={[0, SHOULDER_Y, 0]}>
          <mesh position={[0.28, -0.12, 0]} castShadow>
            <boxGeometry args={[0.16, 0.42, 0.4]} />
            <Std color={SILVER_DK} />
          </mesh>
          <mesh position={[-0.28, -0.12, 0]} castShadow>
            <boxGeometry args={[0.16, 0.42, 0.4]} />
            <Std color={SILVER_DK} />
          </mesh>

          {/* ============== JT2 — lower arm pitch (X) ============== */}
          <group ref={j2}>
            <AxisHub r={0.2} len={0.62} />
            <Motor x={0.4} r={0.15} len={0.22} />

            {/* signature JT2 counterweight / drive housing behind the arm */}
            <RoundedBox
              position={[0, -0.04, -0.34]}
              args={[0.5, 0.46, 0.36]}
              radius={0.06}
              smoothness={4}
              castShadow
            >
              <Std color={CHARCOAL} metalness={0.5} roughness={0.45} />
            </RoundedBox>

            {/* tall tapering lower arm rising to the elbow */}
            <TaperedLink bottom={0.46} top={0.3} length={LOWER_LEN} flatten={0.62} />

            {/* ============== JT3 — upper arm pitch (X) ============== */}
            <group ref={j3} position={[0, LOWER_LEN, 0]}>
              <AxisHub r={0.18} len={0.5} />
              <Motor x={0.32} r={0.13} len={0.2} />

              {/* JT4 twist axis runs along the (horizontal) upper arm */}
              <group ref={j4}>
                {/* hollow upper-arm boom, extending forward (+Z).
                    The 4-sided prism is built along Y then laid down along +Z. */}
                <mesh
                  position={[0, 0, UPPER_LEN / 2]}
                  rotation={[Math.PI / 2, Math.PI / 4, 0]}
                  scale={[1, 1, 0.74]}
                  castShadow
                  receiveShadow
                >
                  <cylinderGeometry args={[0.16, 0.26, UPPER_LEN, 4]} />
                  <Std color={SILVER} />
                </mesh>

                {/* hollow-wrist cable conduit running along the top of the boom */}
                <mesh
                  position={[0, 0.18, UPPER_LEN * 0.5]}
                  rotation={[Math.PI / 2, 0, 0]}
                  castShadow
                >
                  <cylinderGeometry args={[0.05, 0.05, UPPER_LEN * 0.8, 16]} />
                  <Std color={BLACK} metalness={0.2} roughness={0.7} />
                </mesh>
                {/* red river-mark accent on the upper arm */}
                <mesh position={[0.15, 0.04, UPPER_LEN * 0.34]}>
                  <boxGeometry args={[0.012, 0.1, 0.22]} />
                  <Std color={KAWA_RED} metalness={0.3} roughness={0.5} />
                </mesh>

                {/* ============== JT5 — wrist bend (X) ============== */}
                <group ref={j5} position={[0, 0, UPPER_LEN]}>
                  <AxisHub r={0.13} len={0.3} color={SILVER_DK} />

                  {/* ============== JT6 — flange roll (Z) ============== */}
                  <group ref={j6} position={[0, 0, 0.14]}>
                    {/* hollow wrist tube + tool flange */}
                    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                      <cylinderGeometry args={[0.11, 0.12, 0.16, 28]} />
                      <Std color={SILVER} />
                    </mesh>
                    <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                      <cylinderGeometry args={[0.105, 0.105, 0.04, 28]} />
                      <Std color={HOUSING} metalness={0.7} roughness={0.3} />
                    </mesh>

                    {/* ===== C-type spot-welding gun (end effector) ===== */}
                    <group position={[0, 0, 0.16]}>
                      {/* transformer body */}
                      <RoundedBox
                        position={[0, -0.12, 0.04]}
                        args={[0.26, 0.22, 0.2]}
                        radius={0.03}
                        smoothness={3}
                        castShadow
                      >
                        <Std color={BLACK} metalness={0.3} roughness={0.6} />
                      </RoundedBox>
                      <mesh position={[0.1, -0.12, 0.04]} castShadow>
                        <boxGeometry args={[0.04, 0.16, 0.14]} />
                        <Std color={KAWA_RED} metalness={0.3} roughness={0.5} />
                      </mesh>

                      {/* fixed lower electrode arm (the "C") */}
                      <mesh position={[0, -0.24, 0.16]} castShadow>
                        <boxGeometry args={[0.05, 0.05, 0.3]} />
                        <Std color={HOUSING} metalness={0.6} roughness={0.4} />
                      </mesh>
                      <mesh position={[0, -0.18, 0.3]} castShadow>
                        <cylinderGeometry args={[0.022, 0.03, 0.16, 20]} />
                        <Std color={COPPER} metalness={0.85} roughness={0.25} />
                      </mesh>

                      {/* movable upper electrode (animated by GRIP) */}
                      <group ref={electrode} position={[0, 0.16, 0.3]}>
                        <mesh castShadow>
                          <cylinderGeometry args={[0.03, 0.022, 0.16, 20]} />
                          <Std color={COPPER} metalness={0.85} roughness={0.25} />
                        </mesh>
                        <mesh position={[0, 0.12, -0.07]} castShadow>
                          <boxGeometry args={[0.05, 0.16, 0.05]} />
                          <Std color={HOUSING} metalness={0.6} roughness={0.4} />
                        </mesh>
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
