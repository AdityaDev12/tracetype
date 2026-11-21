import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { charKinds } from '../engine/highlight.ts'
import { stepForSourceLine, viewAt } from '../engine/trace.ts'
import type { Lesson } from '../engine/types.ts'
import {
  accuracy,
  backspace,
  createTyping,
  submit,
  typeTab,
  typeText,
  wpm,
  type TypingState,
} from '../engine/typing.ts'
import { VisualPanel } from '../visuals/VisualPanel.tsx'
import { CodeLine } from './CodeLine.tsx'
import { LessonLayout } from './LessonLayout.tsx'
import { InlineText, RichText } from './RichText.tsx'
import { StatsBar } from './StatsBar.tsx'

export interface TypingResult {
  wpm: number
  accuracy: number
  peeks: number
}

interface Props {
  lesson: Lesson
  variant: 'trace' | 'recall'
  onComplete: (r: TypingResult) => void
  onNextMode: () => void
  nextLabel: string
}

const PEEK_MS = 1500

/** The line being typed in Trace mode: typed chars over faded ghost text. */
function GhostLine({ target, typed, focused }: { target: string; typed: string; focused: boolean }) {
  const kinds = useMemo(() => charKinds(target), [target])
  const len = Math.max(target.length, typed.length)
  const cells = []
  for (let i = 0; i <= len; i++) {
    const caret = i === typed.length && focused ? ' caret' : ''
    if (i === len) {
      cells.push(<span key={i} className={`ch end${caret}`}>{' '}</span>)
      break
    }
    if (i < typed.length) {
      const ok = typed[i] === target[i]
      const shown = typed[i] === ' ' && !ok ? '·' : typed[i]
      cells.push(
        <span key={i} className={ok ? `ch tok-${kinds[i]}` : 'ch wrong'}>
          {shown}
        </span>,
      )
    } else {
      cells.push(
        <span key={i} className={`ch ghost${caret}`}>
          {target[i]}
        </span>,
      )
    }
  }
  return <>{cells}</>
}

/** The line being typed in Recall mode: plain text, no hints. */
function RecallLine({ typed, focused, peek }: { typed: string; focused: boolean; peek: string | null }) {
  return (
    <span className="recall-line">
      <span className="recall-typed">
        {typed}
        <span className={`ch end${focused ? ' caret' : ''}`}>{' '}</span>
      </span>
      {peek !== null && (
        <span className="peek-overlay" aria-label="Peek">
          <CodeLine code={peek} />
        </span>
      )}
    </span>
  )
}

export function TypingView({ lesson, variant, onComplete, onNextMode, nextLabel }: Props) {
  const targets = useMemo(() => lesson.lines.map((l) => l.code), [lesson])
  const isRecall = variant === 'recall'
  const [state, setState] = useState<TypingState>(() => createTyping(targets, isRecall ? 'loose' : 'exact'))
  const [error, setError] = useState<{ message: string; n: number } | null>(null)
  const [peeks, setPeeks] = useState(0)
  const [peeking, setPeeking] = useState(false)
  const [focused, setFocused] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const currentRowRef = useRef<HTMLDivElement>(null)
  const reported = useRef(false)

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

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  const restart = () => {
    setState(createTyping(targets, isRecall ? 'loose' : 'exact'))
    setPeeks(0)
    setPeeking(false)
    setError(null)
    reported.current = false
    inputRef.current?.focus()
  }

  const doPeek = () => {
    if (state.done || peeking) return
    setPeeks((p) => p + 1)
    setPeeking(true)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return
    const t = Date.now()
    if (e.key === 'Enter') {
      e.preventDefault()
      const r = submit(state, t)
      setState(r.state)
      setNow(t)
      setError(r.ok ? null : { message: r.message, n: (error?.n ?? 0) + 1 })
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      setState((s) => backspace(s))
    } else if (e.key === 'Tab') {
      e.preventDefault()
      setState((s) => typeTab(s, t))
    }
  }

  const onInput = (e: FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    const text = el.value
    el.value = ''
    if (!text) return
    const t = Date.now()
    setState((s) => typeText(s, text, t))
  }

  const completedLines = state.done ? targets.length : state.lineIndex
  const view = viewAt(lesson.trace, stepForSourceLine(lesson.trace, completedLines))
  const current = lesson.lines[state.lineIndex]

  const left = (
    <>
      <div
        className={`editor typing${error ? ' has-error' : ''}`}
        onClick={() => inputRef.current?.focus()}
        role="region"
        aria-label={isRecall ? 'Write the code from memory' : 'Type over the code'}
      >
        <textarea
          ref={inputRef}
          className="hidden-input"
          aria-label="Type here"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onKeyDown={onKeyDown}
          onInput={onInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {lesson.lines.map((l, i) => {
          const n = i + 1
          const isDone = i < state.lineIndex || state.done
          const isCurrent = i === state.lineIndex && !state.done
          let content
          if (isDone) {
            content = <CodeLine code={l.code} />
          } else if (isCurrent) {
            content = isRecall ? (
              <RecallLine typed={state.typed} focused={focused} peek={peeking ? l.code : null} />
            ) : (
              <GhostLine target={l.code} typed={state.typed} focused={focused} />
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
        {!focused && !state.done && <div className="focus-hint">Click here to start typing</div>}
      </div>

      {error && !state.done && (
        <div className="submit-error" role="alert">
          {error.message}
        </div>
      )}

      <StatsBar
        wpm={wpm(state, now)}
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
                <button className="btn small" onClick={doPeek} disabled={peeking}>
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
                Type the faded code. Enter moves to the next line. Tab adds 4 spaces.
              </p>
            </>
          )}
        </div>
      )}
    </>
  )

  return <LessonLayout left={left} right={<VisualPanel kind={lesson.visual} view={view} />} />
}
