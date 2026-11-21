import type { VarView } from '../engine/trace.ts'

function VarBox({ v }: { v: VarView }) {
  const flash = v.isNew || v.changed
  return (
    <div className={`var-box${flash ? ' var-flash' : ''}`}>
      <div className="var-head">
        <span className="var-name">{v.name}</span>
        <span className={`var-type type-${v.value.type}`}>{v.value.type}</span>
      </div>
      <div className="var-value">{v.value.repr}</div>
      {v.was && <div className="var-was">was {v.was.repr}</div>}
      {v.isNew && <div className="var-new">new</div>}
    </div>
  )
}

export function MemoryPanel({ vars, title = 'Memory', empty }: { vars: VarView[]; title?: string; empty?: string }) {
  return (
    <section className="panel memory-panel" aria-label={title}>
      <h3 className="panel-title">{title}</h3>
      {vars.length === 0 ? (
        <p className="panel-empty">{empty ?? 'No variables yet.'}</p>
      ) : (
        <div className="var-grid">
          {vars.map((v) => (
            // Key includes the value so the highlight animation replays on change.
            <VarBox key={`${v.name}:${v.value.repr}:${v.isNew}`} v={v} />
          ))}
        </div>
      )}
    </section>
  )
}
