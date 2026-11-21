import { useEffect, useState } from 'react'
import { InlineText } from '../../components/RichText.tsx'
import { gradeTypedOutput } from '../../engine/grade.ts'
import { viewAt } from '../../engine/trace.ts'
import { useLesson } from '../LessonContext.tsx'
import { CodeBlock, ItemPager, NextButton, StepLayout, StepTitle } from '../common.tsx'
import { Visual } from '../Visual.tsx'

const STEP_MS = 750

/** Predict, then Run: guess the output, then watch the code run line by line. */
export function PredictStep({ item, setItem, onDone }: { item: number; setItem: (n: number) => void; onDone: () => void }) {
  const { lesson, react } = useLesson()
  const items = lesson.predict
  const p = items[item]
  const [solved, setSolved] = useState<boolean[]>(() => items.map(() => false))
  const [guess, setGuess] = useState<{ value: string; right: boolean } | null>(null)
  const [typed, setTyped] = useState('')
  const [step, setStep] = useState(-1)

  const running = guess !== null && step < p.gen.trace.length - 1

  // After a guess, play the run one line at a time.
  useEffect(() => {
    if (!guess) return
    if (step >= p.gen.trace.length - 1) return
    const t = window.setTimeout(() => setStep((s) => s + 1), step < 0 ? 250 : STEP_MS)
    return () => window.clearTimeout(t)
  }, [guess, step, p])

  const answer = (value: string, right: boolean) => {
    if (guess) return
    setGuess({ value, right })
    setStep(-1)
    react(right ? 'hop' : 'tilt')
    setSolved((s) => s.map((x, i) => (i === item ? true : x)))
  }

  const next = () => {
    if (item + 1 < items.length) {
      setItem(item + 1)
      setGuess(null)
      setTyped('')
      setStep(-1)
    } else onDone()
  }

  const view = viewAt(p.gen.trace, step)
  const output = p.gen.output

  return (
    <StepLayout
      left={
        <div className="step-body">
          <StepTitle kicker="> predict, then run" title={p.q ?? 'What does this print?'} />
          <ItemPager index={item} count={items.length} solved={solved} />
          <CodeBlock title={`predict_${item + 1}${'.py'}`} lines={p.code} active={guess ? view.line : null} />
          {p.kind === 'choice' ? (
            <div className="choices" role="group" aria-label="Your prediction">
              {p.options!.map((o, i) => {
                const isAnswer = i === p.gen.answer
                const cls = guess ? (isAnswer ? ' right' : o === guess.value ? ' wrong' : ' faded') : ''
                return (
                  <button key={i} className={`choice${cls}`} disabled={guess !== null} onClick={() => answer(o, isAnswer)}>
                    <span className="choice-key">{i + 1}</span>
                    <code className="choice-text">{o}</code>
                  </button>
                )
              })}
            </div>
          ) : (
            <form
              className="typed-answer"
              onSubmit={(e) => {
                e.preventDefault()
                if (typed.trim() !== '') answer(typed, gradeTypedOutput(typed, output).ok)
              }}
            >
              <label className="tt-field">
                <span className="tt-field-label">{'> your prediction (the exact output)'}</span>
                <textarea
                  className="tt-input mono"
                  rows={Math.max(1, output.split('\n').length)}
                  value={typed}
                  disabled={guess !== null}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      e.currentTarget.form?.requestSubmit()
                    }
                  }}
                  autoFocus
                />
              </label>
              {!guess && (
                <button className="tt-btn primary" type="submit" disabled={typed.trim() === ''}>
                  Run it →
                </button>
              )}
            </form>
          )}
          {guess && (
            <div className={`reveal ${guess.right ? 'ok' : 'miss'}`} role="status">
              <p className="reveal-head">
                {guess.right ? '✓ You called it.' : '✗ Not this time, and that is how you learn it.'}
                {!guess.right && p.kind === 'typed' && (
                  <>
                    {' '}
                    It prints <code>{output}</code>.
                  </>
                )}
              </p>
              <p>
                <InlineText text={p.why} />
              </p>
            </div>
          )}
          <div className="row-gap">
            <NextButton show={guess !== null && !running} last={item + 1 >= items.length} onNext={next} />
            {running && <span className="box-label">running line {view.line ?? 1}...</span>}
          </div>
        </div>
      }
      right={guess ? <Visual view={view} file={`predict_${item + 1}.py`} /> : <div className="visual-placeholder">{'> make a guess, then watch it run'}</div>}
    />
  )
}
