import type { Knob } from '../../engine/types.ts'
import { useLesson } from '../LessonContext.tsx'
import type { KnobRun } from './knobs.ts'

/** The "change this value and watch" controls. */
export function KnobBar({ knobs, run }: { knobs: Knob[] | undefined; run: KnobRun }) {
  const ctx = useLesson()
  if (!knobs?.length) return null
  return (
    <div className="knobs" role="group" aria-label="Change a value and watch">
      <span className="knobs-title">change it and watch</span>
      {knobs.map((k, i) => {
        // A label passes clicks on its text to the first button, so choices sit in a plain span.
        const Wrap = k.kind === 'choice' ? 'span' : 'label'
        return (
          <Wrap key={i} className="knob">
          <span className="knob-label">{k.label}</span>
          {k.kind === 'choice' ? (
            <span className="knob-choice" role="radiogroup" aria-label={k.label}>
              {(k.options ?? []).map((o) => (
                <button key={o} type="button" role="radio" aria-checked={run.values[i] === o} className={`knob-opt${run.values[i] === o ? ' on' : ''}`} onClick={() => run.setValue(i, o)}>
                  <code>{o}</code>
                </button>
              ))}
            </span>
          ) : k.kind === 'number' ? (
            <>
              <input
                type="range"
                min={k.min ?? 0}
                max={k.max ?? 20}
                step={k.step ?? 1}
                value={Number(run.values[i]) || 0}
                onChange={(e) => run.setValue(i, e.target.value)}
              />
              <input
                type="number"
                className="knob-num"
                step={k.step ?? 1}
                value={run.values[i]}
                onChange={(e) => run.setValue(i, e.target.value)}
              />
            </>
          ) : (
            <input className="knob-text" type="text" value={run.values[i]} maxLength={30} onChange={(e) => run.setValue(i, e.target.value)} />
          )}
          </Wrap>
        )
      })}
      {run.changed && (
        <button type="button" className="tt-btn bracket small" onClick={run.reset}>
          reset
        </button>
      )}
      {run.busy && (
        <span className="box-label">{ctx.status === 'failed' ? '> Python is not available here' : '> running your change...'}</span>
      )}
    </div>
  )
}
