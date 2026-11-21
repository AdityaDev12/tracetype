// Logo options. Three are kept until one is picked on the #style page.

export type LogoVariant = 'cursor' | 'mark' | 'ghost'

/** A: monospace wordmark with a blinking block cursor at the end. */
function CursorWordmark() {
  return (
    <span className="logo logo-cursor">
      <span>Trace</span>
      <span className="logo-accent">Type</span>
      <span className="logo-block" aria-hidden />
    </span>
  )
}

/** B: a small icon (prompt chevron + the mascot) next to an Inter wordmark. */
function MarkWordmark() {
  return (
    <span className="logo logo-mark">
      <LogoIcon variant="mark" size={1.5} />
      <span className="logo-mark-text">TraceType</span>
    </span>
  )
}

/** C: "Type" written as faded ghost text, with the cursor between the two words. */
function GhostWordmark() {
  return (
    <span className="logo logo-ghost">
      <span>Trace</span>
      <span className="logo-caret" aria-hidden />
      <span className="logo-ghost-text">Type</span>
    </span>
  )
}

export function Logo({ variant = 'cursor' }: { variant?: LogoVariant }) {
  const inner = variant === 'mark' ? <MarkWordmark /> : variant === 'ghost' ? <GhostWordmark /> : <CursorWordmark />
  return (
    <span role="img" aria-label="TraceType">
      {inner}
    </span>
  )
}

/** Square icon for the favicon and small places. `size` is in em. */
export function LogoIcon({ variant = 'cursor', size = 2 }: { variant?: LogoVariant; size?: number }) {
  const style = { width: `${size}em`, height: `${size}em` }
  if (variant === 'mark') {
    return (
      <svg viewBox="0 0 32 32" style={style} aria-hidden>
        <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="var(--surface)" stroke="var(--border)" />
        <path d="M7 11 L11 15 L7 19" stroke="var(--text-muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="8" width="10" height="16" rx="2.5" fill="var(--accent)" />
        <circle cx="17" cy="13" r="1.2" fill="var(--bg)" />
        <circle cx="21" cy="13" r="1.2" fill="var(--bg)" />
      </svg>
    )
  }
  if (variant === 'ghost') {
    return (
      <svg viewBox="0 0 32 32" style={style} aria-hidden>
        <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="var(--surface)" stroke="var(--border)" />
        <text x="6" y="22" fontFamily="JetBrains Mono, monospace" fontSize="16" fontWeight="600" fill="var(--text)">T</text>
        <rect x="16" y="9" width="2" height="15" rx="1" fill="var(--accent)" />
        <text x="19.5" y="22" fontFamily="JetBrains Mono, monospace" fontSize="16" fontWeight="600" fill="var(--text-dim)">t</text>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 32 32" style={style} aria-hidden>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="var(--surface)" stroke="var(--border)" />
      <path d="M7 10 L12 15 L7 20" stroke="var(--text)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="15" y="9" width="9" height="13" rx="1.5" fill="var(--accent)" />
    </svg>
  )
}
