// The mascot: a tall amber block cursor with two dot eyes, standing on the
// tutor's blue pen line. `sketch` draws it in the tutor's pen for annotations.

export type MascotMood = 'idle' | 'hop' | 'tilt' | 'bounce'

interface Props {
  mood?: MascotMood
  /** Change this to replay the same mood animation. */
  moodKey?: number
  size?: number
  sketch?: boolean
  /** The blue pen line under the mascot. */
  line?: boolean
  title?: string
}

/** Rounded rectangle drawn by hand: a single wobbly stroke. */
function sketchBody(): string {
  return 'M13.2 3.4 C16 2.9 18.5 3.1 19.2 3.3 C21.6 3.6 22.1 5.2 22 7.4 L22.2 22.6 C22.3 25 21 26.2 18.8 26.1 L13.4 26.3 C11 26.2 9.9 25 10 22.8 L9.8 7 C9.9 4.8 10.9 3.5 13.5 3.3'
}

export function Mascot({ mood = 'idle', moodKey = 0, size = 32, sketch = false, line = true, title }: Props) {
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
      {line && (
        <path
          className="mascot-shadow"
          d="M6.5 29.4 C 12 28.4, 20 29, 25.5 28"
          fill="none"
          stroke="var(--pen-blue)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
      <g className="mascot-body">
        {sketch ? (
          <path d={sketchBody()} fill="none" stroke="var(--pen-blue)" strokeWidth="1.3" strokeLinecap="round" />
        ) : (
          <rect x="10" y="3" width="12" height="23.5" rx="3.6" fill="var(--phosphor)" className="mascot-glow" />
        )}
        <g className="mascot-eyes">
          <circle cx="13.8" cy="8.2" r="1.45" fill={sketch ? 'var(--pen-blue)' : 'var(--on-phosphor)'} />
          <circle cx="18.2" cy="8.2" r="1.45" fill={sketch ? 'var(--pen-blue)' : 'var(--on-phosphor)'} />
        </g>
      </g>
    </svg>
  )
}
