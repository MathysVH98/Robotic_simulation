// Starter programs trainees can load and learn from.

export interface Example {
  id: string
  name: string
  description: string
  code: string
}

export const EXAMPLES: Example[] = [
  {
    id: 'pick-place',
    name: 'Pick & Place',
    description: 'A classic material-handling cycle: approach, grip, lift, transfer, release.',
    code: `; --- Pick & Place cycle ---
SPEED 60
HOME

; Move above the pick point
JMOVE 45, 35, -20, 0, 45, 0
GRIP OPEN

; Descend and grip the part
MOVE JT2 60
GRIP CLOSE
DELAY 0.5

; Lift and swing to the place point
MOVE JT2 35
JMOVE -45, 35, -20, 0, 45, 0

; Place the part
MOVE JT2 60
GRIP OPEN
DELAY 0.5
MOVE JT2 35

HOME`,
  },
  {
    id: 'palletize',
    name: 'Palletizing Loop',
    description: 'Repeat a stacking motion with LOOP to build a small pallet.',
    code: `; --- Palletizing demo ---
SPEED 75
HOME

LOOP 4
  JMOVE 30, 40, -30, 0, 40, 0
  GRIP CLOSE
  DELAY 0.3
  JMOVE -30, 40, -30, 0, 40, 0
  GRIP OPEN
  DELAY 0.3
ENDLOOP

HOME`,
  },
  {
    id: 'wave',
    name: 'Range of Motion',
    description: 'Exercise every axis through its travel — useful to learn each joint.',
    code: `; --- Axis range-of-motion test ---
SPEED 80
HOME

JOG JT1 90
JOG JT1 -180
JOG JT1 90

MOVE JT2 120
MOVE JT2 -45
MOVE JT2 0

MOVE JT3 90
MOVE JT3 -90
MOVE JT3 0

JOG JT4 180
JOG JT5 120
JOG JT6 270

HOME`,
  },
]

export const DEFAULT_PROGRAM = EXAMPLES[0].code
