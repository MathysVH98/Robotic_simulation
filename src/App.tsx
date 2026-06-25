import { useState } from 'react'
import { Scene } from './robot/Scene'
import { CodeEditor } from './components/CodeEditor'
import { Console } from './components/Console'
import { Controls } from './components/Controls'
import { Telemetry } from './components/Telemetry'
import { CalibPanel } from './components/CalibPanel'
import { useRobotStore } from './store/useRobotStore'

type MobileView = 'cell' | 'program'

const STATUS_LABEL: Record<string, string> = {
  idle: 'READY',
  running: 'RUNNING',
  paused: 'PAUSED',
  done: 'COMPLETE',
}

function Header() {
  const status = useRobotStore((s) => s.status)
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark">
          <span className="brand-dot" />
        </div>
        <div className="brand-text">
          <h1>
            Robo<span>Train</span>
          </h1>
          <p>Industrial Robot Simulator</p>
        </div>
      </div>
      <div className="header-right">
        <div className="robot-tag">
          <span className="robot-make">KAWASAKI</span>
          <span className="robot-model">BX200L · 6‑Axis · 200 kg</span>
        </div>
        <div className={`status-pill status-${status}`}>
          <span className="status-led" />
          {STATUS_LABEL[status] ?? status}
        </div>
      </div>
    </header>
  )
}

const INSPECT =
  typeof window !== 'undefined' &&
  /[?&](wrist|parts|stack)\b/.test(window.location.search)
const CALIB =
  typeof window !== 'undefined' && /[?&]calib\b/.test(window.location.search)

export default function App() {
  const [view, setView] = useState<MobileView>('cell')

  // Fullscreen 3D inspector / calibration mode (debug): bypass the HMI.
  if (INSPECT || CALIB) {
    return (
      <div style={{ position: 'fixed', inset: 0 }}>
        <div className="viewport" style={{ width: '100%', height: '100%', borderRadius: 0 }}>
          <Scene />
        </div>
        {CALIB && <CalibPanel />}
      </div>
    )
  }

  return (
    <div className="app">
      <Header />

      <main className="workspace">
        {/* Robot cell: 3D viewport + telemetry + transport */}
        <section className={`panel cell-panel ${view === 'cell' ? 'active' : ''}`}>
          <div className="viewport">
            <Scene />
            <div className="viewport-overlay">
              <span className="ov-badge">SIMULATION</span>
              <span className="ov-hint">drag to orbit · pinch to zoom</span>
            </div>
          </div>
          <Telemetry />
          <Controls />
        </section>

        {/* Program: editor + console */}
        <section className={`panel program-panel ${view === 'program' ? 'active' : ''}`}>
          <div className="program-head">
            <span className="program-title">PROGRAM · AS</span>
            <span className="program-sub">Kawasaki AS‑style teaching language</span>
          </div>
          <CodeEditor />
          <Console />
        </section>
      </main>

      {/* Mobile tab bar */}
      <nav className="tabbar">
        <button className={view === 'cell' ? 'active' : ''} onClick={() => setView('cell')}>
          <span className="tab-ico">⬡</span> Robot Cell
        </button>
        <button className={view === 'program' ? 'active' : ''} onClick={() => setView('program')}>
          <span className="tab-ico">{'</>'}</span> Program
        </button>
      </nav>
    </div>
  )
}
