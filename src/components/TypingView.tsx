import type { EditorView } from '@codemirror/view'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { stepForSourceLine, viewAt } from '../engine/trace.ts'
import type { Example } from '../engine/types.ts'
import {
  accuracy,
  autoIndentFor,
  createTyping,
  liveCorrectChars,
  markStarted,
  submitLine,
  wpm,
  type TypingState,
} from '../engine/typing.ts'
import { VisualPanel } from '../visuals/VisualPanel.tsx'
import { CodeLine } from './CodeLine.tsx'
import { LessonLayout } from './LessonLayout.tsx'
import { LineEditor } from './LineEditor.tsx'
import { InlineText, RichText } from './RichText.tsx'
import { StatsBar } from './StatsBar.tsx'

export interface TypingResult {
  wpm: number
  accuracy: number
  peeks: number
}

interface Props {
  example: Example
  variant: 'trace' | 'recall'
  onComplete: (r: TypingResult) => void
  onNextMode: () => void
  nextLabel: string
}

const PEEK_MS = 1500

export function TypingView({ example, variant, onComplete, onNextMode, nextLabel }: Props) {
  const targets = useMemo(() => example.lines.map((l) => l.code), [example])
  const trace = example.gen.trace
  const isRecall = variant === 'recall'
  const match = isRecall ? 'loose' : 'exact'
  const [state, setState] = useState<TypingState>(() => createTyping(targets, match))
  const [live, setLive] = useState(() => ({ text: '', cursor: 0 }))
  const [error, setError] = useState<{ message: string; n: number } | null>(null)
  const [peeks, setPeeks] = useState(0)
  const [peeking, setPeeking] = useState(false)
  const [focused, setFocused] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [attempt, setAttempt] = useState(0)
  const viewRef = useRef<EditorView | null>(null)
  const reported = useRef(false)
  const currentRowRef = useRef<HTMLDivElement>(null)

  // Tick once a second so live WPM moves while typing.
  useEffect(() => {
    if (state.startedAt === null || state.done) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [state.startedAt, state.done])

  useEffect(() => {
    if (!peeking) return
    const id = window.setTimeout(() => setPeeking(false), PEEK_MS)
    return () => window.clearTimeout(id)
  }, [peeking])

  useEffect(() => {
    if (state.done && !reported.current) {
      reported.current = true
      onComplete({ wpm: wpm(state, Date.now()), accuracy: accuracy(state), peeks })
    }
  }, [state, peeks, onComplete])

  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [state.lineIndex])

  const onEnter = useCallback(
    (text: string, cursor: number) => {
      const t = Date.now()
      const r = submitLine(state, text, cursor, t)
      setState(r.state)
      setNow(t)
      setError(r.ok ? null : { message: r.message, n: (error?.n ?? 0) + 1 })
    },
    [state, error],
  )

  const onChange = useCallback((text: string, cursor: number, docChanged: boolean) => {
    setLive({ text, cursor })
    if (docChanged) setState((s) => markStarted(s, Date.now()))
  }, [])

  const restart = () => {
    setState(createTyping(targets, match))
    setLive({ text: '', cursor: 0 })
    setPeeks(0)
    setPeeking(false)
    setError(null)
    setAttempt((a) => a + 1)
    reported.current = false
  }

  const doPeek = () => {
    if (state.done || peeking) return
    setPeeks((p) => p + 1)
    setPeeking(true)
    viewRef.current?.focus()
  }

  const completedLines = state.done ? targets.length : state.lineIndex
  const view = viewAt(trace, stepForSourceLine(trace, completedLines))
  const current = example.lines[state.lineIndex]
  const target = targets[state.lineIndex]
  const liveChars = isRecall || state.done ? 0 : liveCorrectChars(live.text, live.cursor, target)

  const left = (
    <>
      <div
        className={`editor typing${focused ? ' focused' : ''}`}
        onMouseDown={(e) => {
          // Clicking anywhere in the box (not on the line itself) puts the cursor back in the line.
          if (!(e.target as HTMLElement).closest('.line-editor')) {
            e.preventDefault()
            viewRef.current?.focus()
          }
        }}
        role="region"
        aria-label={isRecall ? 'Write the code from memory' : 'Type over the code'}
      >
        {example.lines.map((l, i) => {
          const n = i + 1
          const isDone = i < state.lineIndex || state.done
          const isCurrent = i === state.lineIndex && !state.done
          let content
          if (isDone) {
            content = <CodeLine code={l.code} />
          } else if (isCurrent) {
            content = (
              <span className="current-line-wrap">
                <LineEditor
                  key={`${attempt}:${i}`}
                  initial={autoIndentFor(targets, i)}
                  target={l.code}
                  variant={variant}
                  onEnter={onEnter}
                  onChange={onChange}
                  onFocusChange={setFocused}
                  viewRef={viewRef}
                  ariaLabel={isRecall ? `Line ${n}: ${l.task}` : `Line ${n}`}
                />
                {isRecall && peeking && (
                  <span className="peek-overlay" aria-label="Peek">
                    <CodeLine code={l.code} />
                  </span>
                )}
              </span>
            )
          } else if (isRecall) {
            content = <span className="task-placeholder"># {l.task}</span>
          } else {
            content = <span className="ghost">{l.code || ' '}</span>
          }
          const shake = isCurrent && error ? ` shake-${error.n % 2}` : ''
          return (
            <div
              key={i}
              ref={isCurrent ? currentRowRef : undefined}
              className={`code-row${isCurrent ? ' current' : ''}${isDone ? ' done' : ''}${shake}`}
            >
              <span className="gutter">{isDone ? '✓' : n}</span>
              <span className="code-text">{content}</span>
            </div>
          )
        })}
        {!focused && !state.done && <div className="focus-hint">Click the highlighted line to type</div>}
      </div>

      {error && !state.done && (
        <div className="submit-error" role="alert">
          {error.message}
        </div>
      )}

      <StatsBar
        wpm={wpm(state, now, liveChars)}
        accuracy={accuracy(state)}
        line={Math.min(state.lineIndex + 1, targets.length)}
        total={targets.length}
        peeks={isRecall ? peeks : undefined}
      />

      {state.done ? (
        <div className="card complete-card">
          <h3>{isRecall ? 'You wrote it from memory!' : 'Traced every line!'}</h3>
          <p>
            {wpm(state, now)} WPM · {accuracy(state)}% accuracy
            {isRecall && ` · ${peeks} ${peeks === 1 ? 'peek' : 'peeks'}`}
          </p>
          <div className="row">
            <button className="btn" onClick={restart}>
              Try again
            </button>
            <button className="btn primary" onClick={onNextMode}>
              {nextLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="explain card">
          {isRecall ? (
            <>
              <div className="explain-meta">Task for line {state.lineIndex + 1}</div>
              <p className="task-text">
                <InlineText text={current.task} />
              </p>
              <div className="row">
                <button className="btn small" onMouseDown={(e) => e.preventDefault()} onClick={doPeek} disabled={peeking}>
                  {peeking ? 'Peeking...' : 'Peek (1.5 s)'}
                </button>
                <span className="muted small-text">
                  Spaces and quote style do not matter. Press Enter to check the line.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="explain-meta">Line {state.lineIndex + 1}</div>
              <RichText text={current.explain} className="prose" />
              <p className="muted small-text">
                Type the faded code. Brackets and quotes close themselves. Enter checks the line. Tab adds 4 spaces.
              </p>
            </>
          )}
        </div>
      )}
    </>
  )

  return <LessonLayout left={left} right={<VisualPanel kind="memory" view={view} />} />
}
