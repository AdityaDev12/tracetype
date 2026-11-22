import { Terminal } from '../../design/Terminal.tsx'
import type { RunError } from '../../engine/grade.ts'
import { historyAt, inputsUsed, linesRun, type StepView } from '../../engine/trace.ts'
import type { ExprStep, TraceEvent, TraceStep, VarValue } from '../../engine/types.ts'
import { useLanguagePack } from '../../languages/LanguageContext.tsx'
import { ladderAt } from './branch.ts'
import { useHoverProps } from './hover.ts'
import { gridAt, loopRunAt, loopVar } from './loops.ts'
import { indexUseAt, usesNegatives, type IndexEvent } from './strings.ts'

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

const showChar = (c: string) => (c === ' ' ? '␣' : c === '\n' ? '\\n' : c === '\t' ? '\\t' : c)

/** What a line just read from the cells, in words: word[1:4] → 'yth'. */
function CellsUse({ name, use }: { name: string; use: IndexEvent }) {
  const plain = use.at !== undefined && use.key !== String(use.at)
  return (
    <p className={`cells-use${use.error ? ' bad' : ''}`}>
      <code>{`${name}[${use.key}]`}</code>
      {plain && <span className="cells-note">{` is ${name}[${use.at}]`}</span>}
      {use.error ? (
        <span className="cells-note">{` → no position ${use.at} (positions go 0 to ${use.len - 1})`}</span>
      ) : (
        <>
          {' → '}
          <code>{use.value}</code>
          {use.slice && <span className="cells-note">{use.picked?.length ? ` positions ${use.picked.join(', ')}` : ' nothing inside, so empty'}</span>}
        </>
      )}
    </p>
  )
}

function Cells({ name, items, pointer, use, negatives }: { name: string; items: string[]; pointer?: number; use?: IndexEvent; negatives?: boolean }) {
  const hover = useHoverProps(name)
  const picked = use?.picked ?? []
  // Number the cells when a slice skips or goes backwards, so the order shows.
  const ordered = !!use?.slice && picked.some((p, k) => k > 0 && p !== picked[k - 1] + 1)
  return (
    <div className="cells-row" {...hover}>
      <span className="cells-name">
        {name} <span className="cells-len">len {items.length}</span>
      </span>
      {items.length === 0 ? (
        <span className="cells-empty">empty</span>
      ) : (
        <div className="cells" role="list">
          {items.map((c, i) => {
            const k = picked.indexOf(i)
            return (
              <span key={i} className={`cell${pointer === i ? ' at' : ''}${k >= 0 ? ' pick' : ''}`} role="listitem">
                {ordered && k >= 0 && <span className="cell-order">{k + 1}</span>}
                <span className="cell-val">{showChar(c)}</span>
                <span className="cell-idx">{i}</span>
                {negatives && <span className="cell-idx neg">{i - items.length}</span>}
              </span>
            )
          })}
          {use?.error && (
            <span className="cell ghost" role="listitem">
              <span className="cell-val">?</span>
              <span className="cell-idx">{use.at}</span>
              {negatives && <span className="cell-idx neg"> </span>}
            </span>
          )}
        </div>
      )}
      {use && <CellsUse name={name} use={use} />}
    </div>
  )
}

/** Sequence cells: each character of a string (or item of a list) in its own
 * numbered cell. */
export function CellsPanel({ view, focus, pointer, trace = [] }: { view: StepView; focus?: string[]; pointer?: number; trace?: TraceStep[] }) {
  const negatives = usesNegatives(trace)
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
        rows.map((r, k) => (
          <Cells
            key={`${r.name}:${r.items.join('\u0000')}`}
            name={r.name}
            items={r.items}
            pointer={k === 0 && focus?.length ? pointer : undefined}
            use={indexUseAt(trace, view.index, r.name)}
            negatives={negatives}
          />
        ))
      )}
    </Terminal>
  )
}

const MARK = { taken: '✓', no: '✗', skipped: '·' } as const
const SAYS = { taken: 'True: runs', no: 'False', skipped: 'not checked' } as const

