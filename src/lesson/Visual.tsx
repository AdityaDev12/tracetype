import { MemoryBoxes } from '../design/MemoryBoxes.tsx'
import { Terminal } from '../design/Terminal.tsx'
import type { StepView } from '../engine/trace.ts'
import type { VisualKind } from '../engine/types.ts'

/** The right-hand panels: memory boxes and output. Chosen by the lesson's visual field. */
export function Visual({ view, kind = 'memory', file = 'main.py' }: { view: StepView; kind?: VisualKind; file?: string }) {
  void kind // only "memory" exists so far; later tracks add arrays, tables and plots
  return (
    <div className="visual-stack">
      {view.func && (
        <Terminal title={`inside ${view.func}()`}>
          <MemoryBoxes vars={view.locals} empty="no local variables yet" />
        </Terminal>
      )}
      <Terminal title="memory" label={view.line ? `after line ${view.line}` : 'empty'}>
        <MemoryBoxes vars={view.vars} />
      </Terminal>
      <Terminal title="output">
        <div className="toutput">
          <span className="prompt">{`$ python ${file}\n`}</span>
          {view.output.slice(0, view.output.length - view.newOutput.length)}
          {view.newOutput && (
            <span className="fresh" key={view.output.length}>
              {view.newOutput}
            </span>
          )}
        </div>
      </Terminal>
    </div>
  )
}
