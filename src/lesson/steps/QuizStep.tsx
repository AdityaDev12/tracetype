import { useMemo, useState } from 'react'
import { Mascot } from '../../brand/Mascot.tsx'
import { InlineText } from '../../components/RichText.tsx'
import { rng } from '../../design/sketch.ts'
import { canShowAnswer, giveUp, newAttempts, recordTry, type Attempts } from '../../engine/grade.ts'
import { useLesson } from '../LessonContext.tsx'
import { ItemPager, NextButton, StepLayout, StepTitle } from '../common.tsx'

/** Quiz: one question at a time, each with a one-line why. Options are shuffled. */
export function QuizStep({ item, setItem, onDone }: { item: number; setItem: (n: number) => void; onDone: () => void }) {
  const { lesson, react } = useLesson()
  const quiz = lesson.quiz
  const q = quiz[item]
  const order = useMemo(() => {
    const r = rng(item * 31 + 5)
    const o = q.options.map((_, i) => i)
    for (let i = o.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1))
      ;[o[i], o[j]] = [o[j], o[i]]
    }
    return o
  }, [q, item])
  const [tries, setTries] = useState<Attempts>(newAttempts)
  const [picked, setPicked] = useState<number[]>([])
  const [firstTry, setFirstTry] = useState<boolean[]>(() => quiz.map(() => false))
  const [solved, setSolved] = useState<boolean[]>(() => quiz.map(() => false))
  const [finished, setFinished] = useState(false)

  const choose = (oi: number) => {
    if (tries.solved || picked.includes(oi)) return
    const ok = oi === q.answer
    if (ok && tries.wrong === 0) setFirstTry((f) => f.map((x, i) => (i === item ? true : x)))
    setPicked((p) => [...p, oi])
    setTries((t) => recordTry(t, ok))
    react(ok ? 'hop' : 'tilt')
    if (ok) setSolved((s) => s.map((x, i) => (i === item ? true : x)))
  }

  const show = () => {
    setTries((t) => giveUp(t))
    setPicked((p) => [...p, q.answer])
    setSolved((s) => s.map((x, i) => (i === item ? true : x)))
  }

  const next = () => {
    if (item + 1 < quiz.length) {
      setItem(item + 1)
      setTries(newAttempts())
      setPicked([])
    } else setFinished(true)
  }

  if (finished) {
    const score = firstTry.filter(Boolean).length
    return (
      <StepLayout
        left={
          <div className="step-body quiz-done">
            <StepTitle kicker="> quiz done" title={`${score} of ${quiz.length} right on the first try`} />
            <p className="muted">{score === quiz.length ? 'Every one, first time. Nice.' : 'The ones you missed are worth a second look in the common mistakes next.'}</p>
            <Mascot size={44} mood={score === quiz.length ? 'bounce' : 'idle'} />
            <div className="row-gap">
              <button className="tt-btn primary" onClick={onDone} autoFocus>
                Continue →
              </button>
            </div>
          </div>
        }
      />
    )
  }

  return (
    <StepLayout
      left={
        <div className="step-body">
          <StepTitle kicker={`> quiz · question ${item + 1} of ${quiz.length}`} title="" />
          <ItemPager index={item} count={quiz.length} solved={solved} />
          <p className="quiz-q">
            <InlineText text={q.q} />
          </p>
          <div className="choices" role="group" aria-label="Answer">
            {order.map((oi, pos) => {
              const done = picked.includes(oi)
              const cls = done ? (oi === q.answer ? ' right' : ' wrong') : tries.solved ? ' faded' : ''
              return (
                <button key={oi} className={`choice${cls}`} disabled={tries.solved || done} onClick={() => choose(oi)}>
                  <span className="choice-key">{pos + 1}</span>
                  <span className="choice-text">
                    <InlineText text={q.options[oi]} />
                  </span>
                </button>
              )
            })}
          </div>
          {tries.solved && (
            <div className={`reveal ${tries.gaveUp ? 'miss' : 'ok'}`} role="status">
              <p>
                <strong>{tries.gaveUp ? 'The answer is highlighted. ' : tries.wrong === 0 ? '✓ Right. ' : '✓ Got it. '}</strong>
                <InlineText text={q.why} />
              </p>
            </div>
          )}
          {!tries.solved && tries.wrong > 0 && <p className="fb-retry">Not that one. Try another.</p>}
          <div className="row-gap">
            {canShowAnswer(tries) && (
              <button className="tt-btn bracket" onClick={show}>
                show answer
              </button>
            )}
            <NextButton show={tries.solved} last={item + 1 >= quiz.length} onNext={next} label={item + 1 >= quiz.length ? 'See score →' : 'Next →'} />
          </div>
        </div>
      }
    />
  )
}
