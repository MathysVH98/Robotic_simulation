// Starter programs trainees can load and learn from.

export interface Example {
  id: string
  name: string
  description: string
  code: string
}

export const EXAMPLES: Example[] = [
  {
    id: 'spot-weld',
    name: 'Spot Weld Seam',
    description: 'Body-shop spot-welding cycle: approach each weld point, close the gun, weld, retract.',
    code: `; --- Spot welding sequence (BX200L) ---
; GRIP CLOSE = electrodes close & weld, GRIP OPEN = retract
SPEED 60
HOME

; Approach the panel
JMOVE 40, 35, -15, 0, 50, 0
GRIP OPEN

; Weld point 1
MOVE JT2 48
GRIP CLOSE
DELAY 0.4
GRIP OPEN
MOVE JT2 35

; Weld point 2
JMOVE 10, 40, -20, 0, 55, 0
GRIP CLOSE
DELAY 0.4
GRIP OPEN

; Weld point 3
JMOVE -25, 38, -18, 0, 52, 0
GRIP CLOSE
DELAY 0.4
GRIP OPEN

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
