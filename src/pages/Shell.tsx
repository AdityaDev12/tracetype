import { useEffect, useState } from 'react'
import { Logo } from '../brand/Logo.tsx'
import { dueCards, level, streak } from '../progress/model.ts'
import { onXp, useProgress } from '../progress/store.ts'
import type { Route } from '../router.ts'

/** Small level badge: "lv 3" with a thin bar of progress to the next level. */
export function LevelBadge({ xp }: { xp: number }) {
  const l = level(xp)
  return (
    <span className="tt-level" title={`${l.into} / ${l.span} xp to level ${l.level + 1}`} aria-label={`Level ${l.level}, ${xp} xp`}>
      <span className="lv">lv {l.level}</span>
      <span className="lv-bar" aria-hidden>
        <span style={{ width: `${Math.round((l.into / l.span) * 100)}%` }} />
      </span>
    </span>
  )
}

export function StreakMark({ days }: { days: number }) {
  return (
    <span className="tt-streak small" aria-label={`${days} day streak`} title="days in a row (one rest day a week is free)">
      <span className="num">
        <svg className="hl" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden>
          <path d="M3 9 C 30 6, 60 11, 97 7" />
        </svg>
        {days}
      </span>
      <small>day{days === 1 ? '' : 's'}</small>
    </span>
  )
}

export function TopBar({ route }: { route: Route }) {
  const p = useProgress()
  const due = dueCards(p, new Date()).length
  const days = streak(p.days, new Date())
  const active = (page: string) => (route.page === page ? ' active' : '')
  return (
    <nav className="topbar">
      <a href="#/" className="brand" aria-label="TraceType home">
        <Logo height={22} />
      </a>
      <div className="nav-links">
        <a href="#/course" className={`nav-link${active('course')}${active('track')}`}>
          course
        </a>
        <a href="#/review" className={`nav-link${active('review')}`}>
          review{due > 0 && <span className="due-badge">{due}</span>}
        </a>
        <a href="#/settings" className={`nav-link${active('settings')}`} aria-label="Settings">
          settings
        </a>
      </div>
      {p.xp > 0 && (
        <div className="nav-stats">
          {days > 0 && <StreakMark days={days} />}
          <LevelBadge xp={p.xp} />
        </div>
      )}
    </nav>
  )
}

/** "+10 xp" toasts when progress earns XP. Calm and short. */
export function XpToaster() {
  const [toast, setToast] = useState<{ gain: number; n: number } | null>(null)
  useEffect(
    () =>
      onXp((gain) => {
        const n = Date.now()
        setToast({ gain, n })
        window.setTimeout(() => setToast((t) => (t?.n === n ? null : t)), 1800)
      }),
    [],
  )
  if (!toast) return null
  return (
    <div className="tt-toast floating xp-toast" role="status" key={toast.n}>
      <span className="tag">+{toast.gain} xp</span>
    </div>
  )
}
