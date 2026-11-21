// Small reusable UI pieces: toast, streak flame, level ring, step progress.

import type { ReactNode } from 'react'

export type ToastKind = 'success' | 'error' | 'info' | 'warn'

export function Toast({ kind, children, floating }: { kind: ToastKind; children: ReactNode; floating?: boolean }) {
  return (
    <div className={`toast toast-${kind}${floating ? ' toast-floating' : ''}`} role="status">
      <span className="toast-dot" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

export function StreakFlame({ days, title }: { days: number; title?: string }) {
  return (
    <span className="streak" title={title ?? `${days} day streak`} aria-label={`${days} day streak`}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
        <path
          d="M8 1.5c.4 2.3 3.8 3.9 3.8 7.4A3.8 3.8 0 0 1 8 12.8a3.8 3.8 0 0 1-3.8-3.9c0-1.6.8-2.6 1.6-3.4.1 1 .6 1.8 1.4 2.1C7 5.6 7.2 3.4 8 1.5Z"
          fill="var(--warn)"
        />
        <rect x="3" y="14" width="10" height="1" rx="0.5" fill="var(--warn)" opacity="0.35" />
      </svg>
      <span className="streak-num">{days}</span>
    </span>
  )
}

/** Level number inside a thin ring that fills with progress (0 to 1) to the next level. */
export function LevelRing({ level, progress, size = 34 }: { level: number; progress: number; size?: number }) {
  const r = 14
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, progress))
  return (
    <span className="level-ring" style={{ width: size, height: size }} aria-label={`Level ${level}`}>
      <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
        <circle cx="16" cy="16" r={r} fill="none" stroke="var(--border)" strokeWidth="2" />
        <circle
          cx="16"
          cy="16"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`}
          transform="rotate(-90 16 16)"
          className="level-ring-fill"
        />
      </svg>
      <span className="level-ring-num">{level}</span>
    </span>
  )
}

export type StepState = 'done' | 'current' | 'todo'

/** The lesson step bar: one segment per step. */
export function StepProgress({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <ol className="step-progress" aria-label="Lesson steps">
      {steps.map((s, i) => (
        <li key={i} className={`step-seg ${s.state}`} title={s.label} aria-current={s.state === 'current' ? 'step' : undefined}>
          <span className="sr-only">
            {s.label}: {s.state === 'done' ? 'done' : s.state === 'current' ? 'current step' : 'not done'}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="progress-bar" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
