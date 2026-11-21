import { useEffect, useMemo, useState } from 'react'
import { InlineText } from '../../components/RichText.tsx'
import { gradeTypedOutput } from '../../engine/grade.ts'
import { linesRun, viewAt } from '../../engine/trace.ts'
import { useLesson } from '../LessonContext.tsx'
import { CodeBlock, ItemPager, NextButton, StepLayout, StepTitle } from '../common.tsx'
import { shuffledOrder } from '../shuffle.ts'
import { Visual } from '../Visual.tsx'
import { KnobBar } from '../visuals/Knobs.tsx'
import { useKnobs } from '../visuals/knobs.ts'
import { Timeline } from '../visuals/Timeline.tsx'

const STEP_MS = 750

/** Predict, then Run: guess the output, then watch the code run line by line. */
export function PredictStep({
  item,
  setItem,
  onDone,
  onResult,
}: {
  item: number
  setItem: (n: number) => void
  onDone: () => void
  /** Reports whether the guess was right (used by reviews). */
  onResult?: (right: boolean) => void
}) {
  const { lesson, react } = useLesson()
  const items = lesson.predict
  const p = items[item]
  const [solved, setSolved] = useState<boolean[]>(() => items.map(() => false))
  const [guess, setGuess] = useState<{ value: string; right: boolean } | null>(null)
  const [typed, setTyped] = useState('')
  const [step, setStep] = useState(-1)
  // Playback runs once after a guess; then the learner scrubs the timeline.
  const [playFlag, setPlaying] = useState(false)
  const playing = playFlag && step < p.gen.trace.length - 1

  const running = guess !== null && playing

  // After a guess, play the run one line at a time.
  useEffect(() => {
    if (!guess || !playing) return
    const t = window.setTimeout(() => setStep((s) => s + 1), step < 0 ? 250 : STEP_MS)
    return () => window.clearTimeout(t)
  }, [guess, step, p, playing])

  const answer = (value: string, right: boolean) => {
    if (guess) return
    setGuess({ value, right })
    onResult?.(right)
    setStep(-1)
    setPlaying(true)
    react(right ? 'hop' : 'tilt')
    setSolved((s) => s.map((x, i) => (i === item ? true : x)))
  }

  const next = () => {
    if (item + 1 < items.length) {
      setItem(item + 1)
      setGuess(null)
      setTyped('')
      setStep(-1)
      setPlaying(false)
    } else onDone()
  }

  const original = useMemo(() => p.code, [p])
  const knobs = useKnobs(original, guess && !playing ? p.knobs : undefined, { trace: p.gen.trace, error: p.gen.error }, p)
  const trace = knobs.trace
  const shown = Math.min(step, trace.length - 1)
  const view = viewAt(trace, shown)
  const output = p.gen.output
  const atEnd = guess !== null && !playing && shown >= trace.length - 1
  const ran = linesRun(trace)
  const neverRan = atEnd && knobs.error ? (n: number) => n > (knobs.error?.line ?? 0) && !ran.has(n) : undefined

  return (
    <StepLayout
      left={
        <div className="step-body">
          <StepTitle kicker="> predict, then run" title={p.q ?? 'What does this print?'} />
          <ItemPager index={item} count={items.length} solved={solved} />
          <CodeBlock
            title={`predict_${item + 1}${'.py'}`}
            lines={knobs.lines}
            active={guess ? view.line : null}
            errorLine={atEnd ? knobs.error?.line ?? null : null}
            neverRan={neverRan}
          />
          {guess && !playing && (
            <>
              <Timeline trace={trace} step={shown} setStep={setStep} stopped={!!knobs.error} />
              <KnobBar knobs={p.knobs} run={knobs} />
            </>
          )}
          {p.kind === 'choice' ? (
            <div className="choices" role="group" aria-label="Your prediction">
              {shuffledOrder(p.options!.length, `${lesson.id}:${p.id}`).map((i, shown) => {
                const o = p.options![i]
                const isAnswer = i === p.gen.answer
                const cls = guess ? (isAnswer ? ' right' : o === guess.value ? ' wrong' : ' faded') : ''
                return (
                  <button key={i} className={`choice${cls}`} disabled={guess !== null} onClick={() => answer(o, isAnswer)}>
                    <span className="choice-key">{shown + 1}</span>
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
      right={
        guess ? (
          <Visual
            view={view}
            kinds={p.visuals ?? lesson.visuals}
            file={`predict_${item + 1}.py`}
            trace={trace}
            error={knobs.error}
            stdin={p.stdin}
            focus={p.focus}
            lineCount={p.code.length}
          />
        ) : (
          <div className="visual-placeholder">{'> make a guess, then watch it run'}</div>
        )
      }
    />
  )
}
