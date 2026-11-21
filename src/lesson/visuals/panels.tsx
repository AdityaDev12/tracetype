import { Terminal } from '../../design/Terminal.tsx'
import type { RunError } from '../../engine/grade.ts'
import { historyAt, inputsUsed, linesRun, type StepView } from '../../engine/trace.ts'
import type { ExprStep, TraceEvent, TraceStep, VarValue } from '../../engine/types.ts'
import { useLanguagePack } from '../../languages/LanguageContext.tsx'
import { useHoverProps } from './hover.ts'

type ExprEvent = Extract<TraceEvent, { kind: 'expr' }>

/** The latest expression event at or before step `index`, and whether it belongs to that step. */
function exprUpTo(trace: TraceStep[], index: number): { ev: ExprEvent; current: boolean } | null {
  for (let i = Math.min(index, trace.length - 1); i >= 0; i--) {
    const ev = (trace[i].events ?? []).find((e): e is ExprEvent => e.kind === 'expr')
    if (ev) return { ev, current: i === index }
  }
  return null
}

/** Expression stepper: the line reduces one operation at a time. */
export function ExprPanel({ trace, index }: { trace: TraceStep[]; index: number }) {
  const found = exprUpTo(trace, index)
  return (
    <Terminal title="working it out" label={found ? `line ${found.ev.line}` : undefined} className="viz-expr">
      {!found ? (
        <p className="mem-empty">{'> step to a line with math or a test to see Python work it out'}</p>
      ) : (
        <ol className={`expr-steps${found.current ? ' current' : ' old'}`} key={`${index}-${found.ev.line}`}>
          {found.ev.steps.map((s: ExprStep, i) => (
            <li key={i} className="expr-step" style={{ animationDelay: found.current ? `${i * 380}ms` : '0ms' }}>
              <code className="expr-text">{s.text}</code>
              {s.part !== undefined && s.value !== undefined && (
                <span className="expr-note">
                  {s.part} → {s.value}
                </span>
              )}
              {i === 0 && <span className="expr-note dim">as written</span>}
              {s.skipped?.map((k) => (
                <span key={k} className="expr-skip">
                  skipped: <code>{k}</code>
                </span>
              ))}
            </li>
          ))}
        </ol>
      )}
    </Terminal>
  )
}

function HistoryRow({ name, values }: { name: string; values: VarValue[] }) {
  const hover = useHoverProps(name)
  return (
    <li className="hist-row" {...hover}>
      <span className="hist-name">{name}</span>
      <span className="hist-values">
        {values.map((v, i) => (
          <span key={i} className={`hist-val${i === values.length - 1 ? ' now' : ''}`}>
            {i > 0 && <span className="hist-arrow">→</span>}
            <code>{v.repr}</code>
          </span>
        ))}
      </span>
    </li>
  )
}

/** Value trail: every value each name has held so far. */
export function HistoryPanel({ trace, index, focus }: { trace: TraceStep[]; index: number; focus?: string[] }) {
  let rows = historyAt(trace, index)
  if (focus?.length) rows = rows.filter((r) => focus.includes(r.name))
  return (
    <Terminal title="history" label="every value so far" className="viz-history">
      {rows.length === 0 ? (
        <p className="mem-empty">{'> nothing stored yet'}</p>
      ) : (
        <ul className="hist-list">
          {rows.map((r) => (
            <HistoryRow key={r.name} name={r.name} values={r.values} />
          ))}
        </ul>
      )}
    </Terminal>
  )
}

/** Where the program stopped: the error, its line, and the lines that never ran. */
export function HaltPanel({
  trace,
  index,
  error,
  lineCount,
}: {
  trace: TraceStep[]
  index: number
  error?: RunError | null
  lineCount: number
}) {
  const pack = useLanguagePack()
  if (!error) return null
  const atEnd = index >= trace.length - 1
  if (!atEnd) {
    return (
      <Terminal title="stopped?" className="viz-halt">
        <p className="mem-empty">{'> keep going to see where this program stops'}</p>
      </Terminal>
    )
  }
  const ran = linesRun(trace)
  const never: number[] = []
  for (let n = (error.line ?? lineCount) + 1; n <= lineCount; n++) if (!ran.has(n)) never.push(n)
  const plain = pack.explainError(error.message)
  return (
    <Terminal title="stopped" label={error.line ? `at line ${error.line}` : undefined} className="viz-halt on">
      <p className="halt-msg">
        <span className="halt-x">✗</span> <code>{error.message}</code>
      </p>
      {plain && <p className="halt-plain">{plain}</p>}
      <p className="halt-note">
        {error.line ? `Python stopped at line ${error.line}. ` : 'Python stopped. '}
        {never.length > 0
          ? `Line${never.length > 1 ? 's' : ''} ${never.join(', ')} never ran.`
          : 'Everything before it did run.'}
      </p>
    </Terminal>
  )
}

