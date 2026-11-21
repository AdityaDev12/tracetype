import { useState } from 'react'
import { Logo, LogoIcon, type LogoVariant } from '../brand/Logo.tsx'
import { Mascot, type MascotMood, type MascotVariant } from '../brand/Mascot.tsx'
import { viewAt } from '../engine/trace.ts'
import type { TraceStep } from '../engine/types.ts'
import { MemoryPanel } from '../visuals/MemoryPanel.tsx'
import { CodeLine } from './CodeLine.tsx'
import { LevelRing, ProgressBar, StepProgress, StreakFlame, Toast, type ToastKind } from './ui/Bits.tsx'

// #style: the design preview from DESIGN.md. Shows every token and building
// block so the look can be approved before pages are built with it.

const PALETTE: [string, string, string][] = [
  ['--bg', '#0e1117', 'Page background'],
  ['--surface', '#161b26', 'Cards, panels'],
  ['--surface-2', '#1c2230', 'Inputs, hover, inner boxes'],
  ['--border', '#262d3d', '1px borders'],
  ['--text', '#e6e9f0', 'Main text'],
  ['--text-muted', '#8b93a7', 'Secondary text'],
  ['--accent', '#8ab4ff', 'Links, focus, active step, progress'],
  ['--success', '#7dd3a8', 'Correct, completed'],
  ['--error', '#f28b82', 'Wrong characters, failed tests'],
  ['--warn', '#f2c879', 'Hints, streak flame'],
]

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

const CODE = [
  '# Count the apples in the basket',
  'basket = ["apple", "pear", "apple"]',
  'count = 0',
  'for fruit in basket:',
  '    if fruit == "apple":',
  '        count = count + 1',
  'print("Apples:", count, len(basket) > 2)',
]

// Example boxes for the preview only. Lesson visuals always come from real runs.
const DEMO_TRACE: TraceStep[] = [
  { line: 1, vars: { city: { repr: "'Oslo'", type: 'str' }, days: { repr: '3', type: 'int' } }, stdout: '' },
  {
    line: 2,
    vars: {
      city: { repr: "'Oslo'", type: 'str' },
      days: { repr: '4', type: 'int' },
      rainy: { repr: 'True', type: 'bool' },
    },
    stdout: '',
  },
]

const LOGOS: { id: LogoVariant; name: string; note: string }[] = [
  { id: 'cursor', name: 'A. Cursor wordmark', note: 'Monospace name with a blinking block cursor at the end. Simple, reads as "typing".' },
  { id: 'mark', name: 'B. Icon + wordmark', note: 'A prompt chevron and the mascot in a small tile, next to the name in Inter.' },
  { id: 'ghost', name: 'C. Ghost type', note: '"Type" is faded like ghost code, with the cursor about to type over it.' },
]

const MASCOTS: { id: MascotVariant; name: string; note: string }[] = [
  { id: 'cursor', name: '1. Caret', note: 'A tall block cursor with two dot eyes. The most minimal.' },
  { id: 'buddy', name: '2. Buddy', note: 'A softer, wider block on an underscore, with a tiny smile.' },
  { id: 'brackets', name: '3. Brackets', note: 'A slim cursor holding two square brackets like little arms.' },
]

const MOODS: { mood: MascotMood; label: string }[] = [
  { mood: 'hop', label: 'Correct (hop)' },
  { mood: 'tilt', label: 'Error (tilt)' },
  { mood: 'bounce', label: 'Lesson done (bounce)' },
]

