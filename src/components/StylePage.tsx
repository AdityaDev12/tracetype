import { useState } from 'react'
import heroDemo from '../../content/demos/hero.json'
import styleDemo from '../../content/demos/style.json'
import { Logo } from '../brand/Logo.tsx'
import { Mascot, type MascotMood } from '../brand/Mascot.tsx'
import { AnnotationLayer, type Anno } from '../design/Annotations.tsx'
import { MemoryBoxes } from '../design/MemoryBoxes.tsx'
import { wavyLine } from '../design/sketch.ts'
import { Terminal } from '../design/Terminal.tsx'
import { TypedHeading } from '../design/TypedHeading.tsx'
import { viewAt } from '../engine/trace.ts'
import type { TraceStep } from '../engine/types.ts'
import { CodeLine } from './CodeLine.tsx'

// #style v2: "a terminal, marked up by a tutor". Every token and building block
// on one page so the look can be judged before it goes everywhere.

const PALETTE: [string, string, string][] = [
  ['--bg', '#0c0b09', 'warm near-black page'],
  ['--grid', '#1a1813', 'graph-paper lines'],
  ['--panel', '#13110e', 'terminal panels'],
  ['--panel-bar', '#1c1914', 'terminal title bars'],
  ['--line', '#2a2620', 'borders, dashed dividers'],
  ['--chalk', '#ede6d6', 'main text'],
  ['--chalk-dim', '#9c9384', 'secondary text'],
  ['--phosphor', '#ffb547', 'cursor, active line, primary button'],
  ['--ghost', '#6e6554', 'ghost code (tuned up from #5a5243)'],
  ['--ok', '#8be38b', 'correct, done'],
  ['--pen-blue', '#86b6ff', "tutor's notes and arrows"],
  ['--pen-red', '#ff6f5e', 'mistakes, wrong characters'],
  ['--pen-yellow', '#f7d774', 'highlighter: hints, streak'],
]
const SURFACES = new Set(['--bg', '--grid', '--panel', '--panel-bar', '--line'])

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const MOODS: { mood: MascotMood; label: string }[] = [
  { mood: 'hop', label: 'correct' },
  { mood: 'tilt', label: 'error' },
  { mood: 'bounce', label: 'lesson done' },
]

const styleTrace = styleDemo.trace as TraceStep[]
const heroLines = heroDemo.lines.map((l) => l.code)