const CONVERT = /^(int|float|str|bool|round|type|len)\(/

function TypeRow({ name, v }: { name: string; v: VarValue }) {
  const hover = useHoverProps(name)
  return (
    <li className="types-row" {...hover}>
      <span className="types-name">{name}</span>
      <code className="types-val">{v.repr}</code>
      <span className={`type-chip type-${v.type}`}>{v.type}</span>
    </li>
  )
}

/** Types: every name with a big type badge, and conversions on this line as a pipe. */
export function TypesPanel({ view }: { view: StepView }) {
  const expr = view.events.find((e): e is ExprEvent => e.kind === 'expr')
  const pipes = (expr?.steps ?? []).filter((s) => s.part && CONVERT.test(s.part))
  const failed = view.events.find((e) => e.kind === 'raise' && (e.type === 'ValueError' || e.type === 'TypeError'))
  return (
    <Terminal title="types" className="viz-types">
      {pipes.length > 0 && (
        <ul className="pipe-list">
          {pipes.map((s, i) => {
            const m = /^(\w+)\((.*)\)$/.exec(s.part!)
            return (
              <li key={i} className="pipe" style={{ animationDelay: `${i * 300}ms` }}>
                <code>{m ? m[2] : s.part}</code>
                <span className="pipe-arrow">→</span>
                <span className="pipe-fn">{m ? `${m[1]}()` : 'convert'}</span>
                <span className="pipe-arrow">→</span>
                <code className="pipe-out">{s.value}</code>
              </li>
            )
          })}
        </ul>
      )}
      {failed && failed.kind === 'raise' && (
        <p className="types-fail">
          <span className="halt-x">✗</span> <code>{failed.message}</code>
        </p>
      )}
      {view.vars.length === 0 ? (
        <p className="mem-empty">{'> nothing stored yet'}</p>
      ) : (
        <ul className="types-list">
          {view.vars.map((v) => (
            <TypeRow key={v.name} name={v.name} v={v.value} />
          ))}
        </ul>
      )}
    </Terminal>
  )
}

/** Input tape: the answers the "user" will type, one per input() call. */
export function StdinPanel({ trace, index, stdin }: { trace: TraceStep[]; index: number; stdin?: string[] }) {
  const used = inputsUsed(trace, index)
  const answers = stdin ?? []
  const justNow = (trace[index]?.events ?? []).some((e) => e.kind === 'input')
  return (
    <Terminal title="keyboard" label={`${used} of ${answers.length} typed`} className="viz-stdin">
      {answers.length === 0 ? (
        <p className="mem-empty">{'> no typed answers: input() would wait forever'}</p>
      ) : (
        <ol className="tape">
          {answers.map((a, i) => {
            const state = i < used ? (justNow && i === used - 1 ? 'fresh' : 'used') : i === used ? 'next' : 'wait'
            return (
              <li key={i} className={`tape-cell ${state}`}>
                <code>{a === '' ? '(Enter)' : a}</code>
                {state === 'next' && <span className="tape-tag">next</span>}
              </li>
            )
          })}
        </ol>
      )}
    </Terminal>
  )
}

function Cells({ name, items }: { name: string; items: string[] }) {
  const hover = useHoverProps(name)
  return (
    <div className="cells-row" {...hover}>
      <span className="cells-name">
        {name} <span className="cells-len">len {items.length}</span>
      </span>
      {items.length === 0 ? (
        <span className="cells-empty">empty</span>
      ) : (
        <div className="cells" role="list">
          {items.map((c, i) => (
            <span key={i} className="cell" role="listitem">
              <span className="cell-val">{c === ' ' ? '␣' : c === '\n' ? '\\n' : c === '\t' ? '\\t' : c}</span>
              <span className="cell-idx">{i}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Sequence cells: each character of a string (or item of a list) in its own
 * numbered cell. */
export function CellsPanel({ view, focus }: { view: StepView; focus?: string[] }) {
  const rows: { name: string; items: string[] }[] = []
  for (const v of view.vars) {
    if (focus?.length && !focus.includes(v.name)) continue
    if (v.value.text !== undefined) {
      if (v.value.text.length <= 30) rows.push({ name: v.name, items: [...v.value.text] })
    } else if (v.value.ref) {
      const o = view.heap[v.value.ref]
      if (o && (o.kind === 'list' || o.kind === 'tuple') && o.items.length <= 20) {
        rows.push({ name: v.name, items: o.items.map((x) => x.repr) })
      }
    }
  }
  return (
    <Terminal title="cells" label="one box per character" className="viz-cells">
      {rows.length === 0 ? (
        <p className="mem-empty">{'> no text stored yet'}</p>
      ) : (
        rows.map((r) => <Cells key={`${r.name}:${r.items.join('\u0000')}`} name={r.name} items={r.items} />)
      )}
    </Terminal>
  )
}
