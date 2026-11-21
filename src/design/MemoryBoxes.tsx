import type { VarView } from '../engine/trace.ts'
import { roughLine } from './sketch.ts'

/** v2 memory boxes: a labelled cell per variable. Changes flash amber and the
 * old value is crossed out by the tutor's red pen. */
export function MemoryBoxes({ vars, empty = 'nothing stored yet' }: { vars: VarView[]; empty?: string }) {
  if (vars.length === 0) return <p className="mem-empty">{`> ${empty}`}</p>
  return (
    <div className="mem-grid">
      {vars.map((v) => (
        <div
          key={`${v.name}:${v.value.repr}`}
          className={`mem-box${v.isNew ? ' is-new' : ''}${v.changed ? ' is-changed' : ''}`}
          data-anno={`var-${v.name}`}
        >
          <div className="mem-head">
            <span className="mem-name">{v.name}</span>
            <span className="mem-type">{v.value.type}</span>
          </div>
          <div className="mem-value" data-anno={`val-${v.name}`}>
            {v.value.repr}
          </div>
          {v.was && (
            <div className="mem-was">
              <span className="mem-was-text">
                was {v.was.repr}
                <svg className="mem-was-strike" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
                  <path d={roughLine({ x: 0, y: 6 }, { x: 100, y: 4 }, v.name.length, 0.02)} pathLength={1} className="draw" />
                </svg>
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
