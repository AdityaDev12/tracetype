import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import heroDemo from '../../content/demos/hero.json'
import { Mascot, type MascotMood } from '../brand/Mascot.tsx'
import { CodeLine } from '../components/CodeLine.tsx'
import { AnnotationLayer, type Anno } from '../design/Annotations.tsx'
import { MemoryBoxes } from '../design/MemoryBoxes.tsx'
import { Terminal } from '../design/Terminal.tsx'
import { charKinds } from '../engine/highlight.ts'
import { stepForSourceLine, viewAt } from '../engine/trace.ts'
import type { TraceStep } from '../engine/types.ts'
import { compareLine, lineMatches } from '../engine/typing.ts'

// The landing page demo. It types a tiny program by itself, on a loop, while the
// memory and output panels update from a real trace and the tutor marks it up.
// The moment the visitor clicks it or presses a key, it becomes live and they
// type over the ghost code themselves. Light on purpose: no CodeMirror here.

const LINES = heroDemo.lines.map((l) => l.code)
const TRACE = heroDemo.trace as TraceStep[]
/** The part of line 2 the tutor circles. */
const OLD_LINE = 1
const OLD_PART = 'cups + 1'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

type Mode = 'auto' | 'live'

function TypedLine({ target, typed, caret }: { target: string; typed: string; caret: boolean }) {
  const kinds = useMemo(() => charKinds(target), [target])
  const cmp = compareLine(typed, typed.length, target)
  return (
    <>
      {[...typed].map((ch, i) =>
        cmp.ok[i] ? (
          <span key={i} className={`tok-${kinds[i]}`}>
            {ch}
          </span>
        ) : (
          <span key={i} className="twrong">
            {ch === ' ' ? '·' : ch}
          </span>
        ),
      )}
      {caret && <span className="tcaret inline" />}
      <span className="tghost">{target.slice(typed.length)}</span>
    </>
  )
}

function DoneLine({ code, index }: { code: string; index: number }) {
  if (index === OLD_LINE) {
    const at = code.lastIndexOf(OLD_PART)
    return (
      <>
        <CodeLine code={code.slice(0, at)} />
        <span data-anno="hero-old">
          <CodeLine code={OLD_PART} />
        </span>
      </>
    )
  }
  return (
    <span data-anno={index === LINES.length - 1 ? 'hero-last' : undefined}>
      <CodeLine code={code} />
    </span>
  )
}

