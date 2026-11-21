import { roughLine, roughRect } from '../design/sketch.ts'

// The mascot: a terminal cursor with two dot eyes. Inline SVG + CSS.
// v2 sketches, kept until one is picked on the #style page.
// `sketch` draws it in the tutor's blue pen, for use inside annotations.

export type MascotVariant = 'block' | 'peeker' | 'walker'
export type MascotMood = 'idle' | 'hop' | 'tilt' | 'bounce'

interface Props {
  variant?: MascotVariant
  mood?: MascotMood
  /** Change this to replay the same mood animation. */
  moodKey?: number
  size?: number
  sketch?: boolean
  title?: string
}

function Eyes({ x1, x2, y, r, fill }: { x1: number; x2: number; y: number; r: number; fill: string }) {
  return (
    <g className="mascot-eyes">
      <circle cx={x1} cy={y} r={r} fill={fill} />
      <circle cx={x2} cy={y} r={r} fill={fill} />
    </g>
  )
}

function Solid({ variant }: { variant: MascotVariant }) {
  const eye = 'var(--bg)'
  if (variant === 'peeker') {
    // An underscore cursor: a low bar, with eyes peeking over it.
    return (
      <g className="mascot-body">
        <rect x="9" y="12" width="14" height="10" rx="5" fill="var(--phosphor)" opacity="0.18" />
        <Eyes x1={13} x2={19} y={17} r={1.9} fill="var(--phosphor)" />
        <rect x="5" y="22" width="22" height="5" fill="var(--phosphor)" className="mascot-glow" />
      </g>
    )
  }
  if (variant === 'walker') {
    // A block cursor standing on two short legs.
    return (
      <>
        <rect x="9" y="29" width="14" height="1" fill="var(--line)" className="mascot-shadow" />
        <g className="mascot-body">
          <rect x="12" y="23" width="2" height="5" fill="var(--phosphor)" />
          <rect x="18" y="23" width="2" height="5" fill="var(--phosphor)" />
          <rect x="9" y="5" width="14" height="19" fill="var(--phosphor)" className="mascot-glow" />
          <Eyes x1={13.2} x2={18.8} y={11.5} r={1.5} fill={eye} />
        </g>
      </>
    )
  }
  // block: the plain terminal block cursor.
  return (
    <>
      <rect x="9" y="29" width="14" height="1" fill="var(--line)" className="mascot-shadow" />
      <g className="mascot-body">
        <rect x="9" y="4" width="14" height="23" fill="var(--phosphor)" className="mascot-glow" />
        <Eyes x1={13.2} x2={18.8} y={11} r={1.5} fill={eye} />
      </g>
    </>
  )
}

function Sketch({ variant }: { variant: MascotVariant }) {
  const stroke = { stroke: 'var(--pen-blue)', strokeWidth: 1.3, fill: 'none', strokeLinecap: 'round' as const }
  if (variant === 'peeker') {
    return (
      <g className="mascot-body">
        <Eyes x1={13} x2={19} y={17} r={1.6} fill="var(--pen-blue)" />
        <path d={roughRect(5, 22, 22, 5, 4)} {...stroke} />
      </g>
    )
  }
  return (
    <g className="mascot-body">
      <path d={roughRect(9, variant === 'walker' ? 5 : 4, 14, variant === 'walker' ? 19 : 23, 9)} {...stroke} />
      {variant === 'walker' && (
        <>
          <path d={roughLine({ x: 13, y: 24 }, { x: 12.5, y: 28.5 }, 2)} {...stroke} />
          <path d={roughLine({ x: 19, y: 24 }, { x: 19.5, y: 28.5 }, 3)} {...stroke} />
        </>
      )}
      <Eyes x1={13.2} x2={18.8} y={variant === 'walker' ? 11.5 : 11} r={1.4} fill="var(--pen-blue)" />
    </g>
  )
}

export function Mascot({ variant = 'block', mood = 'idle', moodKey = 0, size = 32, sketch = false, title }: Props) {
  return (
    <svg
      key={`${mood}:${moodKey}`}
      className={`mascot mascot-${mood}${sketch ? ' mascot-sketch' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {sketch ? <Sketch variant={variant} /> : <Solid variant={variant} />}
    </svg>
  )
}
