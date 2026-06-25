// Core types for the simplified Kawasaki AS-style robot language.

/** The six joint angles of a 6-axis articulated robot, in degrees. */
export type JointAngles = [number, number, number, number, number, number]

export const JOINT_NAMES = ['JT1', 'JT2', 'JT3', 'JT4', 'JT5', 'JT6'] as const

/** Mechanical limits (deg) for each axis — Kawasaki BX200L body-shop robot. */
export const JOINT_LIMITS: Array<{ min: number; max: number }> = [
  { min: -160, max: 160 }, // JT1 base swivel   (±160°)
  { min: -60, max: 76 }, // JT2 lower arm      (+76 ~ -60°)
  { min: -75, max: 90 }, // JT3 upper arm      (+90 ~ -75°)
  { min: -210, max: 210 }, // JT4 wrist twist    (±210°)
  { min: -125, max: 125 }, // JT5 wrist bend     (±125°)
  { min: -210, max: 210 }, // JT6 flange roll    (±210°)
]

export const HOME_POSE: JointAngles = [0, 0, 0, 0, 0, 0]

/** A single resolved motion the simulator executes. */
export interface MotionStep {
  /** Source line number (1-based) that produced this step. */
  line: number
  /** Human-readable description, shown in the console. */
  label: string
  /** Target joint pose after this step completes. */
  target: JointAngles
  /** 'joint' = coordinated joint interpolation, 'wait' = hold pose, 'tool' = gripper. */
  kind: 'joint' | 'wait' | 'tool'
  /** Programmed speed 1-100 (% of max) at the time of this step. */
  speed: number
  /** For 'wait': seconds to hold. For 'tool': 0/1 grip state. */
  value?: number
}

export interface CompileError {
  line: number
  message: string
}

export interface CompileResult {
  steps: MotionStep[]
  errors: CompileError[]
}

export type LogLevel = 'info' | 'run' | 'warn' | 'error' | 'done'

export interface LogEntry {
  id: number
  level: LogLevel
  line?: number
  message: string
}
