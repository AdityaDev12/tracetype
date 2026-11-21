import { useEffect, useState } from 'react'
import type { Lesson, QuizQuestion } from '../engine/types.ts'
import { InlineText } from './RichText.tsx'

interface Props {
  lesson: Lesson
  onComplete: (score: number, total: number) => void
  onBack: () => void
}

interface Shuffled {
  q: QuizQuestion
  /** Option indexes in display order. */
  order: number[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function prepare(quiz: QuizQuestion[]): Shuffled[] {
  return quiz.map((q) => ({ q, order: shuffle(q.options.map((_, i) => i)) }))
}

export function QuizView({ lesson, onComplete, onBack }: Props) {
  const [items, setItems] = useState(() => prepare(lesson.quiz))
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const item = items[index]
  const total = items.length

  const choose = (optionIndex: number) => {
    if (picked !== null) return
    setPicked(optionIndex)
    if (optionIndex === item.q.answer) setScore((s) => s + 1)
  }

  const next = () => {
    if (picked === null) return
    if (index + 1 < total) {
      setIndex(index + 1)
      setPicked(null)
    } else {
      setFinished(true)
      onComplete(score, total)
    }
  }

  const restart = () => {
    setItems(prepare(lesson.quiz))
    setIndex(0)
    setPicked(null)
    setScore(0)
    setFinished(false)
  }

  // Number keys pick an option, Enter goes on.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= item.order.length) choose(item.order[n - 1])
      else if (e.key === 'Enter' && picked !== null) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (finished) {
    const perfect = score === total
    return (
      <div className="quiz">
        <div className="card complete-card">
          <h3>{perfect ? 'Perfect score!' : 'Quiz done'}</h3>
          <p className="quiz-score">
            {score} / {total}
          </p>
          <p className="muted">{perfect ? 'You got every question right.' : 'Read the explanations and try again any time.'}</p>
          <div className="row">
            <button className="btn" onClick={restart}>
              Try again
            </button>
            <button className="btn primary" onClick={onBack}>
              Back to lessons
            </button>
          </div>
        </div>
      </div>
    )
  }

  const correct = picked !== null && picked === item.q.answer
  return (
    <div className="quiz">
      <div className="quiz-progress">
        Question {index + 1} of {total}
        <span className="muted"> · score {score}</span>
      </div>
      <div className="card quiz-card">
        <p className="quiz-q">
          <InlineText text={item.q.q} />
        </p>
        <div className="quiz-options">
          {item.order.map((oi, pos) => {
            let cls = 'quiz-option'
            if (picked !== null) {
              if (oi === item.q.answer) cls += ' right'
              else if (oi === picked) cls += ' wrong'
              else cls += ' faded'
            }
            return (
              <button key={oi} className={cls} onClick={() => choose(oi)} disabled={picked !== null}>
                <span className="opt-key">{pos + 1}</span>
                <span className="opt-text">
                  <InlineText text={item.q.options[oi]} />
                </span>
              </button>
            )
          })}
        </div>
        {picked !== null && (
          <div className={`quiz-why ${correct ? 'right' : 'wrong'}`} role="status">
            <strong>{correct ? 'Correct.' : 'Not quite.'}</strong> <InlineText text={item.q.why} />
          </div>
        )}
        {picked !== null && (
          <div className="row end">
            <button className="btn primary" onClick={next}>
              {index + 1 < total ? 'Next question →' : 'See score'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
