// Teach-pendant style transport controls + speed override + example loader.

import { useRobotStore } from '../store/useRobotStore'
import { EXAMPLES } from '../language/examples'

const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 3]

export function Controls() {
  const status = useRobotStore((s) => s.status)
  const run = useRobotStore((s) => s.run)
  const pause = useRobotStore((s) => s.pause)
  const reset = useRobotStore((s) => s.reset)
  const stepOnce = useRobotStore((s) => s.step)
  const speedScale = useRobotStore((s) => s.speedScale)
  const setSpeedScale = useRobotStore((s) => s.setSpeedScale)
  const setCode = useRobotStore((s) => s.setCode)
  const stepCount = useRobotStore((s) => s.stepCount)
  const stepIndex = useRobotStore((s) => s.stepIndex)

  const running = status === 'running'

  return (
    <div className="controls">
      <div className="transport">
        <button
          className={`btn btn-primary ${running ? 'is-running' : ''}`}
          onClick={running ? pause : run}
        >
          {running ? '❚❚ Pause' : status === 'paused' ? '▶ Resume' : '▶ Run'}
        </button>
        <button className="btn" onClick={stepOnce} disabled={running}>
          ⏭ Step
        </button>
        <button className="btn" onClick={reset}>
          ⟲ Reset
        </button>
      </div>

      <div className="speed">
        <div className="speed-label">
          SPEED OVERRIDE <b>{speedScale}×</b>
        </div>
        <div className="speed-pills">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`pill ${speedScale === s ? 'active' : ''}`}
              onClick={() => setSpeedScale(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <div className="examples">
        <span className="examples-label">PROGRAMS</span>
        <div className="examples-list">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              className="chip"
              title={ex.description}
              onClick={() => setCode(ex.code)}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {stepCount > 0 && (
        <div className="progress">
          <div
            className="progress-fill"
            style={{ width: `${((stepIndex + 1) / stepCount) * 100}%` }}
          />
          <span className="progress-text">
            STEP {Math.max(0, stepIndex + 1)} / {stepCount}
          </span>
        </div>
      )}
    </div>
  )
}