function MascotCard() {
  const [mood, setMood] = useState<MascotMood>('idle')
  const [key, setKey] = useState(0)
  const play = (m: MascotMood) => {
    setMood(m)
    setKey((k) => k + 1)
  }
  return (
    <Terminal title="mascot" className="sp-card">
      <div className="term-pad sp-stack">
        <div className="sp-mascots">
          <Mascot size={120} mood={mood} moodKey={key} title="The TraceType mascot" />
          <Mascot size={32} mood={mood} moodKey={key} />
          <Mascot size={24} mood={mood} moodKey={key} line={false} />
          <span className="sp-sketch-wrap">
            <Mascot size={64} mood={mood} moodKey={key} sketch />
            <span className="sp-hand">in the tutor's pen</span>
          </span>
        </div>
        <div className="sp-row">
          {MOODS.map((m) => (
            <button key={m.mood} className="tt-btn bracket small" onClick={() => play(m.mood)}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="sp-context">
          <span className="box-label">└─ in a lesson</span>
          <ol className="tt-steps" aria-label="Example lesson steps">
            {Array.from({ length: 11 }, (_, i) => (
              <li key={i} className={`tt-step${i < 4 ? ' done' : i === 4 ? ' current' : ''}`} />
            ))}
          </ol>
          <Mascot size={28} mood={mood} moodKey={key} />
        </div>
      </div>
    </Terminal>
  )
}

function AnnotatedCode() {
  const [run, setRun] = useState(0)
  const annos: Anno[] = [
    {
      id: `old-${run}`,
      target: 'old-value',
      mark: 'circle',
      color: 'blue',
      note: 'reads the old value first!',
      side: 'right',
      dx: 46,
      dy: -34,
      delay: 300,
    },
    { id: `typo-${run}`, target: 'typo', mark: 'underline', color: 'red', delay: 1200 },
    {
      id: `done-${run}`,
      target: 'done-line',
      mark: 'check',
      color: 'green',
      delay: 1700,
    },
  ]
  return (
    <div className="sp-stack">
      <AnnotationLayer annotations={annos}>
        <Terminal title="lesson_01.py" label="python">
          <div className="tcode">
            <div className="tline">
              <span className="tgutter">1</span>
              <span className="ttext" data-anno="done-line">
                <CodeLine code={heroLines[0]} />
              </span>
            </div>
            <div className="tline active">
              <span className="tgutter">2</span>
              <span className="ttext">
                <span className="tok-name">cups</span> <span className="tok-operator">=</span>{' '}
                <span data-anno="old-value">
                  <span className="tok-name">cups</span> <span className="tok-operator">+</span>{' '}
                  <span className="tok-number">1</span>
                </span>
              </span>
            </div>
            <div className="tline">
              <span className="tgutter">3</span>
              <span className="ttext">
                <span className="tok-name">name</span> <span className="tok-operator">=</span>{' '}
                <span data-anno="typo">
                  <span className="tok-string">"R</span>
                  <span className="twrong">o</span>
                </span>
                <span className="tcaret inline" />
                <span className="tghost">n"</span>
              </span>
            </div>
            <div className="tline">
              <span className="tgutter">4</span>
              <span className="ttext tghost">{heroLines[3]}</span>
            </div>
          </div>
        </Terminal>
      </AnnotationLayer>
      <div className="sp-row">
        <button className="tt-btn bracket small" onClick={() => setRun((r) => r + 1)}>
          draw it again
        </button>
        <span className="sp-note">Blue pen explains, red pen marks a mistake, green ticks a finished line.</span>
      </div>
    </div>
  )
}

function Streak({ days }: { days: number }) {
  return (
    <span className="tt-streak" aria-label={`${days} day streak`}>
      <span className="num">
        <svg className="hl" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden>
          <path d={wavyLine(2, 98, 8, 11, 1.5, 60)} pathLength={1} className="draw" />
        </svg>
        {days}
      </span>
      <small>day streak</small>
    </span>
  )
}

export function StylePage() {
  const [toast, setToast] = useState<{ cls: string; tag: string; text: string; n: number } | null>(null)
  const [boxesStep, setBoxesStep] = useState(2)
  const [meter, setMeter] = useState(6)

  const pop = (cls: string, tag: string, text: string) => {
    const n = Date.now()
    setToast({ cls, tag, text, n })
    window.setTimeout(() => setToast((t) => (t?.n === n ? null : t)), 2400)
  }

  const view = viewAt(styleTrace, boxesStep)

  return (
    <main className="page sp-page">
      <header className="sp-head">
        <span className="box-label">{'> tracetype --style'}</span>
        <TypedHeading level={1} text="The look, marked up." className="sp-title" />
        <p className="sp-lede">
          A terminal, marked up by a tutor. Warm glowing code panels, and a friendly hand drawing arrows, circles and
          notes on top of everything.
        </p>
        <p>
          <a className="tt-btn prompt" href="#/hero">
            {' see it in motion: the landing hero'}
          </a>
        </p>
      </header>

      <section className="sp-section">
        <h2 className="sp-h2">
          <span className="box-label">├─ </span>Logo and mascot
        </h2>
        <div className="sp-grid">
          <Terminal title="logo" className="sp-card">
            <div className="term-pad sp-stack">
              <div className="sp-logo-big">
                <Logo height={72} />
              </div>
              <div className="sp-nav-mock">
                <Logo height={22} animate={false} />
                <span className="sp-nav-links">course · review · settings</span>
              </div>
              <div className="sp-row">
                <span className="box-label">favicon</span>
                <span className="sp-tab light">
                  <img src={`${import.meta.env.BASE_URL}favicon.svg`} width={16} height={16} alt="" />
                  <img src={`${import.meta.env.BASE_URL}favicon-32.png`} width={32} height={32} alt="" />
                </span>
                <span className="sp-tab dark">
                  <img src={`${import.meta.env.BASE_URL}favicon.svg`} width={16} height={16} alt="" />
                  <img src={`${import.meta.env.BASE_URL}favicon-32.png`} width={32} height={32} alt="" />
                </span>
                <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} width={60} height={60} alt="" className="sp-touch" />
              </div>
            </div>
          </Terminal>
          <MascotCard />
        </div>
      </section>

      <section className="sp-section">
        <h2 className="sp-h2">
          <span className="box-label">├─ </span>The tutor's pen
        </h2>
        <AnnotatedCode />
      </section>

      <section className="sp-section sp-two">
        <div className="sp-stack">
          <h2 className="sp-h2">
            <span className="box-label">├─ </span>Memory
          </h2>
          <Terminal title="memory" label={`after line ${view.line ?? 0}`}>
            <MemoryBoxes vars={view.vars} />
          </Terminal>
          <div className="sp-row">
            {styleTrace.map((s, i) => (
              <button
                key={i}
                className={`tt-btn small ${i === boxesStep ? 'primary' : 'bracket'}`}
                onClick={() => setBoxesStep(i)}
              >
                line {s.line}
              </button>
            ))}
          </div>
          <p className="sp-note">
            New boxes pop in. A changed value flashes amber and the old one gets crossed out in red pen. Values come
            from a real run of a 4 line demo program.
          </p>
        </div>
        <div className="sp-stack">
          <h2 className="sp-h2">
            <span className="box-label">├─ </span>Output
          </h2>
          <Terminal title="output">
            <div className="toutput">
              <span className="prompt">{'$ python lesson_01.py\n'}</span>
              {heroDemo.trace.map((s) => s.stdout).join('')}
            </div>
          </Terminal>
        </div>
      </section>

      <section className="sp-section">
        <h2 className="sp-h2">
          <span className="box-label">├─ </span>Type
        </h2>
        <Terminal title="fonts">
          <div className="term-pad sp-type">
            <div className="sp-type-row">
              <span className="box-label">Fraunces</span>
              <span className="sp-display">Learn Python by typing it.</span>
            </div>
            <div className="sp-type-row">
              <span className="box-label">Fraunces</span>
              <h3 className="sp-h3">Variables are labelled boxes</h3>
            </div>
            <div className="sp-type-row">
              <span className="box-label">Plex Sans</span>
              <p className="sp-body">
                A variable is a name that points at a value. When you write a new value into it, the old one is gone.
                Short sentences, plain words.
              </p>
            </div>
            <div className="sp-type-row">
              <span className="box-label">Plex Mono</span>
              <code className="sp-mono">
                <CodeLine code='if score == 10 and name != "Rin":' />
              </code>
            </div>
            <div className="sp-type-row">
              <span className="box-label">Caveat</span>
              <span className="sp-hand sp-hand-big">only for the tutor's notes, never for body text</span>
            </div>
          </div>
        </Terminal>
      </section>

      <section className="sp-section">
        <h2 className="sp-h2">
          <span className="box-label">├─ </span>Palette
        </h2>
        <Terminal title="palette" label="contrast on --bg">
          <div className="sp-palette">
            {PALETTE.map(([token, hex, use]) => {
              const surface = SURFACES.has(token)
              const r = contrast(hex, '#0c0b09')
              return (
                <div key={token} className="sp-swatch">
                  <span className="sp-chip" style={{ background: hex }} />
                  <code className="sp-token">{token}</code>
                  <code className="sp-hex">{hex}</code>
                  <span className="sp-use">{use}</span>
                  <span className={`sp-ratio ${surface ? '' : r >= 4.5 ? 'pass' : r >= 3 ? 'ui' : 'fail'}`}>
                    {surface ? 'surface' : `${r.toFixed(1)}:1 ${r >= 4.5 ? 'AA' : r >= 3 ? 'AA large/UI' : 'fail'}`}
                  </span>
                </div>
              )
            })}
          </div>
        </Terminal>
      </section>

      <section className="sp-section sp-two">
        <div className="sp-stack">
          <h2 className="sp-h2">
            <span className="box-label">├─ </span>Buttons
          </h2>
          <div className="sp-row">
            <button className="tt-btn primary">Start learning →</button>
            <button className="tt-btn bracket">See the course</button>
            <button className="tt-btn prompt"> skip for now</button>
          </div>
          <div className="sp-row">
            <button className="tt-btn primary small">Check</button>
            <button className="tt-btn bracket small">show answer</button>
            <button className="tt-btn primary" disabled>
              Disabled
            </button>
            <button className="tt-icon" aria-label="Settings" title="Settings">
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                <rect x="9" y="2.5" width="2.5" height="3" fill="currentColor" />
                <rect x="4" y="6.5" width="2.5" height="3" fill="currentColor" />
                <rect x="10" y="10.5" width="2.5" height="3" fill="currentColor" />
              </svg>
            </button>
          </div>
          <p className="sp-note">Hover the bracket button. Press Tab to see focus rings.</p>
        </div>
        <div className="sp-stack">
          <h2 className="sp-h2">
            <span className="box-label">├─ </span>Inputs
          </h2>
          <label className="tt-field">
            <span className="tt-field-label">{'> what will it print?'}</span>
            <input className="tt-input" placeholder="type your guess" />
          </label>
          <label className="tt-check">
            <input type="checkbox" defaultChecked />
            <span className="box" aria-hidden />
            show the mascot
          </label>
          <label className="tt-check">
            <input type="checkbox" />
            <span className="box" aria-hidden />
            paper texture
          </label>
        </div>
      </section>

      <section className="sp-section">
        <h2 className="sp-h2">
          <span className="box-label">├─ </span>Feedback
        </h2>
        <div className="sp-stack sp-toasts">
          <div className="tt-toast ok">
            <span className="tag">✓ correct</span> +10 xp<span className="aside">nice one</span>
          </div>
          <div className="tt-toast err">
            <span className="tag">✗ not yet</span> line 3 printed 7, the test wanted 8
          </div>
          <div className="tt-toast hint">
            <span className="tag">hint</span> the loop runs once for each item
          </div>
          <div className="tt-toast sys">
            <span className="tag">{'>'}</span> progress saved
          </div>
        </div>
        <div className="sp-row">
          <button className="tt-btn bracket small" onClick={() => pop('ok', '✓ correct', '+10 xp')}>
            pop a toast
          </button>
          <button className="tt-btn bracket small" onClick={() => pop('err', '✗ not yet', 'try again, no penalty')}>
            pop an error
          </button>
        </div>
      </section>

      <section className="sp-section">
        <h2 className="sp-h2">
          <span className="box-label">├─ </span>Progress, level, streak
        </h2>
        <Terminal title="you" label="today">
          <div className="term-pad sp-stack">
            <div className="sp-row">
              <span className="box-label">lesson</span>
              <ol className="tt-steps" aria-label="Lesson steps">
                {Array.from({ length: 13 }, (_, i) => (
                  <li key={i} className={`tt-step${i < 5 ? ' done' : i === 5 ? ' current' : ''}`} />
                ))}
              </ol>
              <span className="box-label">6/13</span>
            </div>
            <div className="sp-row">
              <span className="box-label">unit  </span>
              <span className="tt-meter" aria-label={`Unit ${meter * 10} percent`}>
                [<span className="fill">{'█'.repeat(meter)}</span>
                {'░'.repeat(10 - meter)}] {meter * 10}%
              </span>
              <button className="tt-btn bracket small" onClick={() => setMeter((m) => (m >= 10 ? 2 : m + 2))}>
                more
              </button>
            </div>
            <div className="sp-row">
              <span className="tt-level">
                <span className="lv">lv 4</span> 620 / 1000 xp
              </span>
              <Streak days={12} />
            </div>
          </div>
        </Terminal>
      </section>

      <section className="sp-section sp-two">
        <div className="sp-stack">
          <h2 className="sp-h2">
            <span className="box-label">├─ </span>Empty state
          </h2>
          <Terminal title="review">
            <div className="term-pad sp-empty">
              <Mascot size={40} />
              <div>
                <div className="box-label">{'> 0 cards due'}</div>
                <div className="sp-hand sp-hand-big">all caught up. go learn something new!</div>
              </div>
            </div>
          </Terminal>
        </div>
        <div className="sp-stack">
          <h2 className="sp-h2">
            <span className="box-label">└─ </span>404
          </h2>
          <Terminal title="404">
            <div className="term-pad sp-empty">
              <Mascot size={40} mood="tilt" />
              <div>
                <div className="box-label">{'> page not found'}</div>
                <button className="tt-btn prompt"> cd ~</button>
              </div>
            </div>
          </Terminal>
        </div>
      </section>

      {toast && (
        <div className={`tt-toast floating ${toast.cls}`} role="status" key={toast.n}>
          <span className="tag">{toast.tag}</span> {toast.text}
        </div>
      )}
    </main>
  )
}
