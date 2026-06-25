// Controller console — scrolling log of compile + execution events.

import { useEffect, useRef } from 'react'
import { useRobotStore } from '../store/useRobotStore'

export function Console() {
  const logs = useRobotStore((s) => s.logs)
  const clearLogs = useRobotStore((s) => s.clearLogs)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [logs])

  return (
    <div className="console">
      <div className="console-head">
        <span className="console-title">CONTROLLER LOG</span>
        <button className="link-btn" onClick={clearLogs}>
          clear
        </button>
      </div>
      <div className="console-body">
        {logs.map((l) => (
          <div className={`log log-${l.level}`} key={l.id}>
            <span className="log-tag">{l.level.toUpperCase()}</span>
            {l.line != null && <span className="log-line">L{l.line}</span>}
            <span className="log-msg">{l.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}
