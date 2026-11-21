import { useEffect, useState } from 'react'
import { CodeLine } from '../../components/CodeLine.tsx'
import { Terminal } from '../../design/Terminal.tsx'
import { expectedFromTrace, fallbackRecall, gradeRecall, runOptions, sourceOf, type TraceResult } from '../../engine/grade.ts'
import { viewAt } from '../../engine/trace.ts'
import { CodeEditor } from '../CodeEditor.tsx'
import { RunnerNotice, VerdictBox } from '../Feedback.tsx'
import { NextButton, StepLayout, StepTitle } from '../common.tsx'
import { canRun, useLesson } from '../LessonContext.tsx'
import { useCheck } from '../useCheck.ts'
import { Visual } from '../Visual.tsx'
import { Timeline } from '../visuals/Timeline.tsx'

const PEEK_MS = 1500

/**
 * Recall: write a worked example from memory, from its tasks. Accepted if it
 * means the same code (spaces, quotes, extra brackets do not matter) or gives
 * the same output and variables. Then "Run my code" shows the real result.
 */
export function RecallStep({ item, setItem, onDone }: { item: number; setItem: (n: number) => void; onDone: () => void }) {
  const { lesson } = useLesson()
  const r = lesson.recall[item]
  return (
    <RecallView
      key={item}
      exampleIndex={r.example}
      itemId={`recall-${item}`}
      onNext={() => (item + 1 < lesson.recall.length ? setItem(item + 1) : onDone())}
      last={item + 1 >= lesson.recall.length}
    />
  )
}

export function RecallView({ exampleIndex, itemId, onNext, last }: { exampleIndex: number; itemId: string; onNext: () => void; last: boolean }) {
  const { lesson } = useLesson()
  const ex = lesson.examples[exampleIndex]
  const starter = ex.lines.map((l, i) => `# ${i + 1}. ${l.task}\n`).join('')
  const [code, setCode] = useState(starter)
  const [resetKey, setResetKey] = useState(0)
  const [peeks, setPeeks] = useState(0)
  const [peeking, setPeeking] = useState(false)
  const [ran, setRan] = useState<TraceResult | null>(null)
  const [ranStep, setRanStep] = useState(0)
  const { ctx, tries, verdict, busy, check, showAnswer, canShow } = useCheck(itemId, () => {})
  const solution = sourceOf(ex.lines.map((l) => l.code))

  useEffect(() => {
    if (!peeking) return
    const t = window.setTimeout(() => setPeeking(false), PEEK_MS)
    return () => window.clearTimeout(t)
  }, [peeking])

  const submit = () =>
    check((runner) =>
      runner ? gradeRecall(runner, code, solution, expectedFromTrace(ex.gen.trace), runOptions(ex)) : fallbackRecall(code, solution),
    )

  const runMine = async () => {
    if (!canRun(ctx)) return
    try {
      const r = await ctx.runner!.trace(code, runOptions(ex))
      setRan(r)
      setRanStep(r.steps.length - 1)
    } catch {
      setRan(null)
    }
  }

  const reveal = () => {
    setCode(solution)
    setResetKey((k) => k + 1)
    showAnswer()
  }

  const view = ran ? viewAt(ran.steps, Math.min(ranStep, ran.steps.length - 1)) : null

  return (
    <StepLayout
      left={
        <div className="step-body">
          <StepTitle kicker="> recall: write it from memory" title={ex.title} />
          <p className="muted">
            Each comment is one line to write. Write your line under it. Spaces and quote style do not matter.
          </p>
          <div className="term editor-term recall-term">
            <header className="term-bar">
              <span className="term-block" aria-hidden />
              <span className="term-title">recall.py</span>
              <span className="term-label">
                {peeks} {peeks === 1 ? 'peek' : 'peeks'}
              </span>
            </header>
            <CodeEditor value={code} onChange={setCode} onSubmit={() => void submit()} resetKey={resetKey} ariaLabel="Write the example from memory" readOnly={tries.solved} />
            {peeking && (
              <div className="peek-panel" aria-label="Peek at the example">
                {ex.lines.map((l, i) => (
                  <div key={i}>
                    <CodeLine code={l.code} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {ran && ran.steps.length > 0 && <Timeline trace={ran.steps} step={Math.min(ranStep, ran.steps.length - 1)} setStep={setRanStep} stopped={!!ran.error} />}
          <RunnerNotice status={ctx.status} failure={ctx.failure} onRetry={ctx.retryRunner} />
          <VerdictBox verdict={verdict} pack={ctx.pack} okText={verdict?.ok && verdict.how === 'same-code' ? 'same code' : 'correct'} />
          {tries.gaveUp && <p className="fb-retry">Here is the example. It will come back in your reviews soon.</p>}
          <div className="row-gap">
            {!tries.solved && (
              <>
                <button className="tt-btn primary" onClick={() => void submit()} disabled={busy || ctx.status === 'loading'}>
                  {busy ? 'checking...' : 'Check'}
                </button>
                <button
                  className="tt-btn bracket"
                  onClick={() => {
                    setPeeks((p) => p + 1)
                    setPeeking(true)
                  }}
                  disabled={peeking}
                >
                  {peeking ? 'peeking...' : 'peek 1.5s'}
                </button>
              </>
            )}
            {canShow && (
              <button className="tt-btn bracket" onClick={reveal}>
                show answer
              </button>
            )}
            {tries.solved && canRun(ctx) && (
              <button className="tt-btn bracket" onClick={() => void runMine()}>
                run my code
              </button>
            )}
            <NextButton show={tries.solved} last={last} onNext={onNext} />
          </div>
        </div>
      }
      right={
        view ? (
          <Visual
            view={view}
            kinds={ex.visuals ?? lesson.visuals}
            file="recall.py"
            trace={ran!.steps}
            error={ran!.error}
            stdin={ex.stdin}
            focus={ex.focus}
            lineCount={code.split('\n').length}
            code={code.split('\n')}
          />
        ) : (
          <Terminal title="tasks">
            <ol className="task-list">
              {ex.lines.map((l, i) => (
                <li key={i}>{l.task}</li>
              ))}
            </ol>
          </Terminal>
        )
      }
    />
  )
}
