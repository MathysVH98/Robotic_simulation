// React-facing store. Holds editor text, the compiled plan, discrete playback
// state and the console log. The continuous joint animation lives in SimEngine
// (read directly by the 3D scene & telemetry) and is intentionally NOT mirrored
// here, to keep per-frame work out of React.

import { create } from 'zustand'
import { compile } from '../language/interpreter'
import { type CompileError, type LogEntry, type LogLevel } from '../language/types'
import { DEFAULT_PROGRAM } from '../language/examples'
import { SimEngine, type SimStatus } from './simEngine'

let logId = 0

/** End-of-arm tooling mounted on the JT6 flange. */
export type ToolId = 'weldgun' | 'gripper' | 'none'

interface RobotState {
  code: string
  status: SimStatus
  stepIndex: number
  errors: CompileError[]
  logs: LogEntry[]
  stepCount: number
  speedScale: number
  engine: SimEngine
  tool: ToolId

  setCode: (code: string) => void
  setTool: (tool: ToolId) => void
  compileProgram: () => boolean
  run: () => void
  pause: () => void
  reset: () => void
  step: () => void
  setSpeedScale: (s: number) => void
  log: (level: LogLevel, message: string, line?: number) => void
  clearLogs: () => void
}

export const useRobotStore = create<RobotState>((set, get) => {
  const pushLog = (level: LogLevel, message: string, line?: number) => {
    set((s) => ({
      logs: [...s.logs, { id: ++logId, level, message, line }].slice(-200),
    }))
  }

  const engine = new SimEngine({
    onStatus: (status) => set({ status }),
    onStepIndex: (stepIndex) => set({ stepIndex }),
    onLog: (level, message, line) => pushLog(level, message, line),
  })

  return {
    code: DEFAULT_PROGRAM,
    status: 'idle',
    stepIndex: -1,
    errors: [],
    logs: [
      { id: ++logId, level: 'info', message: 'Controller ready. Compile a program to begin.' },
    ],
    stepCount: 0,
    speedScale: 1,
    engine,
    tool: 'weldgun',

    setCode: (code) => set({ code }),
    setTool: (tool) => set({ tool }),

    compileProgram: () => {
      const { code } = get()
      const { steps, errors } = compile(code)
      set({ errors, stepCount: steps.length })
      engine.load(steps)
      if (errors.length > 0) {
        errors.forEach((e) => pushLog('warn', e.message, e.line))
      }
      if (steps.length === 0) {
        pushLog('error', 'No executable motions found.')
        return false
      }
      pushLog('info', `Compiled ${steps.length} motion step(s).`)
      return errors.length === 0
    },

    run: () => {
      const { status, compileProgram } = get()
      // (Re)compile when idle/done so the latest edits take effect.
      if (status === 'idle' || status === 'done') {
        const ok = compileProgram()
        if (get().stepCount === 0) return
        if (!ok) pushLog('warn', 'Running despite warnings — targets were clamped to limits.')
      }
      engine.play()
    },

    pause: () => engine.pause(),

    reset: () => {
      engine.reset()
      pushLog('info', 'Reset — arm returned to HOME.')
    },

    step: () => {
      const { status, compileProgram, stepCount } = get()
      if (status === 'idle' || status === 'done') {
        compileProgram()
        if (get().stepCount === 0 && stepCount === 0) return
      }
      engine.stepOnce()
    },

    setSpeedScale: (speedScale) => {
      engine.speedScale = speedScale
      set({ speedScale })
    },

    log: pushLog,
    clearLogs: () =>
      set({ logs: [{ id: ++logId, level: 'info', message: 'Console cleared.' }] }),
  }
})
