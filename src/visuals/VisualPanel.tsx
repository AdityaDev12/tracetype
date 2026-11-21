import type { StepView } from '../engine/trace.ts'
import type { VisualKind } from '../engine/types.ts'
import { MemoryPanel } from './MemoryPanel.tsx'
import { OutputPanel } from './OutputPanel.tsx'

export function VisualPanel({ kind, view }: { kind: VisualKind; view: StepView }) {
  // Only the memory visual exists so far. Later tracks add arrays, tables and plots.
  void kind
  return (
    <div className="visual-panel">
      {view.func && (
        <MemoryPanel title={`Inside ${view.func}()`} vars={view.locals} empty="No local variables yet." />
      )}
      <MemoryPanel vars={view.vars} empty="No variables yet. Run a line to make one." />
      <OutputPanel output={view.output} newOutput={view.newOutput} />
    </div>
  )
}
