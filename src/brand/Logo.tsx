import { roughEllipse, wavyLine } from '../design/sketch.ts'

// v2 logo options, kept until one is picked on the #style page.

export type LogoVariant = 'ghost' | 'marked' | 'serif'

function Block() {
  return <span className="logo-block" aria-hidden />
}

/** A: Trace▌Type in Plex Mono. "Type" is ghost code, the cursor is about to type over it. */
function GhostLogo() {
  return (
    <span className="logo logo-mono">
      <span>Trace</span>
      <Block />
      <span className="logo-ghost-text">Type</span>
    </span>
  )
}

/** B: the same, marked up by the tutor: a blue loop around the cursor and a wavy line under Type. */
function MarkedLogo() {
  return (
    <span className="logo logo-mono logo-marked">
      <span>Trace</span>
      <span className="logo-block-wrap">
        <Block />
        <svg className="logo-pen" viewBox="0 0 40 40" aria-hidden>
          <path d={roughEllipse(20, 20, 15, 17, 7)} pathLength={1} className="draw" />
        </svg>
      </span>
      <span className="logo-ghost-text logo-underlined">
        Type
        <svg className="logo-pen logo-pen-under" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
          <path d={wavyLine(2, 98, 5, 3, 2.4, 14)} pathLength={1} className="draw" style={{ animationDelay: '300ms' }} />
        </svg>
      </span>
    </span>
  )
}

/** C: a bookish serif wordmark with a prompt in front and the amber cursor behind. */
function SerifLogo() {
  return (
    <span className="logo logo-serif">
      <span className="logo-prompt">&gt;</span>
      <span>
        Trace<em>Type</em>
      </span>
      <Block />
    </span>
  )
}

export function Logo({ variant = 'ghost' }: { variant?: LogoVariant }) {
  return (
    <span role="img" aria-label="TraceType" className="logo-wrap">
      {variant === 'marked' ? <MarkedLogo /> : variant === 'serif' ? <SerifLogo /> : <GhostLogo />}
    </span>
  )
}

/** Square icon for the favicon: a prompt and the amber block cursor. */
export function LogoIcon({ px = 32, variant = 'ghost' }: { px?: number; variant?: LogoVariant }) {
  return (
    <svg viewBox="0 0 32 32" width={px} height={px} aria-hidden className="logo-icon">
      <rect x="0.5" y="0.5" width="31" height="31" rx="3" fill="#13110e" stroke="#2a2620" />
      {variant === 'serif' ? (
        <text x="5" y="23" fontFamily="Fraunces, Georgia, serif" fontSize="19" fontWeight="600" fill="#ede6d6">
          T
        </text>
      ) : (
        <path d="M6 10.5 L11 15.5 L6 20.5" stroke="#9c9384" strokeWidth="2.2" fill="none" strokeLinecap="square" />
      )}
      <rect x="16" y="8" width="9" height="16" fill="#ffb547" />
      {variant === 'marked' && (
        <path d={roughEllipse(20.5, 16, 8.5, 11, 7)} fill="none" stroke="#86b6ff" strokeWidth="1.4" strokeLinecap="round" />
      )}
    </svg>
  )
}
