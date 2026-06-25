// Live joint-calibration store. Drives the wrist assembly (JT4–JT6) so the
// joints can be positioned by hand via the CalibPanel instead of hard-coded
// guesses. Toggle the panel with ?calib in the URL. Once the assembly looks
// right, copy the JSON readout and bake the values into RobotArm defaults.

import { create } from 'zustand'

export type Axis = 'x' | 'y' | 'z'

export interface JointCfg {
  /** Offset from the parent joint (metres) — where this joint sits. */
  off: [number, number, number]
  /** Visual rotation of this link's mesh (degrees). */
  rot: [number, number, number]
  /** Which local axis this joint rotates about. */
  axis: Axis
  /** Direction sign of the joint rotation. */
  sign: 1 | -1
}

export interface CalibState {
  j4: JointCfg
  j5: JointCfg
  j6: JointCfg
  rest: number[] // displayed home posture (deg), 6 joints
  setJoint: (j: 'j4' | 'j5' | 'j6', patch: Partial<JointCfg>) => void
  setRest: (i: number, v: number) => void
}

// Best-guess starting point (current build).
export const DEFAULT_CALIB = {
  // Hand-calibrated wrist (JT4 roll, JT5 bend, JT6 twist).
  j4: { off: [0.2, 1.0, 0], rot: [0, 0, 0], axis: 'x', sign: -1 } as JointCfg,
  j5: { off: [0, 0.035, 0], rot: [-10, 0, 0], axis: 'x', sign: 1 } as JointCfg,
  j6: { off: [0, 0, 0], rot: [0, 0, 0], axis: 'y', sign: 1 } as JointCfg,
  rest: [0, -18, 52, 0, 18, 0],
}

export const useCalib = create<CalibState>((set) => ({
  j4: { ...DEFAULT_CALIB.j4, off: [...DEFAULT_CALIB.j4.off], rot: [...DEFAULT_CALIB.j4.rot] },
  j5: { ...DEFAULT_CALIB.j5, off: [...DEFAULT_CALIB.j5.off], rot: [...DEFAULT_CALIB.j5.rot] },
  j6: { ...DEFAULT_CALIB.j6, off: [...DEFAULT_CALIB.j6.off], rot: [...DEFAULT_CALIB.j6.rot] },
  rest: [...DEFAULT_CALIB.rest],
  setJoint: (j, patch) => set((s) => ({ [j]: { ...s[j], ...patch } }) as Partial<CalibState>),
  setRest: (i, v) => set((s) => ({ rest: s.rest.map((x, k) => (k === i ? v : x)) })),
}))

// Expose for live tuning / automated calibration during development.
if (typeof window !== 'undefined') {
  ;(window as unknown as { __calib?: typeof useCalib }).__calib = useCalib
}
