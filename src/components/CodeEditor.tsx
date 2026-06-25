// CodeMirror-based program editor with a dark industrial theme and a line marker
// that tracks the step currently executing on the controller.

import { useEffect, useMemo, useRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view'
import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state'
import { useRobotStore } from '../store/useRobotStore'

// --- active-line highlight wiring -------------------------------------------
const setActiveLine = StateEffect.define<number | null>()

const activeLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes)
    for (const e of tr.effects) {
      if (e.is(setActiveLine)) {
        const builder = new RangeSetBuilder<Decoration>()
        if (e.value && e.value >= 1 && e.value <= tr.state.doc.lines) {
          const line = tr.state.doc.line(e.value)
          builder.add(
            line.from,
            line.from,
            Decoration.line({ attributes: { class: 'cm-activeExec' } }),
          )
        }
        deco = builder.finish()
      }
    }
    return deco
  },
  provide: (f) => EditorView.decorations.from(f),
})

const theme = EditorView.theme(
  {
    '&': { backgroundColor: 'transparent', color: '#dde3ee', fontSize: '13px', height: '100%' },
    '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', padding: '10px 0' },
    '.cm-gutters': { backgroundColor: 'transparent', color: '#465064', border: 'none' },
    '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#8aa0c0' },
    '.cm-activeExec': { backgroundColor: 'rgba(23,99,209,0.28)', boxShadow: 'inset 3px 0 0 #2f8bff' },
    '.cm-cursor': { borderLeftColor: '#2f8bff' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(47,139,255,0.25)',
    },
  },
  { dark: true },
)

export function CodeEditor() {
  const code = useRobotStore((s) => s.code)
  const setCode = useRobotStore((s) => s.setCode)
  const status = useRobotStore((s) => s.status)
  const stepIndex = useRobotStore((s) => s.stepIndex)
  const engine = useRobotStore((s) => s.engine)
  const editorRef = useRef<ReactCodeMirrorRef>(null)

  // Resolve the editor line for the currently executing step.
  const plan = (engine as unknown as { plan?: Array<{ line: number }> }).plan
  const activeLine =
    (status === 'running' || status === 'paused') && plan
      ? plan[stepIndex]?.line ?? null
      : null

  useEffect(() => {
    editorRef.current?.view?.dispatch({ effects: setActiveLine.of(activeLine) })
  }, [activeLine])

  const extensions = useMemo(() => [theme, activeLineField, EditorView.lineWrapping], [])

  return (
    <div className="editor-wrap">
      <CodeMirror
        ref={editorRef}
        value={code}
        height="100%"
        theme="dark"
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          autocompletion: false,
          bracketMatching: true,
        }}
        onChange={setCode}
      />
    </div>
  )
}
