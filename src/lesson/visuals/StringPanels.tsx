import { Terminal } from '../../design/Terminal.tsx'
import type { TraceStep } from '../../engine/types.ts'
import { useHoverProps } from './hover.ts'
import { formatAt, refsAt } from './strings.ts'

/** f-string filler: each {hole} gets its value, then the spec shapes it. */
export function FormatPanel({ trace, index }: { trace: TraceStep[]; index: number }) {
  const found = formatAt(trace, index)
  return (
    <Terminal title="filling the f-string" label={found ? `line ${found.ev.line}` : undefined} className="viz-format">
      {!found ? (
        <p className="mem-empty">{'> step to a line with an f-string to see its holes fill in'}</p>
      ) : (
        <div className={`fmt${found.current ? ' current' : ' old'}`} key={`${index}-${found.ev.line}`}>
          <code className="fmt-template">{found.ev.template}</code>
          <ol className="fmt-holes">
            {found.ev.holes.map((h, i) => (
              <li key={i} className="fmt-hole" style={{ animationDelay: found.current ? `${i * 380}ms` : '0ms' }}>
                <code className="fmt-code">{`{${h.code}}`}</code>
                <span className="fmt-arrow">→</span>
                <code className="fmt-value">{h.value}</code>
                {h.conv && <span className="fmt-spec">{`!${h.conv}`}</span>}
                {h.spec ? <span className="fmt-spec">{`:${h.spec}`}</span> : null}
                {h.error ? (
                  <span className="fmt-error">{h.error}</span>
                ) : h.result !== undefined ? (
                  <>
                    <span className="fmt-arrow">→</span>
                    <code className="fmt-result">{h.result.replace(/ /g, '·')}</code>
                  </>
                ) : null}
              </li>
            ))}
          </ol>
          {found.ev.text !== null && (
            <p className="fmt-text">
              <span className="fmt-note">result</span> <code>{found.ev.text.replace(/ /g, '·')}</code>
            </p>
          )}
          {found.ev.holes.some((h) => h.result?.includes(' ')) && <p className="fmt-note">· marks a space</p>}
        </div>
      )}
    </Terminal>
  )
}

function RefName({ name, moved }: { name: string; moved: boolean }) {
  const hover = useHoverProps(name)
  return (
    <span className={`ref-name${moved ? ' moved' : ''}`} {...hover}>
      <code>{name}</code>
      <span className="ref-arrow" aria-hidden>
        ──▶
      </span>
    </span>
  )
}

/** Reference diagram: each name is an arrow to an object. */
export function RefsPanel({ trace, index, focus }: { trace: TraceStep[]; index: number; focus?: string[] }) {
  const { objects, moved } = refsAt(trace, index, focus)
  return (
    <Terminal title="names and objects" label="each name points at an object" className="viz-refs">
      {objects.length === 0 ? (
        <p className="mem-empty">{'> no names yet'}</p>
      ) : (
        <ul className="refs">
          {objects.map((o) => (
            <li key={o.key} className={`ref-row${o.gone ? ' gone' : ''}`}>
              <span className="ref-names">
                {o.gone ? (
                  <span className="ref-none">no name points here</span>
                ) : (
                  o.names.map((n) => <RefName key={n} name={n} moved={moved.includes(n)} />)
                )}
              </span>
              <span className="ref-obj">
                <code>{o.repr}</code>
                <span className="ref-type">{o.type}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Terminal>
  )
}
