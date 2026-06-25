// Core types for the simplified Kawasaki AS-style robot language.

/** The six joint angles of a 6-axis articulated robot, in degrees. */
export type JointAngles = [number, number, number, number, number, number]

export const JOINT_NAMES = ['JT1', 'JT2', 'JT3', 'JT4', 'JT5', 'JT6'] as const

/** Mechanical limits (deg) for each axis — loosely modelled on a Kawasaki RS-series arm. */
export const JOINT_LIMITS: Array<{ min: number; max: number }> = [
  { min: -180, max: 180 }, // JT1 base swivel
  { min: -90, max: 135 }, // JT2 shoulder
  { min: -120, max: 120 }, // JT3 elbow
  { min: -180, max: 180 }, // JT4 wrist roll
  { min: -135, max: 135 }, // JT5 wrist bend
  { min: -360, max: 360 }, // JT6 flange
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
