// Live wrist-calibration panel (debug, ?calib). Drag the sliders to position
// JT4–JT6 and set their rotation axes, then copy the JSON readout — those values
// get baked into RobotArm / useCalib defaults.

import { useCalib, type Axis, type JointCfg } from '../store/useCalib'

const AXES: Axis[] = ['x', 'y', 'z']

function Row({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
      <span style={{ width: 26, color: '#8aa0c0' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={{ width: 46, textAlign: 'right', fontFamily: 'monospace' }}>
        {value.toFixed(step < 1 ? 3 : 0)}
      </span>
    </label>
  )
}

function JointBlock({
  name,
  cfg,
  set,
}: {
  name: 'j4' | 'j5' | 'j6'
  cfg: JointCfg
  set: (patch: Partial<JointCfg>) => void
}) {
  const setOff = (i: number, v: number) => {
    const off = [...cfg.off] as [number, number, number]
    off[i] = v
    set({ off })
  }
  const setRot = (i: number, v: number) => {
    const rot = [...cfg.rot] as [number, number, number]
    rot[i] = v
    set({ rot })
  }
  return (
    <div style={{ borderTop: '1px solid #2a3344', paddingTop: 8, marginTop: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
        {name.toUpperCase()} · {name === 'j4' ? 'roll' : name === 'j5' ? 'bend' : 'twist'}
      </div>
      <div style={{ color: '#5a6b85', fontSize: 10 }}>offset (m)</div>
      <Row label="X" value={cfg.off[0]} min={-1} max={1} step={0.005} onChange={(v) => setOff(0, v)} />
      <Row label="Y" value={cfg.off[1]} min={-1} max={1} step={0.005} onChange={(v) => setOff(1, v)} />
      <Row label="Z" value={cfg.off[2]} min={-1} max={1} step={0.005} onChange={(v) => setOff(2, v)} />
      <div style={{ color: '#5a6b85', fontSize: 10, marginTop: 4 }}>mesh rotation (°)</div>
      <Row label="rX" value={cfg.rot[0]} min={-180} max={180} step={5} onChange={(v) => setRot(0, v)} />
      <Row label="rY" value={cfg.rot[1]} min={-180} max={180} step={5} onChange={(v) => setRot(1, v)} />
      <Row label="rZ" value={cfg.rot[2]} min={-180} max={180} step={5} onChange={(v) => setRot(2, v)} />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
        <span style={{ color: '#5a6b85', fontSize: 10 }}>axis</span>
        {AXES.map((a) => (
          <button
            key={a}
            onClick={() => set({ axis: a })}
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 5,
              border: '1px solid #2f73ff',
              background: cfg.axis === a ? '#2f73ff' : 'transparent',
              color: '#fff',
            }}
          >
            {a}
          </button>
        ))}
        <button
          onClick={() => set({ sign: (cfg.sign === 1 ? -1 : 1) as 1 | -1 })}
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 5,
            border: '1px solid #444',
            background: 'transparent',
            color: '#fff',
            marginLeft: 'auto',
          }}
        >
          sign {cfg.sign > 0 ? '+' : '−'}
        </button>
      </div>
    </div>
  )
}

export function CalibPanel() {
  const { j4, j5, j6, rest, setJoint, setRest } = useCalib()
  const json = JSON.stringify({ j4, j5, j6, rest }, null, 2)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 320,
        maxHeight: '100vh',
        overflowY: 'auto',
        background: 'rgba(10,14,20,0.94)',
        borderLeft: '1px solid #2a3344',
        color: '#e6ebf4',
        padding: 12,
        zIndex: 1000,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.1em' }}>WRIST CALIBRATION</div>
      <div style={{ color: '#8aa0c0', fontSize: 10, marginBottom: 6 }}>
        Drag to position JT4–JT6, then copy the JSON.
      </div>

      <JointBlock name="j4" cfg={j4} set={(p) => setJoint('j4', p)} />
      <JointBlock name="j5" cfg={j5} set={(p) => setJoint('j5', p)} />
      <JointBlock name="j6" cfg={j6} set={(p) => setJoint('j6', p)} />

      <div style={{ borderTop: '1px solid #2a3344', paddingTop: 8, marginTop: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 12 }}>HOME rest posture (°)</div>
        {['JT1', 'JT2', 'JT3', 'JT4', 'JT5', 'JT6'].map((n, i) => (
          <Row
            key={n}
            label={n.slice(2)}
            value={rest[i]}
            min={-180}
            max={180}
            step={1}
            onChange={(v) => setRest(i, v)}
          />
        ))}
      </div>

      <pre
        style={{
          marginTop: 10,
          background: '#0b0f16',
          border: '1px solid #2a3344',
          borderRadius: 6,
          padding: 8,
          fontSize: 10,
          whiteSpace: 'pre-wrap',
          userSelect: 'all',
        }}
      >
        {json}
      </pre>
    </div>
  )
}
