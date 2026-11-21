import { timelineMarks } from '../../engine/trace.ts'
import type { TraceStep } from '../../engine/types.ts'

/** Scrubbable run timeline: one tick per executed step. Drag, click a tick, or
 * use the left/right arrow keys to move back and forth. A dot marks a step that
 * printed, a red tick a step that raised an error. Step -1 means "nothing ran yet". */
export function Timeline({
  trace,
  step,
  setStep,
  stopped,
}: {
  trace: TraceStep[]
  step: number
  setStep: (n: number) => void
  /** The program stopped with an error after the last step. */
  stopped?: boolean
}) {
  const last = trace.length - 1
  if (last < 0) return null
  const marks = timelineMarks(trace)
  const label = step < 0 ? 'start' : `step ${step + 1} of ${trace.length} · line ${trace[step].line}`
  return (
    <div className="timeline">
      <div className="timeline-row">
        <span className="timeline-end" aria-hidden>
          {'>'}
        </span>
        <div className="timeline-track">
          <input
            type="range"
            className="timeline-range"
            min={-1}
            max={last}
            step={1}
            value={step}
            aria-label="Move through the run"
            aria-valuetext={label}
            onChange={(e) => setStep(Number(e.target.value))}
          />
          <div className="timeline-ticks" aria-hidden>
            {marks.map((m, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                className={`timeline-tick${i <= step ? ' past' : ''}${i === step ? ' now' : ''}${m.raised ? ' raised' : ''}`}
                style={{ left: `${((i + 1) / (last + 1)) * 100}%` }}
                onClick={() => setStep(i)}
                title={`step ${i + 1}: line ${trace[i].line}`}
              >
                {m.printed && <span className="timeline-dot" />}
                {m.input && <span className="timeline-key">⌨</span>}
              </button>
            ))}
          </div>
        </div>
        {stopped && (
          <span className="timeline-stop" title="the program stopped with an error">
            ✗
          </span>
        )}
      </div>
      <span className="box-label timeline-label">{label}</span>
    </div>
  )
}
