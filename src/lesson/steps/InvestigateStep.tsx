import { useState } from 'react'
import { InlineText } from '../../components/RichText.tsx'
import { AnnotationLayer, type Anno } from '../../design/Annotations.tsx'
import { canShowAnswer, giveUp, newAttempts, recordTry, type Attempts } from '../../engine/grade.ts'
import { stepForSourceLine, viewAt } from '../../engine/trace.ts'
import { useLesson } from '../LessonContext.tsx'
import { CodeBlock, ItemPager, NextButton, StepLayout, StepTitle } from '../common.tsx'
import { Visual } from '../Visual.tsx'

/** Investigate: quick questions about specific lines of a worked example. */
export function InvestigateStep({ item, setItem, onDone }: { item: number; setItem: (n: number) => void; onDone: () => void }) {
  const { lesson, react, markWeak } = useLesson()
  const items = lesson.investigate
  const q = items[item]
  const ex = lesson.examples[q.example]
  const [tries, setTries] = useState<Attempts>(newAttempts)
  const [picked, setPicked] = useState<number[]>([])
  const [solved, setSolved] = useState<boolean[]>(() => items.map(() => false))

  const choose = (i: number) => {
    if (tries.solved || picked.includes(i)) return
    const ok = i === q.answer
    setPicked((p) => [...p, i])
    setTries((t) => recordTry(t, ok))
    react(ok ? 'hop' : 'tilt')
    if (ok) setSolved((s) => s.map((x, k) => (k === item ? true : x)))
  }

  const show = () => {
    setTries((t) => giveUp(t))
    setPicked((p) => [...p, q.answer])
    markWeak(q.id)
    setSolved((s) => s.map((x, k) => (k === item ? true : x)))
  }

  const next = () => {
    if (item + 1 < items.length) {
      setItem(item + 1)
      setTries(newAttempts())
      setPicked([])
    } else onDone()
  }

  const annos: Anno[] = q.line
    ? [{ id: `${q.id}-arrow`, target: `inv-${q.line}`, mark: 'underline', color: 'blue', note: 'this line', side: 'right', dx: 34, dy: -24, delay: 60 }]
    : []
  const trace = ex.gen.trace
  const view = viewAt(trace, q.line ? stepForSourceLine(trace, q.line) : trace.length - 1)

  return (
    <StepLayout
      left={
        <div className="step-body">
          <StepTitle kicker="> investigate" title={q.q} />
          <ItemPager index={item} count={items.length} solved={solved} />
          <AnnotationLayer annotations={annos}>
            <CodeBlock title={`example_${q.example + 1}.py`} lines={ex.lines.map((l) => l.code)} active={q.line} annoPrefix="inv" />
          </AnnotationLayer>
          <div className="choices" role="group" aria-label="Answer">
            {q.options.map((o, i) => {
              const done = picked.includes(i)
              const cls = done ? (i === q.answer ? ' right' : ' wrong') : tries.solved ? ' faded' : ''
              return (
                <button key={i} className={`choice${cls}`} disabled={tries.solved || done} onClick={() => choose(i)}>
                  <span className="choice-key">{i + 1}</span>
                  <span className="choice-text">
                    <InlineText text={o} />
                  </span>
                </button>
              )
            })}
          </div>
          {tries.solved && (
            <div className={`reveal ${tries.gaveUp ? 'miss' : 'ok'}`} role="status">
              <p>
                <InlineText text={q.why} />
              </p>
            </div>
          )}
          {!tries.solved && tries.wrong > 0 && <p className="fb-retry">Not that one. Try another, there is no penalty.</p>}
          <div className="row-gap">
            {canShowAnswer(tries) && (
              <button className="tt-btn bracket" onClick={show}>
                show answer
              </button>
            )}
            <NextButton show={tries.solved} last={item + 1 >= items.length} onNext={next} />
          </div>
        </div>
      }
      right={tries.solved ? <Visual view={view} /> : <div className="visual-placeholder">{'> answer first, then memory is shown'}</div>}
    />
  )
}
