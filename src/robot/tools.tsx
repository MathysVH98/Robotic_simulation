// End-of-arm tooling mounted on the JT6 flange. The active tool is chosen from
// the store; each tool animates from the engine's `grip` value (1 = open,
// 0 = closed). Tools are modelled extending +Y (the flange/tool axis).

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useRobotStore, type ToolId } from '../store/useRobotStore'

export const TOOLS: { id: ToolId; name: string }[] = [
  { id: 'weldgun', name: 'Arc Torch' },
  { id: 'gripper', name: 'Gripper' },
  { id: 'none', name: 'Flange' },
]

const STEEL = '#9aa1ad'
const DARK = '#26292f'
const BLACK = '#181a1e'
const BRASS = '#c8a44e'
const COPPER = '#c0764a'

function Std({ color, metal = 0.6, rough = 0.4 }: { color: string; metal?: number; rough?: number }) {
  return <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
}

/** Common mounting plate that bolts the tool to the flange. */
function MountPlate() {
  return (
    <mesh position={[0, 0.015, 0]} castShadow>
      <cylinderGeometry args={[0.075, 0.075, 0.03, 24]} />
      <Std color={DARK} metal={0.7} rough={0.35} />
    </mesh>
  )
}

// ----------------------------------------------------------------- Gripper
function Gripper() {
  const engine = useRobotStore((s) => s.engine)
  const left = useRef<THREE.Mesh>(null)
  const right = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const sep = 0.022 + engine.grip * 0.055 // open ↔ closed finger separation
    if (left.current) left.current.position.x = -sep
    if (right.current) right.current.position.x = sep
  })
  return (
    <group>
      <MountPlate />
      {/* pneumatic body */}
      <RoundedBox position={[0, 0.09, 0]} args={[0.13, 0.11, 0.12]} radius={0.02} smoothness={3} castShadow>
        <Std color={STEEL} metal={0.55} rough={0.4} />
      </RoundedBox>
      {/* guide rail */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.2, 0.035, 0.09]} />
        <Std color={DARK} />
      </mesh>
      {/* fingers */}
      <mesh ref={left} position={[-0.06, 0.25, 0]} castShadow>
        <boxGeometry args={[0.03, 0.16, 0.07]} />
        <Std color={STEEL} metal={0.7} rough={0.3} />
      </mesh>
      <mesh ref={right} position={[0.06, 0.25, 0]} castShadow>
        <boxGeometry args={[0.03, 0.16, 0.07]} />
        <Std color={STEEL} metal={0.7} rough={0.3} />
      </mesh>
    </group>
  )
}

// ------------------------------------------------------------- Arc torch
// MIG/gooseneck welding torch: bracket → torch body → curved neck → gas
// nozzle, with a trailing cable and an arc flash at the tip when welding.
function WeldGun() {
  const engine = useRobotStore((s) => s.engine)
  const arc = useRef<THREE.Mesh>(null)
  const flash = useRef<THREE.PointLight>(null)

  // Curved gooseneck (tool axis = +Y, work direction bends toward +Z).
  const neck = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(0, 0.16, 0.0),
      new THREE.Vector3(0, 0.25, 0.05),
      new THREE.Vector3(0, 0.31, 0.15),
      new THREE.Vector3(0, 0.33, 0.25),
    ])
    return new THREE.TubeGeometry(curve, 40, 0.016, 14, false)
  }, [])

  // Power/gas cable trailing back to the arm.
  const cable = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.06, -0.03),
      new THREE.Vector3(0.04, 0.0, -0.12),
      new THREE.Vector3(0.0, -0.12, -0.16),
      new THREE.Vector3(-0.06, -0.24, -0.1),
    ])
    return new THREE.TubeGeometry(curve, 28, 0.013, 10, false)
  }, [])

  useFrame((state) => {
    const welding = engine.grip < 0.5 // GRIP CLOSE = arc on
    if (arc.current) {
      arc.current.visible = welding
      // flicker
      const s = welding ? 0.8 + 0.25 * Math.sin(state.clock.elapsedTime * 60) : 0
      arc.current.scale.setScalar(s)
    }
    if (flash.current) flash.current.intensity = welding ? 6 + 3 * Math.sin(state.clock.elapsedTime * 50) : 0
  })

  return (
    <group>
      <MountPlate />
      {/* clamp bracket */}
      <RoundedBox position={[0, 0.06, 0]} args={[0.07, 0.09, 0.09]} radius={0.015} smoothness={3} castShadow>
        <Std color={DARK} metal={0.5} rough={0.45} />
      </RoundedBox>
      {/* torch body / handle holder */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.03, 0.13, 20]} />
        <Std color={BLACK} metal={0.4} rough={0.5} />
      </mesh>
      {/* gooseneck */}
      <mesh geometry={neck} castShadow>
        <Std color={BRASS} metal={0.8} rough={0.3} />
      </mesh>
      {/* gas nozzle at the tip (aligned with the neck's forward tangent) */}
      <mesh position={[0, 0.335, 0.27]} rotation={[Math.PI / 2.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.022, 0.07, 18]} />
        <Std color={STEEL} metal={0.55} rough={0.4} />
      </mesh>
      {/* contact tip / wire */}
      <mesh position={[0, 0.335, 0.305]} rotation={[Math.PI / 2.3, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.05, 8]} />
        <Std color={COPPER} metal={0.9} rough={0.2} />
      </mesh>
      {/* cable */}
      <mesh geometry={cable} castShadow>
        <Std color={BLACK} metal={0.1} rough={0.85} />
      </mesh>
      {/* arc flash */}
      <mesh ref={arc} position={[0, 0.335, 0.33]}>
        <sphereGeometry args={[0.013, 12, 12]} />
        <meshBasicMaterial color="#dbeaff" toneMapped={false} />
      </mesh>
      <pointLight ref={flash} position={[0, 0.335, 0.33]} color="#bcd8ff" distance={1.2} intensity={0} />
    </group>
  )
}

/** Renders the currently-selected tool at the flange. */
export function Tool() {
  const tool = useRobotStore((s) => s.tool)
  if (tool === 'gripper') return <Gripper />
  if (tool === 'weldgun') return <WeldGun />
  return null
}
