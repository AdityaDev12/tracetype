import { useEffect, useRef, useState } from 'react'
import { viewAt } from '../engine/trace.ts'
import { BOOK_TITLES, type Lesson } from '../engine/types.ts'
import { VisualPanel } from '../visuals/VisualPanel.tsx'
import { CodeLine } from './CodeLine.tsx'
import { LessonLayout } from './LessonLayout.tsx'
import { RichText } from './RichText.tsx'

interface Props {
  lesson: Lesson
  onComplete: () => void
  onNextMode: () => void
}

export function LearnView({ lesson, onComplete, onNextMode }: Props) {
  // -1 means nothing has run yet. Step i means trace[i] has just run.
  const [step, setStep] = useState(-1)
  const last = lesson.trace.length - 1
  const view = viewAt(lesson.trace, step)
  const reportedDone = useRef(false)

  useEffect(() => {
    if (step === last && !reportedDone.current) {
      reportedDone.current = true
      onComplete()
    }
  }, [step, last, onComplete])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea')) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setStep((s) => Math.min(s + 1, last))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setStep((s) => Math.max(s - 1, -1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  const lineNo = view.line
  const explain = lineNo ? lesson.lines[lineNo - 1]?.explain : null

  const left = (
    <>
      <details className="intro card" open={step === -1}>
        <summary>About this lesson</summary>
        <RichText text={lesson.intro} className="prose" />
        {lesson.bookRefs.length > 0 && (
          <div className="book-refs">
            <span className="muted">Read more:</span>
            <ul>
              {lesson.bookRefs.map((r) => (
                <li key={r.book + r.chapter}>
                  <em>{BOOK_TITLES[r.book]}</em>, {r.chapter}
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>

      <div className="editor" role="region" aria-label="Lesson code">
        {lesson.lines.map((l, i) => {
          const n = i + 1
          const cls = n === lineNo ? 'code-row current' : 'code-row'
          return (
            <div className={cls} key={i}>
              <span className="gutter">{n}</span>
              <span className="code-text">
                <CodeLine code={l.code} />
              </span>
            </div>
          )
        })}
      </div>

      <div className="explain card" aria-live="polite">
        {step === -1 ? (
          <p className="explain-hint">
            Press <kbd>Next</kbd> or the <kbd>→</kbd> key to run the first line. Watch the panel change.
          </p>
        ) : (
          <>
            <div className="explain-meta">
              Step {step + 1} of {lesson.trace.length} · ran line {lineNo}
            </div>
            {explain && <RichText text={explain} className="prose" />}
          </>
        )}
      </div>

      <div className="step-controls">
        <button className="btn" onClick={() => setStep((s) => Math.max(s - 1, -1))} disabled={step === -1}>
          ← Back
        </button>
        <div className="step-dots" aria-hidden>
          {lesson.trace.map((_, i) => (
            <span key={i} className={i <= step ? 'dot on' : 'dot'} />
          ))}
        </div>
        {step < last ? (
          <button className="btn primary" onClick={() => setStep((s) => Math.min(s + 1, last))}>
            Next →
          </button>
        ) : (
          <button className="btn primary" onClick={onNextMode}>
            Start Trace →
          </button>
        )}
      </div>
    </>
  )

  return <LessonLayout left={left} right={<VisualPanel kind={lesson.visual} view={view} />} />
}
