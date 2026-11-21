import './visuals/visuals.css'
import { MemoryBoxes } from '../design/MemoryBoxes.tsx'
import { Terminal } from '../design/Terminal.tsx'
import type { RunError } from '../engine/grade.ts'
import type { StepView } from '../engine/trace.ts'
import type { TraceStep, VisualKind } from '../engine/types.ts'
import { loopRunAt } from './visuals/loops.ts'
import { BranchPanel, CellsPanel, ExprPanel, GridPanel, HaltPanel, HistoryPanel, LoopPanel, StdinPanel, TraceTablePanel, TypesPanel } from './visuals/panels.tsx'

export interface VisualProps {
  view: StepView
  /** Panels to show, in order (output is always last). Defaults to memory. */
  kinds?: VisualKind[]
  file?: string
  /** The whole run, for panels that look back (history, stdin, halt). */
  trace?: TraceStep[]
  /** The error the program stopped with, if any. */
  error?: RunError | null
  /** Typed answers for input(). */
  stdin?: string[]
  /** Names the cells and history panels focus on. */
  focus?: string[]
  /** Number of code lines (for "never ran"). */
  lineCount?: number
  /** The code that ran (for panels that read its structure, like branch). */
  code?: string[]
}

/** The right-hand panels, chosen by the item's (or lesson's) visuals list. */
export function Visual({ view, kinds, file = 'main.py', trace, error, stdin, focus, lineCount = 0, code = [] }: VisualProps) {
  const list: VisualKind[] = kinds?.length ? kinds : ['memory']
  const t = trace ?? []
  const atEnd = t.length > 0 && view.index >= t.length - 1
  // The cells panel points at the current item of a running for loop.
  const run = list.includes('cells') ? loopRunAt(t, view.index, code) : null
  const pointer = run && !run.done && run.stmt === 'for' && run.current > 0 ? run.current - 1 : undefined
  const panels = list.map((k) => {
    switch (k) {
      case 'memory':
        return <MemoryPanel key={k} view={view} />
      case 'history':
        return <HistoryPanel key={k} trace={t} index={view.index} focus={focus} />
      case 'expr':
        return <ExprPanel key={k} trace={t} index={view.index} />
      case 'halt':
        return <HaltPanel key={k} trace={t} index={view.index} error={error} lineCount={lineCount} />
      case 'types':
        return <TypesPanel key={k} view={view} />
      case 'stdin':
        return <StdinPanel key={k} trace={t} index={view.index} stdin={stdin} />
      case 'cells':
        return <CellsPanel key={k} view={view} focus={focus} pointer={pointer} />
      case 'branch':
        return <BranchPanel key={k} trace={t} index={view.index} code={code} />
      case 'loop':
        return <LoopPanel key={k} trace={t} index={view.index} code={code} />
      case 'tracetable':
        return <TraceTablePanel key={k} trace={t} index={view.index} code={code} focus={focus} />
      case 'grid':
        return <GridPanel key={k} trace={t} index={view.index} code={code} />
    }
  })
  return (
    <div className="visual-stack">
      {panels}
      <Terminal title="output">
        <div className="toutput">
          <span className="prompt">{`$ python ${file}\n`}</span>
          {view.output.slice(0, view.output.length - view.newOutput.length)}
          {view.newOutput && (
            <span className="fresh" key={view.output.length}>
              {view.newOutput}
            </span>
          )}
          {error && atEnd && <span className="out-error">{error.message}</span>}
        </div>
      </Terminal>
    </div>
  )
}

function MemoryPanel({ view }: { view: StepView }) {
  return (
    <>
      {view.func && (
        <Terminal title={`inside ${view.func}()`}>
          <MemoryBoxes vars={view.locals} empty="no local variables yet" />
        </Terminal>
      )}
      <Terminal title="memory" label={view.line ? `after line ${view.line}` : 'empty'}>
        <MemoryBoxes vars={view.vars} />
      </Terminal>
    </>
  )
}
