import type { VarView } from '../engine/trace.ts'
import { useHoverName } from '../lesson/visuals/hover.ts'
import { roughLine } from './sketch.ts'

/** v2 memory boxes: a labelled cell per variable.
 *
 * A changed value plays a staged change (about 1.3 s, see design.css):
 * the old value stays, the tutor's red pen strikes it left to right, it slides
 * down into the small "was X" spot, then the new value fades in with an amber
 * flash. New boxes pop in. With reduced motion everything shows at once.
 *
 * Boxes are keyed by name and value, so each new value remounts the box and
 * the animation plays from the start. */
export function MemoryBoxes({ vars, empty = 'nothing stored yet' }: { vars: VarView[]; empty?: string }) {
  const hover = useHoverName()
  if (vars.length === 0) return <p className="mem-empty">{`> ${empty}`}</p>
  return (
    <div className="mem-grid">
      {vars.map((v) => {
        const changed = v.changed && !!v.was
        return (
          <div
            key={`${v.name}:${v.value.repr}`}
            className={`mem-box${v.isNew ? ' is-new' : ''}${changed ? ' is-changed' : ''}`}
            data-anno={`var-${v.name}`}
            data-hl={hover.name === v.name ? 'on' : undefined}
            onMouseEnter={() => hover.set(v.name)}
            onMouseLeave={() => hover.set(null)}
          >
            <div className="mem-head">
              <span className="mem-name">{v.name}</span>
              <span className="mem-type">{v.value.type}</span>
            </div>
            <div className="mem-cell">
              {changed && (
                <span className="mem-old" aria-hidden>
                  {v.was!.repr}
                  <svg className="mem-old-strike" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d={roughLine({ x: 0, y: 6 }, { x: 100, y: 4 }, v.name.length + 7, 0.02)} pathLength={1} />
                  </svg>
                </span>
              )}
              <div className="mem-value" data-anno={`val-${v.name}`}>
                {v.value.repr}
              </div>
            </div>
            {v.was && (
              <div className="mem-was">
                <span className="mem-was-text">
                  was {v.was.repr}
                  <svg className="mem-was-strike" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
                    <path d={roughLine({ x: 0, y: 6 }, { x: 100, y: 4 }, v.name.length, 0.02)} pathLength={1} />
                  </svg>
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
