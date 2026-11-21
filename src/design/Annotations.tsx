import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { arrow, checkMark, roughEllipse, roughRect, roughLine, wavyLine, type Pt } from './sketch.ts'

// The tutor's pen. Wrap any content in <AnnotationLayer>, put data-anno="name"
// on the things to point at, and pass annotations that refer to those names.
// Marks draw themselves on, then the arrow, then the handwritten note fades in.

export type PenColor = 'blue' | 'red' | 'yellow' | 'green'
export type MarkKind = 'circle' | 'underline' | 'box' | 'check' | 'strike' | 'highlight'
export type NoteSide = 'right' | 'left' | 'above' | 'below'

export interface Anno {
  id: string
  /** Value of the data-anno attribute on the element to mark. */
  target: string
  mark?: MarkKind
  color?: PenColor
  note?: string
  side?: NoteSide
  /** Extra offset for the note, in px. */
  dx?: number
  dy?: number
  arrow?: boolean
  /** Max width of the note in px (default 220). */
  width?: number
  /** Start drawing after this many ms. */
  delay?: number
  seed?: number
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function markShape(a: Anno, b: Box, seed: number) {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  switch (a.mark) {
    case 'circle': {
      const rx = b.w / 2 + 9
      const ry = b.h / 2 + 7
      return { d: [roughEllipse(cx, cy, rx, ry, seed)], bounds: { x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 } }
    }
    case 'underline':
      return { d: [wavyLine(b.x - 2, b.x + b.w + 2, b.y + b.h + 3, seed)], bounds: { ...b, h: b.h + 6 } }
    case 'box':
      return { d: [roughRect(b.x - 5, b.y - 4, b.w + 10, b.h + 8, seed)], bounds: { x: b.x - 5, y: b.y - 4, w: b.w + 10, h: b.h + 8 } }
    case 'strike':
      return { d: [roughLine({ x: b.x - 3, y: cy + 1 }, { x: b.x + b.w + 3, y: cy - 1 }, seed, 0.03)], bounds: b }
    case 'check': {
      const s = Math.min(22, b.h + 6)
      return { d: [checkMark(b.x + b.w + 6, cy - s / 2, s, seed)], bounds: { ...b, w: b.w + 6 + s } }
    }
    case 'highlight':
      return { d: [roughLine({ x: b.x - 2, y: cy + 2 }, { x: b.x + b.w + 2, y: cy + 1 }, seed, 0.01)], bounds: b, fat: true }
    default:
      return { d: [] as string[], bounds: b }
  }
}

function notePlacement(a: Anno, m: Box): { note: Pt; from: Pt; to: Pt; align: 'left' | 'right' | 'center' } {
  const cx = m.x + m.w / 2
  const cy = m.y + m.h / 2
  const side = a.side ?? 'right'
  if (side === 'right') {
    const note = { x: m.x + m.w + (a.dx ?? 40), y: cy + (a.dy ?? -30) }
    return { note, from: { x: note.x - 6, y: note.y + 18 }, to: { x: m.x + m.w + 4, y: cy }, align: 'left' }
  }
  if (side === 'left') {
    const note = { x: m.x - (a.dx ?? 40), y: cy + (a.dy ?? -30) }
    return { note, from: { x: note.x + 6, y: note.y + 18 }, to: { x: m.x - 4, y: cy }, align: 'right' }
  }
  if (side === 'above') {
    const note = { x: cx + (a.dx ?? 30), y: m.y - (a.dy ?? 52) }
    return { note, from: { x: note.x - 4, y: note.y + 30 }, to: { x: cx + 6, y: m.y - 4 }, align: 'left' }
  }
  const note = { x: cx + (a.dx ?? 30), y: m.y + m.h + (a.dy ?? 26) }
  return { note, from: { x: note.x - 4, y: note.y + 6 }, to: { x: cx + 6, y: m.y + m.h + 4 }, align: 'left' }
}

function Annotation({ a, box }: { a: Anno; box: Box }) {
  const seed = a.seed ?? hash(a.id)
  const color = a.color ?? 'blue'
  const delay = a.delay ?? 0
  const shape = markShape(a, box, seed)
  const place = a.note ? notePlacement(a, shape.bounds) : null
  const arr = place && a.arrow !== false ? arrow(place.from, place.to, seed + 1, place.align === 'right' ? -0.25 : 0.25) : null
  return (
    <>
      <svg className={`anno-svg pen-${color}`} aria-hidden>
        {shape.d.map((d, i) => (
          <path
            key={i}
            d={d}
            pathLength={1}
            className={`pen-stroke draw${'fat' in shape && shape.fat ? ' pen-fat' : ''}`}
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
        {arr && (
          <>
            <path d={arr.shaft} pathLength={1} className="pen-stroke draw" style={{ animationDelay: `${delay + 260}ms` }} />
            <path d={arr.head} pathLength={1} className="pen-stroke draw" style={{ animationDelay: `${delay + 520}ms` }} />
          </>
        )}
      </svg>
      {a.note && place && (
        <div
          className={`anno-note pen-${color} align-${place.align}`}
          style={{ left: place.note.x, top: place.note.y, maxWidth: a.width, animationDelay: `${delay + 380}ms` }}
        >
          {a.note}
        </div>
      )}
    </>
  )
}

export function AnnotationLayer({
  annotations,
  children,
  className,
}: {
  annotations: Anno[]
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [boxes, setBoxes] = useState<Record<string, Box>>({})

  const measure = useCallback(() => {
    const root = ref.current
    if (!root) return
    const base = root.getBoundingClientRect()
    const next: Record<string, Box> = {}
    for (const a of annotations) {
      const el = root.querySelector(`[data-anno="${a.target}"]`)
      if (!el) continue
      const r = el.getBoundingClientRect()
      next[a.id] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }
    }
    setBoxes((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
  }, [annotations])

  useLayoutEffect(measure, [measure])

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    window.addEventListener('resize', measure)
    // Handwriting and mono fonts change widths once they load.
    document.fonts?.ready.then(measure).catch(() => {})
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  return (
    <div ref={ref} className={`anno-layer${className ? ` ${className}` : ''}`}>
      {children}
      {annotations.map((a) => (boxes[a.id] ? <Annotation key={a.id} a={a} box={boxes[a.id]} /> : null))}
    </div>
  )
}