function MascotCard({ id, name, note }: { id: MascotVariant; name: string; note: string }) {
  const [mood, setMood] = useState<MascotMood>('idle')
  const [key, setKey] = useState(0)
  const play = (m: MascotMood) => {
    setMood(m)
    setKey((k) => k + 1)
  }
  return (
    <div className="card sp-option">
      <h3>{name}</h3>
      <div className="sp-mascot-row">
        <Mascot variant={id} size={96} mood={mood} moodKey={key} title={`Mascot ${name}`} />
        <Mascot variant={id} size={32} mood={mood} moodKey={key} />
        <Mascot variant={id} size={24} mood={mood} moodKey={key} />
      </div>
      <p className="muted small-text">{note} Idle: blinks now and then.</p>
      <div className="row">
        {MOODS.map((m) => (
          <button key={m.mood} className="btn small secondary" onClick={() => play(m.mood)}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="sp-in-context">
        <span className="muted small-text">In context:</span>
        <div className="sp-context-bar">
          <StepProgress
            steps={['Intro', 'Predict', 'Examples', 'Investigate', 'Faded', 'Parsons', 'Quiz'].map((label, i) => ({
              label,
              state: i < 3 ? 'done' : i === 3 ? 'current' : 'todo',
            }))}
          />
          <Mascot variant={id} size={28} mood={mood} moodKey={key} />
        </div>
      </div>
    </div>
  )
}

export function StylePage() {
  const [toast, setToast] = useState<{ kind: ToastKind; text: string; n: number } | null>(null)
  const [boxesKey, setBoxesKey] = useState(0)
  const [fill, setFill] = useState(0.35)

  const showToast = (kind: ToastKind, text: string) => {
    const n = Date.now()
    setToast({ kind, text, n })
    window.setTimeout(() => setToast((t) => (t?.n === n ? null : t)), 2400)
  }

  return (
    <main className="page style-page">
      <header className="sp-head">
        <h1>Style preview</h1>
        <p className="muted">
          Everything the site is built from. Pick one logo and one mascot below. Press Tab to see focus rings.
        </p>
      </header>

      <section className="sp-section">
        <h2>Logo options</h2>
        <div className="sp-grid">
          {LOGOS.map((l) => (
            <div key={l.id} className="card sp-option">
              <h3>{l.name}</h3>
              <div className="sp-logo-big">
                <Logo variant={l.id} />
              </div>
              <div className="sp-logo-nav">
                <span className="muted small-text">Nav bar:</span>
                <span style={{ fontSize: '1.1rem' }}>
                  <Logo variant={l.id} />
                </span>
              </div>
              <div className="sp-logo-icons">
                <span className="muted small-text">Icon:</span>
                <span style={{ fontSize: 24 }}>
                  <LogoIcon variant={l.id} size={2} />
                </span>
                <span style={{ fontSize: 16 }}>
                  <LogoIcon variant={l.id} size={2} />
                </span>
                <span style={{ fontSize: 8 }}>
                  <LogoIcon variant={l.id} size={2} />
                </span>
              </div>
              <p className="muted small-text">{l.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="sp-section">
        <h2>Mascot sketches</h2>
        <div className="sp-grid">
          {MASCOTS.map((m) => (
            <MascotCard key={m.id} {...m} />
          ))}
        </div>
      </section>

      <section className="sp-section">
        <h2>Palette</h2>
        <div className="sp-swatches">
          {PALETTE.map(([token, hex, use]) => {
            const ratio = contrast(hex, '#0e1117')
            return (
              <div key={token} className="sp-swatch">
                <span className="sp-chip" style={{ background: `var(${token})` }} />
                <div>
                  <code>{token}</code>
                  <div className="muted small-text">
                    {hex} · {use}
                  </div>
                  {token !== '--bg' && token !== '--surface' && token !== '--surface-2' && token !== '--border' && (
                    <div className={`small-text ${ratio >= 4.5 ? 'sp-pass' : 'sp-fail'}`}>
                      {ratio.toFixed(1)}:1 on background {ratio >= 4.5 ? '(AA)' : '(decorative only)'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="sp-section">
        <h2>Type</h2>
        <div className="card sp-type">
          <div className="t-display">Learn Python by typing it.</div>
          <div className="t-h1">Heading 1 · Variables and print</div>
          <div className="t-h2">Heading 2 · Worked examples</div>
          <div className="t-h3">Heading 3 · Predict the output</div>
          <p className="t-body">
            Body text. A variable is a name that points at a value. Short sentences, plain words, lots of space.
          </p>
          <p className="t-small muted">Small text for hints and secondary details.</p>
          <div className="t-label">Label · Step 3 of 12</div>
          <code className="t-mono">score = score + 1</code>
        </div>
      </section>

      <section className="sp-section">
        <h2>Buttons and inputs</h2>
        <div className="card">
          <div className="row">
            <button className="btn primary">Start learning</button>
            <button className="btn secondary">See the course</button>
            <button className="btn ghost">Skip</button>
            <button className="btn primary" disabled>
              Disabled
            </button>
            <button className="btn small secondary">Small</button>
            <button className="icon-btn" aria-label="Settings" title="Settings">
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
                <circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="sp-inputs">
            <label className="field">
              <span className="field-label">Your answer</span>
              <input className="input" placeholder="Type what it prints" />
            </label>
            <label className="field">
              <span className="field-label">Code</span>
              <textarea className="input mono" rows={2} defaultValue={'total = price * 2'} />
            </label>
            <label className="check">
              <input type="checkbox" defaultChecked /> Show the mascot
            </label>
            <label className="switch">
              <input type="checkbox" role="switch" />
              <span className="switch-track" aria-hidden />
              Sound
            </label>
          </div>
        </div>
      </section>

      <section className="sp-section">
        <h2>Code</h2>
        <div className="editor">
          {CODE.map((l, i) => (
            <div className={`code-row${i === 5 ? ' current' : ''}`} key={i}>
              <span className="gutter">{i + 1}</span>
              <span className="code-text">
                <CodeLine code={l} />
              </span>
            </div>
          ))}
        </div>
        <p className="muted small-text sp-caption">Trace mode: typed text, one wrong character, faded ghost code.</p>
        <div className="editor">
          <div className="code-row current">
            <span className="gutter">2</span>
            <span className="code-text">
              <span className="tok-name">cou</span>
              <span className="cm-wrong">y</span>
              <span className="ghost"> = 0</span>
            </span>
          </div>
          <div className="code-row">
            <span className="gutter">3</span>
            <span className="code-text ghost">for fruit in basket:</span>
          </div>
          <div className="code-row">
            <span className="gutter">4</span>
            <span className="code-text ghost">    if fruit == "apple":</span>
          </div>
        </div>
      </section>

      <section className="sp-section">
        <h2>Variable boxes</h2>
        <div className="sp-two">
          <div key={boxesKey}>
            <MemoryPanel vars={viewAt(DEMO_TRACE, 1).vars} />
          </div>
          <div>
            <p className="muted small-text">
              New boxes pop in with a "new" tag. Changed boxes glow and show the old value. (Example values for this
              page only.)
            </p>
            <button className="btn small secondary" onClick={() => setBoxesKey((k) => k + 1)}>
              Replay
            </button>
          </div>
        </div>
      </section>

      <section className="sp-section">
        <h2>Feedback</h2>
        <div className="sp-toasts">
          <Toast kind="success">Correct! +10 XP</Toast>
          <Toast kind="error">Not quite. Line 3 prints 7, the test expected 8.</Toast>
          <Toast kind="warn">Hint: the loop runs once for each item.</Toast>
          <Toast kind="info">Progress saved.</Toast>
        </div>
        <div className="row">
          <button className="btn small secondary" onClick={() => showToast('success', 'Correct! +10 XP')}>
            Show a toast
          </button>
          <button className="btn small secondary" onClick={() => showToast('error', 'Not quite. Try again.')}>
            Show an error toast
          </button>
        </div>
      </section>

      <section className="sp-section">
        <h2>Progress, XP and streak</h2>
        <div className="card sp-progress">
          <StepProgress
            steps={['Intro', 'Predict', 'Examples', 'Investigate', 'Faded', 'Parsons', 'Fix', 'Modify', 'Recall', 'Make', 'Quiz'].map(
              (label, i) => ({ label, state: i < 4 ? 'done' : i === 4 ? 'current' : 'todo' }),
            )}
          />
          <div className="row">
            <div style={{ flex: 1, minWidth: 200 }}>
              <ProgressBar value={fill} label="Unit progress" />
            </div>
            <button className="btn small secondary" onClick={() => setFill((f) => (f >= 1 ? 0.1 : Math.min(1, f + 0.3)))}>
              Fill more
            </button>
          </div>
          <div className="row sp-badges">
            <LevelRing level={4} progress={0.62} />
            <span className="muted small-text">Level 4 · 620 / 1000 XP</span>
            <StreakFlame days={12} />
          </div>
        </div>
      </section>

      <section className="sp-section">
        <h2>Empty state</h2>
        <div className="card empty-state">
          <Mascot size={40} />
          <p>No reviews due. Nice.</p>
          <p className="muted small-text">Come back tomorrow, or start the next lesson.</p>
        </div>
      </section>

      {toast && (
        <Toast kind={toast.kind} floating key={toast.n}>
          {toast.text}
        </Toast>
      )}
    </main>
  )
}
