import { useContext, useState } from 'react'
import { InlineText } from '../../components/RichText.tsx'
import { gradeTests, runOptions, sourceOf, type RunError, type TraceResult } from '../../engine/grade.ts'
import { viewAt } from '../../engine/trace.ts'
import { CodeEditor } from '../CodeEditor.tsx'
import { ErrorBox, RunnerNotice, VerdictBox } from '../Feedback.tsx'
import { ItemPager, NextButton, StepLayout, StepTitle } from '../common.tsx'
import { canRun, LessonContext, useLesson } from '../LessonContext.tsx'
import { useCheck } from '../useCheck.ts'
import { Visual } from '../Visual.tsx'
import { tasksFor, type CodeTask } from '../tasks.ts'
import { StdinBox } from '../visuals/StdinBox.tsx'
import { stdinLines } from '../visuals/stdin.ts'
import { Timeline } from '../visuals/Timeline.tsx'

const KICKERS = {
  fix: '> fix the bug',
  modify: '> modify the program',
  make: '> make it yourself',
  project: '> mini project',
} as const

export type CodeTaskKind = keyof typeof KICKERS

/** Fix, Modify and Make: write code, run it, and check it against hidden tests. */
export function CodeTaskStep({ kind, item, setItem, onDone }: { kind: 'fix' | 'modify' | 'make'; item: number; setItem: (n: number) => void; onDone: () => void }) {
  const { lesson } = useLesson()
  const tasks = tasksFor(kind, lesson)
  const [solved, setSolved] = useState<boolean[]>(() => tasks.map(() => false))
  const t = tasks[item]
  return (
    <CodeTaskView
      key={t.id}
      kind={kind}
      task={t}
      index={item}
      count={tasks.length}
      solvedList={solved}
      onSolved={() => setSolved((s) => s.map((x, i) => (i === item ? true : x)))}
      onNext={() => (item + 1 < tasks.length ? setItem(item + 1) : onDone())}
    />
  )
}

export function CodeTaskView({
  kind,
  task,
  index,
  count,
  solvedList,
  onSolved,
  onNext,
  file,
  extra,
}: {
  kind: CodeTaskKind
  task: CodeTask
  index: number
  count: number
  solvedList: boolean[]
  onSolved: () => void
  onNext: () => void
  file?: string
  extra?: React.ReactNode
}) {
  const [code, setCode] = useState(() => (task.start.length ? sourceOf(task.start) : '\n'))
  const [resetKey, setResetKey] = useState(0)
  const [hints, setHints] = useState(0)
  const [run, setRun] = useState<TraceResult | null>(null)
  const [runError, setRunError] = useState<RunError | null>(null)
  const [running, setRunning] = useState(false)
  const [runStep, setRunStep] = useState(0)
  const sample = task.tests.find((t) => t.stdin || t.files)
  const [typedIn, setTypedIn] = useState((sample?.stdin ?? []).join('\n'))
  const usesInput = code.includes('input(') || !!sample?.stdin
  const visuals = useContext(LessonContext)?.lesson.visuals
  const { ctx, tries, verdict, busy, check, showAnswer, canShow } = useCheck(task.id, onSolved)
  const fileName = file ?? `${kind}_${index + 1}.py`
  const noRunner = ctx.status === 'failed'

  const doRun = async () => {
    if (!canRun(ctx) || running) return
    setRunning(true)
    try {
      // A plain run uses the first test's files and the typed answers in the box, so input() and open() work.
      const opts = { ...runOptions(sample), ...(usesInput ? { stdin: stdinLines(typedIn) } : {}) }
      const r = await ctx.runner!.trace(code, opts)
      setRun(r)
      setRunStep(r.steps.length - 1)
      setRunError(r.error)
    } catch (e) {
      setRun(null)
      setRunError({ type: 'Timeout', message: `Timeout: ${e instanceof Error ? e.message : String(e)}`, line: null })
    } finally {
      setRunning(false)
    }
  }

  const submit = () =>
    check(async (runner) => {
      if (!runner) return { ok: false, message: 'Python is not available, so this cannot be checked here.' }
      void doRun()
      return gradeTests(runner, code, task.tests)
    })

  const reveal = () => {
    setCode(sourceOf(task.solution))
    setResetKey((k) => k + 1)
    showAnswer()
  }

  const prompt = task.prompt.split('\n')
  const view = run ? viewAt(run.steps, Math.min(runStep, run.steps.length - 1)) : null

  return (
    <StepLayout
      left={
        <div className="step-body">
          <StepTitle kicker={KICKERS[kind]} title={prompt[0]} />
          {prompt.length > 1 && <pre className="prompt-pre">{prompt.slice(1).join('\n')}</pre>}
          {extra}
          <ItemPager index={index} count={count} solved={solvedList} />
          <div className="term editor-term">
            <header className="term-bar">
              <span className="term-block" aria-hidden />
              <span className="term-title">{fileName}</span>
              <span className="term-label">{tries.gaveUp ? 'answer' : 'your code'}</span>
            </header>
            <CodeEditor value={code} onChange={setCode} onSubmit={() => void submit()} resetKey={resetKey} ariaLabel={`Code for ${fileName}`} readOnly={tries.solved} />
          </div>
          {usesInput && !tries.solved && <StdinBox value={typedIn} onChange={setTypedIn} />}
          {run && run.steps.length > 0 && <Timeline trace={run.steps} step={Math.min(runStep, run.steps.length - 1)} setStep={setRunStep} stopped={!!run.error} />}
          <RunnerNotice status={ctx.status} failure={ctx.failure} onRetry={ctx.retryRunner} />
          {runError && !verdict && <ErrorBox error={runError} pack={ctx.pack} />}
          <VerdictBox verdict={verdict} pack={ctx.pack} okText="all checks pass" />
          {tries.gaveUp && <p className="fb-retry">This is one answer that works. It will come back in your reviews soon.</p>}
          {hints > 0 && (
            <ul className="hints">
              {task.hints.slice(0, hints).map((h, i) => (
                <li key={i}>
                  <span className="hint-tag">hint {i + 1}</span> <InlineText text={h} />
                </li>
              ))}
            </ul>
          )}
          <div className="row-gap">
            {!tries.solved && !noRunner && (
              <>
                <button className="tt-btn primary" onClick={() => void submit()} disabled={busy || !canRun(ctx)}>
                  {busy ? 'checking...' : 'Check'}
                </button>
                <button className="tt-btn bracket" onClick={() => void doRun()} disabled={running || !canRun(ctx)}>
                  {running ? 'running...' : 'run'}
                </button>
              </>
            )}
            {!tries.solved && hints < task.hints.length && (
              <button className="tt-btn prompt" onClick={() => setHints((h) => h + 1)}>
                {` hint${task.hints.length > 1 ? ` (${hints + 1}/${task.hints.length})` : ''}`}
              </button>
            )}
            {(canShow || (noRunner && !tries.solved)) && (
              <button className="tt-btn bracket" onClick={reveal}>
                show answer
              </button>
            )}
            <NextButton show={tries.solved} last={index + 1 >= count} onNext={onNext} />
          </div>
          {!tries.solved && <p className="box-label">tip: Ctrl+Enter (Cmd+Enter on a Mac) checks your code</p>}
        </div>
      }
      right={
        view && run ? (
          <Visual
            view={view}
            kinds={visuals}
            file={fileName}
            trace={run.steps}
            error={run.error}
            stdin={usesInput ? stdinLines(typedIn) : undefined}
            lineCount={code.split('\n').length}
          />
        ) : (
          <div className="visual-placeholder">{'> press run to see memory and output'}</div>
        )
      }
    />
  )
}