/** If/elif/else (or match/case) ladder: each test with its result and the path taken. */
export function BranchPanel({ trace, index, code }: { trace: TraceStep[]; index: number; code: string[] }) {
  const ladder = ladderAt(trace, index, code)
  return (
    <Terminal title="which way?" label={ladder ? `line ${ladder.head}` : undefined} className="viz-branch">
      {!ladder ? (
        <p className="mem-empty">{'> step to an if (or a match) to see which way Python goes'}</p>
      ) : (
        <ol className="branch-list" key={`${index}`}>
          {ladder.clauses.map((c) => (
            <li key={c.line} className={`branch-row ${c.state}`}>
              <span className="branch-mark" aria-hidden>
                {MARK[c.state]}
              </span>
              <code className="branch-code">{c.text}</code>
              <span className="branch-says">
                {c.kind === 'else' ? (c.state === 'taken' ? 'every test was False: runs' : 'skipped') : c.kind === 'case' ? (c.state === 'taken' ? 'matches: runs' : c.state === 'no' ? 'no match' : 'not checked') : SAYS[c.state]}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Terminal>
  )
}

/** Loop panel: round counter, the loop variable each round, test results and break/continue. */
export function LoopPanel({ trace, index, code }: { trace: TraceStep[]; index: number; code: string[] }) {
  const run = loopRunAt(trace, index, code)
  if (!run) {
    return (
      <Terminal title="loop" className="viz-loop">
        <p className="mem-empty">{'> step to a loop to count its rounds'}</p>
      </Terminal>
    )
  }
  const header = (code[run.line - 1] ?? '').trim()
  const status = run.done
    ? run.broke
      ? `stopped by break in round ${run.current}`
      : `done after ${run.rounds.length} round${run.rounds.length === 1 ? '' : 's'}`
    : `round ${run.current}`
  return (
    <Terminal title="loop" label={`line ${run.line}`} className="viz-loop">
      <p className="loop-head">
        <code>{header}</code>
        <span className={`loop-status${run.done ? ' done' : ''}`}>{status}</span>
      </p>
      {run.rounds.length === 0 ? (
        <p className="mem-empty">{run.stmt === 'while' ? '> the test was False at the start, so the body never ran' : '> nothing to loop over'}</p>
      ) : (
        <ol className="loop-rounds">
          {run.rounds.map((r) => (
            <li key={r.n} className={`loop-round${!run.done && r.n === run.current ? ' now' : ''}${r.jump ? ` ${r.jump}` : ''}`}>
              <span className="loop-n">{r.n}</span>
              {r.value && <code className="loop-val">{r.value.repr}</code>}
              {run.stmt === 'while' && <span className="loop-test">True</span>}
              {r.jump && <span className="loop-jump">{r.jump}</span>}
            </li>
          ))}
          {run.done && !run.broke && (
            <li className="loop-round end">
              <span className="loop-n">end</span>
              <span className="loop-test">{run.stmt === 'while' ? 'False' : 'no more items'}</span>
            </li>
          )}
        </ol>
      )}
    </Terminal>
  )
}

/** Trace table: one row per loop round, one column per variable, values at the end of the round. */
export function TraceTablePanel({ trace, index, code, focus }: { trace: TraceStep[]; index: number; code: string[]; focus?: string[] }) {
  const run = loopRunAt(trace, index, code)
  if (!run || run.rounds.length === 0) {
    return (
      <Terminal title="trace table" className="viz-tracetable">
        <p className="mem-empty">{'> the table fills in one row per round of the loop'}</p>
      </Terminal>
    )
  }
  const lv = run.stmt === 'for' ? loopVar(code, run.line) : null
  const rows = run.rounds.map((r) => {
    const s = trace[r.end]
    return { n: r.n, vals: { ...s.vars, ...(s.locals ?? {}) } as Record<string, VarValue> }
  })
  let cols = focus?.length ? focus : []
  if (!cols.length) {
    const names = new Set<string>()
    for (const row of rows) for (const [k, v] of Object.entries(row.vals)) if (!['function', 'module', 'type'].includes(v.type)) names.add(k)
    cols = [...names].filter((k) => k === lv || new Set(rows.map((row) => row.vals[k]?.repr)).size > 1)
    if (lv) cols = [lv, ...cols.filter((c) => c !== lv)]
  }
  return (
    <Terminal title="trace table" label="values at the end of each round" className="viz-tracetable">
      <div className="tt-wrap">
        <table className="ttable">
          <thead>
            <tr>
              <th>round</th>
              {cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, k) => (
              <tr key={row.n} className={!run.done && k === rows.length - 1 ? 'now' : ''}>
                <td>{row.n}</td>
                {cols.map((c) => (
                  <td key={c}>
                    <code>{row.vals[c]?.repr ?? ''}</code>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Terminal>
  )
}

/** Nested loops as a grid: each inner round lights a cell in its outer round's row. */
export function GridPanel({ trace, index, code }: { trace: TraceStep[]; index: number; code: string[] }) {
  const grid = gridAt(trace, index, code)
  return (
    <Terminal title="grid" label="outer loop rows, inner loop columns" className="viz-grid">
      {!grid ? (
        <p className="mem-empty">{'> step into the inner loop to light up the grid'}</p>
      ) : (
        <table className="lgrid">
          <thead>
            <tr>
              <th />
              {grid.colLabels.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rowLabels.map((r, row) => (
              <tr key={row}>
                <th>{r}</th>
                {grid.colLabels.map((_, col) => {
                  const cell = grid.cells.find((c) => c.row === row && c.col === col)
                  return <td key={col} className={cell ? (cell.current ? 'now' : 'seen') : ''} />
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Terminal>
  )
}
