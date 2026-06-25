// A tiny, forgiving interpreter for a Kawasaki AS-inspired teaching language.
//
// Supported statements (case-insensitive):
//   SPEED <1-100>                       set motion speed (% of max)
//   HOME                                move all axes to 0°
//   JMOVE <j1,j2,j3,j4,j5,j6>           coordinated joint move to an absolute pose
//   MOVE JT<n> <deg>                    move a single axis to an absolute angle
//   JOG  JT<n> <deg>                    move a single axis by a relative amount
//   DELAY <seconds>                     hold the current pose
//   GRIP OPEN | GRIP CLOSE              actuate the end-effector
//   LOOP <count> ... ENDLOOP            repeat a block N times (nestable)
//   ; comment   or   # comment          ignored
//
// The interpreter resolves the program into a flat list of MotionSteps that the
// simulator can play back deterministically.

import {
  type CompileResult,
  type CompileError,
  type JointAngles,
  type MotionStep,
  HOME_POSE,
  JOINT_LIMITS,
} from './types'

interface LoopFrame {
  count: number
  remaining: number
  bodyStart: number // index of the statement after LOOP
  line: number
}

const MAX_STEPS = 20000 // safety guard against runaway loops

export function compile(source: string): CompileResult {
  const rawLines = source.replace(/\r\n/g, '\n').split('\n')
  const errors: CompileError[] = []
  const steps: MotionStep[] = []

  // Pre-tokenise into executable statements with their original line numbers,
  // stripping comments and blanks.
  const stmts: Array<{ line: number; text: string }> = []
  rawLines.forEach((raw, i) => {
    const noComment = raw.replace(/[;#].*$/, '').trim()
    if (noComment.length > 0) stmts.push({ line: i + 1, text: noComment })
  })

  let pose: JointAngles = [...HOME_POSE]
  let speed = 50
  let grip = 0

  const loopStack: LoopFrame[] = []
  let pc = 0
  let guard = 0

  const clampPose = (p: JointAngles, line: number): JointAngles =>
    p.map((v, idx) => {
      const { min, max } = JOINT_LIMITS[idx]
      if (v < min || v > max) {
        errors.push({
          line,
          message: `JT${idx + 1} target ${v}° exceeds limit (${min}°..${max}°) — clamped`,
        })
        return Math.max(min, Math.min(max, v))
      }
      return v
    }) as JointAngles

  while (pc < stmts.length) {
    if (++guard > MAX_STEPS) {
      errors.push({ line: stmts[pc].line, message: 'Program too long / loop runaway — aborted' })
      break
    }
    const { line, text } = stmts[pc]
    const tokens = text.split(/[\s,]+/).filter(Boolean)
    const cmd = tokens[0].toUpperCase()

    switch (cmd) {
      case 'SPEED': {
        const v = Number(tokens[1])
        if (!Number.isFinite(v) || v < 1 || v > 100) {
          errors.push({ line, message: `SPEED expects 1-100, got "${tokens[1] ?? ''}"` })
        } else {
          speed = v
        }
        pc++
        break
      }

      case 'HOME': {
        pose = [...HOME_POSE]
        steps.push({ line, label: 'HOME — all axes → 0°', target: [...pose], kind: 'joint', speed })
        pc++
        break
      }

      case 'JMOVE': {
        const nums = tokens.slice(1).map(Number)
        if (nums.length !== 6 || nums.some((n) => !Number.isFinite(n))) {
          errors.push({ line, message: 'JMOVE expects 6 numeric joint values' })
          pc++
          break
        }
        pose = clampPose(nums as JointAngles, line)
        steps.push({
          line,
          label: `JMOVE → [${pose.map((n) => n.toFixed(0)).join(', ')}]`,
          target: [...pose],
          kind: 'joint',
          speed,
        })
        pc++
        break
      }

      case 'MOVE':
      case 'MOVE_':
      case 'JOG': {
        const axisTok = (tokens[1] ?? '').toUpperCase().replace('JT', '')
        const axis = Number(axisTok)
        const amount = Number(tokens[2])
        if (!(axis >= 1 && axis <= 6) || !Number.isFinite(amount)) {
          errors.push({ line, message: `${cmd} expects "JT<1-6> <degrees>"` })
          pc++
          break
        }
        const next: JointAngles = [...pose]
        next[axis - 1] = cmd === 'JOG' ? next[axis - 1] + amount : amount
        pose = clampPose(next, line)
        steps.push({
          line,
          label: `${cmd} JT${axis} ${cmd === 'JOG' ? (amount >= 0 ? '+' : '') + amount : '→ ' + amount}°`,
          target: [...pose],
          kind: 'joint',
          speed,
        })
        pc++
        break
      }

      case 'DELAY': {
        const secs = Number(tokens[1])
        if (!Number.isFinite(secs) || secs < 0) {
          errors.push({ line, message: 'DELAY expects a non-negative number of seconds' })
        } else {
          steps.push({
            line,
            label: `DELAY ${secs}s`,
            target: [...pose],
            kind: 'wait',
            speed,
            value: secs,
          })
        }
        pc++
        break
      }

      case 'GRIP': {
        const mode = (tokens[1] ?? '').toUpperCase()
        if (mode !== 'OPEN' && mode !== 'CLOSE') {
          errors.push({ line, message: 'GRIP expects OPEN or CLOSE' })
          pc++
          break
        }
        grip = mode === 'OPEN' ? 1 : 0
        steps.push({
          line,
          label: `GRIP ${mode}`,
          target: [...pose],
          kind: 'tool',
          speed,
          value: grip,
        })
        pc++
        break
      }

      case 'LOOP': {
        const count = Number(tokens[1])
        if (!Number.isInteger(count) || count < 1) {
          errors.push({ line, message: 'LOOP expects a positive integer count' })
          pc++
          break
        }
        loopStack.push({ count, remaining: count, bodyStart: pc + 1, line })
        pc++
        break
      }

      case 'ENDLOOP': {
        const frame = loopStack[loopStack.length - 1]
        if (!frame) {
          errors.push({ line, message: 'ENDLOOP without a matching LOOP' })
          pc++
          break
        }
        frame.remaining--
        if (frame.remaining > 0) {
          pc = frame.bodyStart
        } else {
          loopStack.pop()
          pc++
        }
        break
      }

      default:
        errors.push({ line, message: `Unknown command "${tokens[0]}"` })
        pc++
    }
  }

  if (loopStack.length > 0) {
    errors.push({ line: loopStack[loopStack.length - 1].line, message: 'LOOP is never closed with ENDLOOP' })
  }

  return { steps, errors }
}

/** Largest absolute joint delta across an interpolation, used to time moves realistically. */
export function maxJointDelta(from: JointAngles, to: JointAngles): number {
  return Math.max(...from.map((v, i) => Math.abs(to[i] - v)))
}
