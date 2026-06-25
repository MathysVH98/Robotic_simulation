// End-of-arm tooling mounted on the JT6 flange. The active tool is chosen from
// the store; each tool animates from the engine's `grip` value (1 = open,
// 0 = closed). Tools are modelled extending +Y (the flange/tool axis).

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useRobotStore, type ToolId } from '../store/useRobotStore'

export const TOOLS: { id: ToolId; name: string }[] = [
  { id: 'weldgun', name: 'Weld Gun' },
  { id: 'gripper', name: 'Gripper' },
  { id: 'none', name: 'Flange' },
]

const STEEL = '#9aa1ad'
const DARK = '#26292f'
const BLACK = '#181a1e'
const COPPER = '#c0764a'
const RED = '#d8202a'

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

// --------------------------------------------------------------- Weld gun
function WeldGun() {
  const engine = useRobotStore((s) => s.engine)
  const arm = useRef<THREE.Group>(null) // movable upper electrode
  useFrame(() => {
    // grip 0 = closed (weld), 1 = open: animate the electrode gap
    if (arm.current) arm.current.position.y = 0.24 + engine.grip * 0.07
  })
  return (
    <group>
      <MountPlate />
      {/* transformer body */}
      <RoundedBox position={[0, 0.11, -0.02]} args={[0.16, 0.18, 0.16]} radius={0.02} smoothness={3} castShadow>
        <Std color={BLACK} metal={0.3} rough={0.55} />
      </RoundedBox>
      <mesh position={[0.085, 0.11, -0.02]} castShadow>
        <boxGeometry args={[0.02, 0.12, 0.1]} />
        <Std color={RED} metal={0.3} rough={0.5} />
      </mesh>
      {/* fixed lower electrode arm (the "C") */}
      <mesh position={[0, 0.06, 0.16]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.32]} />
        <Std color={STEEL} metal={0.6} rough={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0.31]} castShadow>
        <cylinderGeometry args={[0.016, 0.022, 0.12, 18]} />
        <Std color={COPPER} metal={0.85} rough={0.25} />
      </mesh>
      {/* movable upper electrode */}
      <group ref={arm} position={[0, 0.24, 0.31]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.022, 0.016, 0.12, 18]} />
          <Std color={COPPER} metal={0.85} rough={0.25} />
        </mesh>
        <mesh position={[0, 0.1, -0.06]} castShadow>
          <boxGeometry args={[0.04, 0.12, 0.04]} />
          <Std color={STEEL} metal={0.6} rough={0.4} />
        </mesh>
      </group>
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
