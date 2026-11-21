// The mascot: a tiny block cursor with dot eyes. Inline SVG + CSS, no images.
// Three sketches are kept until one is picked on the #style page.

export type MascotVariant = 'cursor' | 'buddy' | 'brackets'
export type MascotMood = 'idle' | 'hop' | 'tilt' | 'bounce'

interface Props {
  variant?: MascotVariant
  mood?: MascotMood
  /** Change this to replay the same mood animation. */
  moodKey?: number
  size?: number
  title?: string
}

function Eyes({ cx1, cx2, cy, r }: { cx1: number; cx2: number; cy: number; r: number }) {
  return (
    <g className="mascot-eyes">
      <circle cx={cx1} cy={cy} r={r} fill="var(--bg)" />
      <circle cx={cx2} cy={cy} r={r} fill="var(--bg)" />
    </g>
  )
}

function Body({ variant }: { variant: MascotVariant }) {
  if (variant === 'cursor') {
    // A plain tall block cursor, like a terminal caret, with two eyes near the top.
    return (
      <>
        <ellipse cx="16" cy="29" rx="6" ry="1.2" fill="var(--border)" className="mascot-shadow" />
        <g className="mascot-body">
          <rect x="10" y="4" width="12" height="22" rx="3" fill="var(--accent)" />
          <Eyes cx1={13.6} cx2={18.4} cy={11} r={1.5} />
        </g>
      </>
    )
  }
  if (variant === 'buddy') {
    // A wider, softer block sitting on an underscore, with a small smile.
    return (
      <>
        <rect x="5" y="27" width="22" height="2" rx="1" fill="var(--accent)" opacity="0.35" className="mascot-shadow" />
        <g className="mascot-body">
          <rect x="7" y="8" width="18" height="17" rx="5" fill="var(--accent)" />
          <Eyes cx1={12.5} cx2={19.5} cy={15} r={1.6} />
          <path d="M14 19.2 Q16 20.8 18 19.2" stroke="var(--bg)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
      </>
    )
  }
  // brackets: a slim cursor held between two square brackets like little arms.
  return (
    <>
      <ellipse cx="16" cy="29" rx="7" ry="1.2" fill="var(--border)" className="mascot-shadow" />
      <g className="mascot-body">
        <path d="M8.5 7 H5.5 V25 H8.5" stroke="var(--text-muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23.5 7 H26.5 V25 H23.5" stroke="var(--text-muted)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="11" y="6" width="10" height="20" rx="2.5" fill="var(--accent)" />
        <Eyes cx1={14.2} cx2={17.8} cy={12} r={1.3} />
      </g>
    </>
  )
}

export function Mascot({ variant = 'cursor', mood = 'idle', moodKey = 0, size = 32, title }: Props) {
  return (
    <svg
      key={`${mood}:${moodKey}`}
      className={`mascot mascot-${mood}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <Body variant={variant} />
    </svg>
  )
}
