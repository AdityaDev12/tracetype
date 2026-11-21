import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { CodeLine } from '../../components/CodeLine.tsx'
import { RichText } from '../../components/RichText.tsx'
import { AnnotationLayer, type Anno } from '../../design/Annotations.tsx'
import { Terminal } from '../../design/Terminal.tsx'
import { lastRunOf, viewAt } from '../../engine/trace.ts'
import type { Example } from '../../engine/types.ts'
import { useLesson } from '../LessonContext.tsx'
import { ItemPager, StepLayout, StepTitle } from '../common.tsx'
import { Visual } from '../Visual.tsx'
import { KnobBar } from '../visuals/Knobs.tsx'
import { useKnobs } from '../visuals/knobs.ts'
import { Timeline } from '../visuals/Timeline.tsx'

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
  const { lesson } = useLesson()
  const original = useMemo(() => example.lines.map((l) => l.code), [example])
  const run = useKnobs(original, example.knobs, { trace: example.gen.trace }, example)
  const trace = run.trace
  const [rawStep, setStep] = useState(-1)
  const last = trace.length - 1
  const step = Math.min(rawStep, last)
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
  if (!run.changed && (line?.note || line?.circle)) {
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
                    <button
                      type="button"
                      className="tgutter tgutter-btn"
                      title={`jump to the last time line ${i + 1} ran`}
                      onClick={() => {
                        const at = lastRunOf(trace, i + 1)
                        if (at >= 0) setStep(at)
                      }}
                    >
                      {i + 1}
                    </button>
                    <span className="ttext">
                      <LineText code={run.lines[i]} circle={run.changed ? undefined : l.circle} active={view.line === i + 1} />
                    </span>
                  </div>
                ))}
              </div>
            </Terminal>
          </AnnotationLayer>
          <KnobBar knobs={example.knobs} run={run} />
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
                {run.changed && <p className="box-label">{'> you changed the code: the notes describe the original values'}</p>}
              </>
            )}
          </div>
          <div className="step-controls">
            <button className="tt-btn bracket" onClick={() => setStep((s) => Math.max(s - 1, -1))} disabled={step < 0}>
              ← back
            </button>
            <Timeline trace={trace} step={step} setStep={setStep} stopped={!!run.error} />
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
      right={
        <Visual
          view={view}
          kinds={example.visuals ?? lesson.visuals}
          file={`example_${n}.py`}
          trace={trace}
          error={run.error}
          stdin={example.stdin}
          focus={example.focus}
          lineCount={example.lines.length}
        />
      }
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
