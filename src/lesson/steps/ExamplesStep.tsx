import { lazy, Suspense, useEffect, useState } from 'react'
import { CodeLine } from '../../components/CodeLine.tsx'
import { RichText } from '../../components/RichText.tsx'
import { AnnotationLayer, type Anno } from '../../design/Annotations.tsx'
import { Terminal } from '../../design/Terminal.tsx'
import { viewAt } from '../../engine/trace.ts'
import type { Example } from '../../engine/types.ts'
import { useLesson } from '../LessonContext.tsx'
import { ItemPager, StepLayout, StepTitle } from '../common.tsx'
import { Visual } from '../Visual.tsx'

// The Trace part uses CodeMirror, so it is only downloaded when needed.
const TypingView = lazy(() => import('../../components/TypingView.tsx').then((m) => ({ default: m.TypingView })))

function LineText({ code, circle, active }: { code: string; circle?: string; active: boolean }) {
  if (active && circle) {
    const at = code.indexOf(circle)
    return (
      <>
        <CodeLine code={code.slice(0, at)} />
        <span data-anno="circle">
          <CodeLine code={circle} />
        </span>
        <CodeLine code={code.slice(at + circle.length)} />
      </>
    )
  }
  return (
    <span data-anno={active ? 'line' : undefined}>
      <CodeLine code={code} />
    </span>
  )
}

/** Learn: step through an example and watch memory change, with the tutor's notes. */
function Learn({ example, n, onFinish }: { example: Example; n: number; onFinish: () => void }) {
  const trace = example.gen.trace
  const [step, setStep] = useState(-1)
  const last = trace.length - 1
  const view = viewAt(trace, step)
  const line = view.line ? example.lines[view.line - 1] : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, .cm-editor')) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setStep((s) => Math.min(s + 1, last))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setStep((s) => Math.max(s - 1, -1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last])

  const annos: Anno[] = []
  if (line?.note || line?.circle) {
    annos.push({
      id: `${example.id}-${step}`,
      target: line.circle ? 'circle' : 'line',
      mark: line.circle ? 'circle' : 'underline',
      color: 'blue',
      note: line.note,
      side: 'right',
      dx: 36,
      dy: -30,
      width: 190,
      delay: 80,
    })
  }

  return (
    <StepLayout
      left={
        <div className="step-body">
          <AnnotationLayer annotations={annos}>
            <Terminal title={`example_${n}.py`} label="learn">
              <div className="tcode">
                {example.lines.map((l, i) => (
                  <div key={i} className={`tline${view.line === i + 1 ? ' active' : ''}`}>
                    <span className="tgutter">{i + 1}</span>
                    <span className="ttext">
                      <LineText code={l.code} circle={l.circle} active={view.line === i + 1} />
                    </span>
                  </div>
                ))}
              </div>
            </Terminal>
          </AnnotationLayer>
          <div className="explain-card" aria-live="polite">
            {step < 0 ? (
              <p className="muted">
                Press <kbd>Next</kbd> or <kbd>→</kbd> to run the first line, and watch memory on the right.
              </p>
            ) : (
              <>
                <span className="box-label">
                  step {step + 1} of {trace.length} · ran line {view.line}
                </span>
                {line && <RichText text={line.explain} className="prose" />}
              </>
            )}
          </div>
          <div className="step-controls">
            <button className="tt-btn bracket" onClick={() => setStep((s) => Math.max(s - 1, -1))} disabled={step < 0}>
              ← back
            </button>
            <span className="step-dots" aria-hidden>
              {trace.map((_, i) => (
                <span key={i} className={i <= step ? 'on' : ''} />
              ))}
            </span>
            {step < last ? (
              <button className="tt-btn primary" onClick={() => setStep((s) => s + 1)}>
                Next →
              </button>
            ) : (
              <button className="tt-btn primary" onClick={onFinish} autoFocus>
                Now type it →
              </button>
            )}
          </div>
        </div>
      }
      right={<Visual view={view} file={`example_${n}.py`} />}
    />
  )
}

/** Worked examples: for each one, Learn (step through) then Trace (type over it). */
export function ExamplesStep({ item, setItem, onDone }: { item: number; setItem: (n: number) => void; onDone: () => void }) {
  const { lesson, react } = useLesson()
  const examples = lesson.examples
  const ex = Math.min(Math.floor(item / 2), examples.length - 1)
  const phase = item % 2 === 0 ? 'learn' : 'trace'
  const example = examples[ex]
  const solved = examples.map((_, i) => i < ex)

  const finishTrace = () => {
    react('hop')
    if (ex + 1 < examples.length) setItem((ex + 1) * 2)
    else onDone()
  }

  return (
    <>
      <StepTitle kicker={`> worked example ${ex + 1}: ${phase === 'learn' ? 'step through it' : 'type over it'}`} title={example.title} />
      <ItemPager index={ex} count={examples.length} solved={solved} />
      {phase === 'learn' ? (
        <Learn key={example.id} example={example} n={ex + 1} onFinish={() => setItem(ex * 2 + 1)} />
      ) : (
        <Suspense fallback={<p className="box-label">{'> loading the editor...'}</p>}>
          <TypingView
            key={example.id}
            example={example}
            variant="trace"
            onComplete={() => react('hop')}
            onNextMode={finishTrace}
            nextLabel={ex + 1 < examples.length ? 'Next example →' : 'Continue →'}
          />
        </Suspense>
      )}
    </>
  )
}
