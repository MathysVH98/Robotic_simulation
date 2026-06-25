// SimEngine — the deterministic playback core.
//
// It owns the *live* animated state of the robot (joint pose + gripper) and
// advances it on its own requestAnimationFrame clock. Both the 3D model and the
// telemetry HMI read `engine.pose` directly each frame, so the heavy per-frame
// motion never round-trips through React state. Discrete events (status changes,
// step boundaries, log lines) are pushed out via callbacks so the UI can mirror
// them in a Zustand store.

import { type JointAngles, type MotionStep, HOME_POSE } from '../language/types'
import { maxJointDelta } from '../language/interpreter'

export type SimStatus = 'idle' | 'running' | 'paused' | 'done'

const DEG_PER_SEC_AT_FULL = 160 // top coordinated joint rate at SPEED 100
const GRIP_TIME = 0.3
const MIN_MOVE_TIME = 0.15

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

interface EngineCallbacks {
  onStatus: (s: SimStatus) => void
  onStepIndex: (i: number) => void
  onLog: (level: 'run' | 'done' | 'info', message: string, line?: number) => void
}

export class SimEngine {
  pose: JointAngles = [...HOME_POSE]
  grip = 0 // 0 = closed, 1 = open (animated)
  status: SimStatus = 'idle'
  speedScale = 1 // global UI multiplier (0.25x .. 3x)

  private plan: MotionStep[] = []
  private stepIndex = -1
  private stepStartPose: JointAngles = [...HOME_POSE]
  private stepStartGrip = 0
  private stepDuration = 0
  private stepElapsed = 0
  private lastTime = 0
  private rafId = 0
  private cbs: EngineCallbacks

  constructor(cbs: EngineCallbacks) {
    this.cbs = cbs
  }

  /** Load a freshly compiled plan. Resets playback but keeps the current pose. */
  load(plan: MotionStep[]) {
    this.plan = plan
    this.stepIndex = -1
    this.setStatus('idle')
    this.cbs.onStepIndex(-1)
  }

  play() {
    if (this.plan.length === 0) return
    if (this.status === 'done' || this.stepIndex < 0) {
      this.stepIndex = -1
      this.beginNextStep()
    }
    this.setStatus('running')
    this.lastTime = performance.now()
    this.loop()
  }

  pause() {
    if (this.status !== 'running') return
    this.setStatus('paused')
    cancelAnimationFrame(this.rafId)
  }

  toggle() {
    this.status === 'running' ? this.pause() : this.play()
  }

  /** Stop and snap the arm back to HOME. */
  reset() {
    cancelAnimationFrame(this.rafId)
    this.plan = this.plan // keep loaded plan
    this.stepIndex = -1
    this.pose = [...HOME_POSE]
    this.grip = 0
    this.setStatus('idle')
    this.cbs.onStepIndex(-1)
  }

  /** Execute exactly one step, then pause (teach-pendant style single-stepping). */
  stepOnce() {
    if (this.plan.length === 0) return
    if (this.stepIndex >= this.plan.length - 1 && this.status === 'done') return
    cancelAnimationFrame(this.rafId)
    this.beginNextStep()
    if (this.stepIndex >= this.plan.length) return
    // Run this single step to completion synchronously over time, then pause.
    this.setStatus('running')
    this.lastTime = performance.now()
    const runSingle = () => {
      const now = performance.now()
      const dt = Math.min((now - this.lastTime) / 1000, 0.05)
      this.lastTime = now
      const finished = this.advance(dt)
      if (finished) {
        this.setStatus('paused')
        return
      }
      this.rafId = requestAnimationFrame(runSingle)
    }
    this.rafId = requestAnimationFrame(runSingle)
  }

  private loop = () => {
    if (this.status !== 'running') return
    const now = performance.now()
    const dt = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now

    let finished = this.advance(dt)
    // If the current step completed, immediately chain into the next one.
    while (finished && this.status === 'running') {
      if (this.stepIndex >= this.plan.length - 1) {
        this.complete()
        return
      }
      this.beginNextStep()
      finished = false
    }
    this.rafId = requestAnimationFrame(this.loop)
  }

  /** Advance the active step by dt. Returns true when the step is complete. */
  private advance(dt: number): boolean {
    if (this.stepIndex < 0 || this.stepIndex >= this.plan.length) return true
    const step = this.plan[this.stepIndex]
    this.stepElapsed += dt * this.speedScale
    const t = this.stepDuration <= 0 ? 1 : Math.min(this.stepElapsed / this.stepDuration, 1)

    if (step.kind === 'tool') {
      // pose held; animate the gripper open/close
      this.grip = this.stepStartGrip + ((step.value ?? 0) - this.stepStartGrip) * easeInOut(t)
    } else if (step.kind === 'wait') {
      // hold pose; nothing to interpolate
    } else {
      const e = easeInOut(t)
      this.pose = this.stepStartPose.map(
        (v, i) => v + (step.target[i] - v) * e,
      ) as JointAngles
    }
    return t >= 1
  }

  private beginNextStep() {
    this.stepIndex++
    if (this.stepIndex >= this.plan.length) return
    const step = this.plan[this.stepIndex]
    this.cbs.onStepIndex(this.stepIndex)
    this.stepStartPose = [...this.pose]
    this.stepStartGrip = this.grip
    this.stepElapsed = 0

    if (step.kind === 'wait') {
      this.stepDuration = step.value ?? 0
    } else if (step.kind === 'tool') {
      this.stepDuration = GRIP_TIME
    } else {
      const delta = maxJointDelta(this.pose, step.target)
      const rate = DEG_PER_SEC_AT_FULL * (step.speed / 100)
      this.stepDuration = Math.max(MIN_MOVE_TIME, delta / rate)
    }
    this.cbs.onLog('run', step.label, step.line)
  }

  private complete() {
    cancelAnimationFrame(this.rafId)
    this.setStatus('done')
    this.cbs.onLog('done', `Program complete — ${this.plan.length} steps executed`)
  }

  private setStatus(s: SimStatus) {
    this.status = s
    this.cbs.onStatus(s)
  }
}
