import { useRef, useState } from 'react'
import { Terminal } from '../design/Terminal.tsx'
import { TypedHeading } from '../design/TypedHeading.tsx'
import { exportProgress, importProgress, makeAllDue, type Settings } from '../progress/model.ts'
import { getProgress, replaceProgress, resetProgress, updateProgress, useProgress } from '../progress/store.ts'

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="tt-check setting">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="box" aria-hidden />
      <span>
        {label}
        <span className="setting-hint">{hint}</span>
      </span>
    </label>
  )
}

export function SettingsPage() {
  const p = useProgress()
  const [text, setText] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<Settings>) => updateProgress((x) => ({ ...x, settings: { ...x.settings, ...patch } }))

  const download = () => {
    const blob = new Blob([exportProgress(getProgress())], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tracetype-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportProgress(getProgress()))
      setMsg({ ok: true, text: 'Copied. Paste it on your other device.' })
    } catch {
      setText(exportProgress(getProgress()))
      setMsg({ ok: true, text: 'Could not copy automatically, so the data is in the box below. Copy it from there.' })
    }
  }

  const doImport = (raw: string) => {
    try {
      replaceProgress(importProgress(raw))
      setMsg({ ok: true, text: 'Progress loaded.' })
      setText('')
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not read that.' })
    }
  }

  return (
    <main className="page settings-page">
      <span className="box-label">{'> settings'}</span>
      <TypedHeading level={1} text="Settings" className="page-title" />

      <Terminal title="look">
        <div className="term-pad settings-group">
          <Toggle label="Show the mascot" hint="the little cursor next to the step bar" checked={p.settings.mascot} onChange={(v) => set({ mascot: v })} />
          <Toggle label="Paper texture" hint="a very faint grain over the page" checked={p.settings.texture} onChange={(v) => set({ texture: v })} />
        </div>
      </Terminal>

      <Terminal title="your progress">
        <div className="term-pad settings-group">
          <p className="muted">
            Progress lives in this browser only. To move it to another device, export it here and import it there.
          </p>
          <div className="row-gap">
            <button className="tt-btn primary" onClick={download}>
              Download progress
            </button>
            <button className="tt-btn bracket" onClick={() => void copy()}>
              copy to clipboard
            </button>
          </div>
          <label className="tt-field">
            <span className="tt-field-label">{'> paste progress to import'}</span>
            <textarea className="tt-input mono" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <div className="row-gap">
            <button className="tt-btn bracket" onClick={() => doImport(text)} disabled={text.trim() === ''}>
              import pasted progress
            </button>
            <button className="tt-btn bracket" onClick={() => file.current?.click()}>
              import a file
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) doImport(await f.text())
                e.target.value = ''
              }}
            />
          </div>
          {msg && (
            <div className={`tt-toast ${msg.ok ? 'ok' : 'err'}`} role="status">
              <span className="tag">{msg.ok ? '✓' : '✗'}</span> {msg.text}
            </div>
          )}
        </div>
      </Terminal>

      <Terminal title="start over">
        <div className="term-pad settings-group">
          {confirmReset ? (
            <div className="row-gap">
              <span>This deletes all progress, XP and review cards in this browser.</span>
              <button
                className="tt-btn bracket danger"
                onClick={() => {
                  resetProgress()
                  setConfirmReset(false)
                  setMsg({ ok: true, text: 'Progress reset.' })
                }}
              >
                yes, reset everything
              </button>
              <button className="tt-btn prompt" onClick={() => setConfirmReset(false)}>
                {' cancel'}
              </button>
            </div>
          ) : (
            <button className="tt-btn bracket" onClick={() => setConfirmReset(true)}>
              reset progress
            </button>
          )}
        </div>
      </Terminal>

      <Terminal title="testing">
        <div className="term-pad settings-group">
          <p className="muted">For trying the review system without waiting a day.</p>
          <button
            className="tt-btn bracket"
            onClick={() => {
              updateProgress((x) => makeAllDue(x, new Date()))
              setMsg({ ok: true, text: 'All review cards are due now.' })
            }}
            disabled={Object.keys(p.cards).length === 0}
          >
            make all review cards due now
          </button>
        </div>
      </Terminal>
    </main>
  )
}
