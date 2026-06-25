// Live joint telemetry. Reads the engine's animated pose on its own rAF loop
// (throttled to ~20 Hz) so the readout stays smooth without re-rendering on the
// 60 Hz simulation clock.

import { useEffect, useRef, useState } from 'react'
import { useRobotStore } from '../store/useRobotStore'
import { JOINT_LIMITS, JOINT_NAMES } from '../language/types'

export function Telemetry() {
  const engine = useRobotStore((s) => s.engine)
  const tool = useRobotStore((s) => s.tool)
  const [pose, setPose] = useState<number[]>([0, 0, 0, 0, 0, 0])
  const [grip, setGrip] = useState(0)
  const raf = useRef(0)
  const last = useRef(0)

  useEffect(() => {
    const tick = (t: number) => {
      if (t - last.current > 50) {
        last.current = t
        setPose([...engine.pose])
        setGrip(engine.grip)
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [engine])

  return (
    <div className="telemetry">
      <div className="telemetry-grid">
        {pose.map((deg, i) => {
          const { min, max } = JOINT_LIMITS[i]
          const pct = ((deg - min) / (max - min)) * 100
          return (
            <div className="axis" key={i}>
              <div className="axis-head">
                <span className="axis-name">{JOINT_NAMES[i]}</span>
                <span className="axis-val">{deg.toFixed(1)}°</span>
              </div>
              <div className="axis-bar">
                <div className="axis-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      {tool !== 'none' && (
        <div className="grip-row">
          <span className="grip-label">{tool === 'weldgun' ? 'SPOT GUN' : 'GRIPPER'}</span>
          <span className={`grip-state ${grip > 0.5 ? 'open' : 'closed'}`}>
            {tool === 'weldgun'
              ? grip > 0.5
                ? 'OPEN'
                : '● WELD'
              : grip > 0.5
                ? 'OPEN'
                : 'CLOSED'}
          </span>
        </div>
      )}
    </div>
  )
}
