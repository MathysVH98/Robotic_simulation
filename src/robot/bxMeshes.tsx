// Loads the Kawasaki BX200L CAD meshes (binary STL, millimetres) and exposes a
// hook + a debug parts grid used to reconstruct the kinematic chain.

import { useLoader } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export const MESH_URL = (j: number) => `/robots/bx200l/BX200L_J${j}.stl`
export const MM = 0.001 // mesh units (mm) → scene units (m)

export function useBxGeometries() {
  const urls = [0, 1, 2, 3, 4, 5, 6].map(MESH_URL)
  const geoms = useLoader(STLLoader, urls)
  geoms.forEach((g) => g.computeVertexNormals())
  return geoms as THREE.BufferGeometry[]
}

/** Debug: render all meshes at identity (tests whether CAD is in a common frame). */
export function BxStack() {
  const geoms = useBxGeometries()
  const colors = ['#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0', '#b5179e', '#fb8500', '#8ecae6']
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {geoms.map((g, j) => (
        <mesh key={j} geometry={g} scale={MM}>
          <meshStandardMaterial color={colors[j]} metalness={0.3} roughness={0.6} transparent opacity={0.85} />
        </mesh>
      ))}
      <axesHelper args={[1]} />
    </group>
  )
}

/** Debug: a single mesh centred at origin with its local axes (?wrist=N). */
export function BxWristParts() {
  const geoms = useBxGeometries()
  const param =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('wrist') : null
  const j = param && /^[0-6]$/.test(param) ? Number(param) : 4
  const g = geoms[j]
  return (
    <group>
      <axesHelper args={[0.4]} />
      <mesh geometry={g} scale={MM}>
        <meshStandardMaterial color="#cfd3d7" metalness={0.3} roughness={0.55} flatShading />
      </mesh>
      <Html position={[0, -0.35, 0]} center>
        <div style={{ font: '12px ui-monospace,monospace', color: '#cfe0ff', background: 'rgba(10,14,20,0.85)', padding: '3px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
          J{j}  (red=X grn=Y blu=Z)
        </div>
      </Html>
    </group>
  )
}

/** Debug: lay each link mesh out in a row with its own local axes + bbox label. */
export function BxPartsGrid() {
  const geoms = useBxGeometries()
  return (
    <group position={[0, 0.6, 0]}>
      {geoms.map((g, j) => {
        g.computeBoundingBox()
        const bb = g.boundingBox!
        const size = new THREE.Vector3()
        bb.getSize(size)
        return (
          <group key={j} position={[(j - 3) * 1.2, 0, 0]}>
            <axesHelper args={[0.6]} />
            <mesh geometry={g} scale={MM}>
              <meshStandardMaterial color="#cfd3d7" metalness={0.4} roughness={0.5} flatShading />
            </mesh>
            <Html position={[0, -0.7, 0]} center>
              <div
                style={{
                  font: '11px ui-monospace,monospace',
                  color: '#cfe0ff',
                  background: 'rgba(10,14,20,0.8)',
                  padding: '3px 6px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                J{j} · {(size.x * MM).toFixed(2)}×{(size.y * MM).toFixed(2)}×{(size.z * MM).toFixed(2)}m
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}