export function HeroDemo() {
  const [mode, setMode] = useState<Mode>('auto')
  // Lines finished. With reduced motion the demo starts fully typed and stays still.
  const [done, setDone] = useState(() => (reducedMotion() ? LINES.length : 0))
  const [typed, setTyped] = useState('')
  const [loop, setLoop] = useState(0)
  const [mood, setMood] = useState<{ m: MascotMood; k: number }>({ m: 'idle', k: 0 })
  const [shake, setShake] = useState(0)
  const [narrow, setNarrow] = useState(() => window.innerWidth < 760)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const react = (m: MascotMood) => setMood((p) => ({ m, k: p.k + 1 }))

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 760)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Auto-typing loop.
  useEffect(() => {
    if (mode !== 'auto') return
    if (reducedMotion()) return
    let t = 0
    if (done >= LINES.length) {
      t = window.setTimeout(() => {
        setDone(0)
        setTyped('')
        setLoop((l) => l + 1)
      }, 4200)
    } else {
      const target = LINES[done]
      if (typed.length < target.length) {
        const ch = target[typed.length]
        const wait = 45 + Math.random() * 55 + (ch === ' ' ? 40 : 0)
        t = window.setTimeout(() => setTyped(target.slice(0, typed.length + 1)), wait)
      } else {
        t = window.setTimeout(() => {
          setDone((d) => d + 1)
          setTyped('')
          react('hop')
        }, 380)
      }
    }
    return () => window.clearTimeout(t)
  }, [mode, done, typed])

  const goLive = useCallback((firstChar?: string) => {
    setMode('live')
    setDone(0)
    setTyped(firstChar ?? '')
    setLoop((l) => l + 1)
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  /** Enter and Backspace in live mode. Returns true if the key was used. */
  const handleKey = useCallback(
    (key: string): boolean => {
      if (done >= LINES.length) return false
      if (key === 'Enter') {
        if (lineMatches(typed, LINES[done], 'exact')) {
          setDone((d) => d + 1)
          setTyped('')
          react(done + 1 >= LINES.length ? 'bounce' : 'hop')
        } else {
          setShake((n) => n + 1)
          react('tilt')
        }
        return true
      }
      if (key === 'Backspace') {
        setTyped((t) => t.slice(0, -1))
        return true
      }
      return false
    },
    [done, typed],
  )

  const addText = useCallback(
    (text: string) => {
      if (!text || done >= LINES.length) return
      setTyped((t) => (t + text).slice(0, LINES[done].length + 8))
    },
    [done],
  )

  // In live mode, keys pressed while focus is elsewhere on the page still type.
  useEffect(() => {
    if (mode !== 'live') return
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t === inputRef.current || t.closest('input, textarea, button, a')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') {
        e.preventDefault()
        inputRef.current?.focus({ preventScroll: true })
        if (!handleKey(e.key) && e.key.length === 1) addText(e.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, handleKey, addText])

  // Any printable key while the demo is on screen takes it over.
  useEffect(() => {
    if (mode !== 'auto') return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, button, a')) return
      const r = rootRef.current?.getBoundingClientRect()
      if (!r || r.bottom < 0 || r.top > window.innerHeight) return
      e.preventDefault()
      goLive(e.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, goLive])

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mode !== 'live') return
    // Tab is left alone so keyboard users can move on to the buttons.
    if (handleKey(e.key)) e.preventDefault()
  }

  const onInput = (e: FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    const text = el.value.replace(/[\r\n]/g, '')
    el.value = ''
    if (mode === 'live') addText(text)
  }

  const view = viewAt(TRACE, stepForSourceLine(TRACE, done))
  const finishedLive = mode === 'live' && done >= LINES.length

  const annos: Anno[] = []
  if (done > OLD_LINE) {
    annos.push({
      id: `old-${loop}`,
      target: 'hero-old',
      mark: 'circle',
      color: 'blue',
      note: 'reads the old value (2) first, then stores 3',
      side: 'right',
      dx: narrow ? 12 : 44,
      dy: narrow ? -50 : -38,
      width: narrow ? 118 : undefined,
      delay: 120,
    })
  }
  if (finishedLive) {
    annos.push({ id: `win-${loop}`, target: 'hero-last', mark: 'check', color: 'green', delay: 100 })
  }

  return (
    <div ref={rootRef} className={`hero-demo${mode === 'live' ? ' is-live' : ''}`}>
      <AnnotationLayer annotations={annos}>
        <div className="hero-mascot">
          <Mascot size={30} mood={mood.m} moodKey={mood.k} />
        </div>
        <div
          className={`hero-editor${shake > 0 ? ` shake-${shake % 2}` : ''}`}
          onMouseDown={(e) => {
            e.preventDefault()
            if (mode === 'auto') goLive()
            else inputRef.current?.focus({ preventScroll: true })
          }}
        >
          <Terminal title="hello.py" label={mode === 'auto' ? 'demo' : finishedLive ? 'done' : 'your turn'}>
            <textarea
              ref={inputRef}
              className="hidden-input"
              aria-label="Type the code shown in the editor"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              tabIndex={mode === 'live' ? 0 : -1}
              onKeyDown={onKeyDown}
              onInput={onInput}
            />
            <div className="tcode" aria-live="polite">
              {LINES.map((code, i) => {
                const active = i === done
                return (
                  <div key={i} className={`tline${active ? ' active' : ''}`}>
                    <span className="tgutter">{i < done ? '✓' : i + 1}</span>
                    <span className="ttext">
                      {i < done ? (
                        <DoneLine code={code} index={i} />
                      ) : active ? (
                        <TypedLine target={code} typed={typed} caret />
                      ) : (
                        <span className="tghost">{code}</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </Terminal>
        </div>
        <div className="hero-panels">
          <Terminal title="memory" label={view.line ? `after line ${view.line}` : 'empty'}>
            <MemoryBoxes vars={view.vars} />
          </Terminal>
          <Terminal title="output">
            <div className="toutput">
              <span className="prompt">{'$ python hello.py\n'}</span>
              {view.output && (
                <span className="fresh" key={view.output}>
                  {view.output}
                </span>
              )}
            </div>
          </Terminal>
        </div>
      </AnnotationLayer>
      <p className="hero-try" aria-hidden>
        {mode === 'auto'
          ? 'go on, click and try it'
          : finishedLive
            ? 'you just wrote Python. that is the whole idea.'
            : 'type the faded code, Enter for the next line'}
      </p>
    </div>
  )
}
