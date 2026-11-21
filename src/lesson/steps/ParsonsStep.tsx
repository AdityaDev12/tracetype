import { useState } from 'react'
import { CodeLine } from '../../components/CodeLine.tsx'
import { Terminal } from '../../design/Terminal.tsx'
import { rng } from '../../design/sketch.ts'
import { fallbackParsons, gradeByResult, sourceOf } from '../../engine/grade.ts'
import { INDENT } from '../../engine/typing.ts'
import { RunnerNotice, VerdictBox } from '../Feedback.tsx'
import { ItemPager, NextButton, StepLayout, StepTitle } from '../common.tsx'
import { useLesson } from '../LessonContext.tsx'
import { useCheck } from '../useCheck.ts'

interface Row {
  key: number
  text: string
  indent: number
}

/** Shuffle with a fixed seed, never leaving the lines in their original order. */
function shuffled(lines: string[], seed: number, keepIndent: boolean): Row[] {
  const rows = lines.map((l, key) => ({ key, text: keepIndent ? l : l.trimStart(), indent: 0 }))
  const r = rng(seed)
  for (let attempt = 0; attempt < 20; attempt++) {
    for (let i = rows.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1))
      ;[rows[i], rows[j]] = [rows[j], rows[i]]
    }
    if (rows.some((row, i) => row.key !== i)) break
  }
  return rows
}

/** Parsons: put shuffled lines in order (and indent them, where it matters). */
export function ParsonsStep({ item, setItem, onDone }: { item: number; setItem: (n: number) => void; onDone: () => void }) {
  const { lesson } = useLesson()
  const items = lesson.parsons
  const [solved, setSolved] = useState<boolean[]>(() => items.map(() => false))
  const p = items[item]
  return (
    <ParsonsItemView
      key={p.id}
      index={item}
      solvedList={solved}
      onSolved={() => setSolved((s) => s.map((x, i) => (i === item ? true : x)))}
      onNext={() => (item + 1 < items.length ? setItem(item + 1) : onDone())}
    />
  )
}

function ParsonsItemView({ index, solvedList, onSolved, onNext }: { index: number; solvedList: boolean[]; onSolved: () => void; onNext: () => void }) {
  const { lesson } = useLesson()
  const p = lesson.parsons[index]
  const indentMatters = Boolean(p.indent)
  const [rows, setRows] = useState<Row[]>(() => shuffled(p.lines, index + 7, !indentMatters))
  const [dragging, setDragging] = useState<number | null>(null)
  const { ctx, tries, verdict, busy, check, showAnswer, canShow } = useCheck(p.id, onSolved)

  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || tries.solved) return
    setRows((r) => {
      const next = [...r]
      const [row] = next.splice(from, 1)
      next.splice(to, 0, row)
      return next
    })
  }
  const shift = (i: number, d: number) =>
    setRows((r) => r.map((row, k) => (k === i ? { ...row, indent: Math.max(0, Math.min(4, row.indent + d)) } : row)))

  const lines = () => rows.map((row) => INDENT.repeat(row.indent) + row.text)
  const submit = () =>
    check((runner) =>
      runner ? gradeByResult(runner, sourceOf(lines()), p.gen.expected) : fallbackParsons(lines(), p.lines),
    )
  const reveal = () => {
    setRows(p.lines.map((l, key) => ({ key, text: l.trimStart(), indent: (l.length - l.trimStart().length) / 4 })))
    showAnswer()
  }

  return (
    <StepLayout
      left={
        <div className="step-body">
          <StepTitle kicker="> parsons: put the lines in order" title={p.prompt.split('\n')[0]} />
          {p.prompt.includes('\n') && <pre className="prompt-pre">{p.prompt.split('\n').slice(1).join('\n')}</pre>}
          <ItemPager index={index} count={lesson.parsons.length} solved={solvedList} />
          <p className="box-label">drag a line, or use the arrow buttons{indentMatters ? ', and indent with ⇥' : ''}</p>
          <Terminal title={`parsons_${index + 1}.py`}>
            <ol className="parsons" aria-label="Lines of code, in your order">
              {rows.map((row, i) => (
                <li
                  key={row.key}
                  className={`parsons-row${dragging === i ? ' dragging' : ''}`}
                  draggable={!tries.solved}
                  onDragStart={() => setDragging(i)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (dragging !== null && dragging !== i) {
                      move(dragging, i)
                      setDragging(i)
                    }
                  }}
                  onDragEnd={() => setDragging(null)}
                >
                  <span className="tgutter">{i + 1}</span>
                  <span className="parsons-code" style={{ paddingLeft: `${row.indent * 4}ch` }}>
                    <CodeLine code={row.text} />
                  </span>
                  {!tries.solved && (
                    <span className="parsons-tools">
                      {indentMatters && (
                        <>
                          <button className="tt-icon small" aria-label={`Unindent line ${i + 1}`} onClick={() => shift(i, -1)}>
                            ⇤
                          </button>
                          <button className="tt-icon small" aria-label={`Indent line ${i + 1}`} onClick={() => shift(i, 1)}>
                            ⇥
                          </button>
                        </>
                      )}
                      <button className="tt-icon small" aria-label={`Move line ${i + 1} up`} onClick={() => move(i, i - 1)} disabled={i === 0}>
                        ↑
                      </button>
                      <button
                        className="tt-icon small"
                        aria-label={`Move line ${i + 1} down`}
                        onClick={() => move(i, i + 1)}
                        disabled={i === rows.length - 1}
                      >
                        ↓
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </Terminal>
          <RunnerNotice status={ctx.status} failure={ctx.failure} onRetry={ctx.retryRunner} />
          <VerdictBox verdict={verdict} pack={ctx.pack} />
          <div className="row-gap">
            {!tries.solved && (
              <button className="tt-btn primary" onClick={() => void submit()} disabled={busy || ctx.status === 'loading'}>
                {busy ? 'running...' : 'Check'}
              </button>
            )}
            {canShow && (
              <button className="tt-btn bracket" onClick={reveal}>
                show answer
              </button>
            )}
            <NextButton show={tries.solved} last={index + 1 >= lesson.parsons.length} onNext={onNext} />
          </div>
        </div>
      }
    />
  )
}
