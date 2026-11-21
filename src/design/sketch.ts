// Hand-drawn SVG paths for the tutor's pen: wobbly circles, wavy underlines,
// curved arrows and check marks. Seeded, so the same mark always looks the same
// (no jitter on re-render). Pure functions: easy to test, no DOM.

export interface Pt {
  x: number
  y: number
}

/** Small deterministic random generator (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n: number) => Math.round(n * 10) / 10

/** Smooth curve through points (Catmull-Rom turned into cubic Beziers). */
export function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return ''
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`
  }
  return d
}

/** A loop drawn by hand around a box: not closed perfectly, it overshoots its start. */
export function roughEllipse(cx: number, cy: number, rx: number, ry: number, seed = 1): string {
  const r = rng(seed)
  const start = -Math.PI * (0.6 + r() * 0.3)
  const sweep = Math.PI * 2 + 0.45 + r() * 0.25
  const n = 18
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = start + sweep * t
    // Radius drifts slightly over the loop, like a real pen stroke.
    const k = 1 + (t - 0.5) * 0.08 + (r() - 0.5) * 0.05
    pts.push({ x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k })
  }
  return smoothPath(pts)
}

/** A wavy underline from x1 to x2. */
export function wavyLine(x1: number, x2: number, y: number, seed = 1, amp = 2.2, wave = 9): string {
  const r = rng(seed)
  const pts: Pt[] = []
  const steps = Math.max(2, Math.round((x2 - x1) / (wave / 2)))
  for (let i = 0; i <= steps; i++) {
    const x = x1 + ((x2 - x1) * i) / steps
    pts.push({ x, y: y + (i % 2 === 0 ? -amp : amp) * (0.8 + r() * 0.4) })
  }
  return smoothPath(pts)
}

/** A slightly bowed straight-ish line. */
export function roughLine(a: Pt, b: Pt, seed = 1, bow = 0.04): string {
  const r = rng(seed)
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const off = (r() - 0.5) * 2 * bow * len
  const mid = { x: (a.x + b.x) / 2 - (dy / len) * off, y: (a.y + b.y) / 2 + (dx / len) * off }
  return `M${f(a.x)} ${f(a.y)} Q${f(mid.x)} ${f(mid.y)} ${f(b.x)} ${f(b.y)}`
}

/** A curved arrow: the shaft, plus a separate path for the head (two short strokes). */
export function arrow(from: Pt, to: Pt, seed = 1, bend = 0.25): { shaft: string; head: string } {
  const r = rng(seed)
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const b = bend * (0.85 + r() * 0.3) * len
  const ctrl = { x: (from.x + to.x) / 2 - (dy / len) * b, y: (from.y + to.y) / 2 + (dx / len) * b }
  const shaft = `M${f(from.x)} ${f(from.y)} Q${f(ctrl.x)} ${f(ctrl.y)} ${f(to.x)} ${f(to.y)}`
  // Direction at the tip follows the tangent from the control point.
  const ang = Math.atan2(to.y - ctrl.y, to.x - ctrl.x)
  const hl = 9
  const spread = 0.5
  const h1 = { x: to.x - Math.cos(ang - spread) * hl, y: to.y - Math.sin(ang - spread) * hl }
  const h2 = { x: to.x - Math.cos(ang + spread) * hl, y: to.y - Math.sin(ang + spread) * hl }
  const head = `M${f(h1.x)} ${f(h1.y)} L${f(to.x)} ${f(to.y)} L${f(h2.x)} ${f(h2.y)}`
  return { shaft, head }
}

/** A quick check mark with its bottom-left corner near (x, y + size). */
export function checkMark(x: number, y: number, size = 16, seed = 1): string {
  const r = rng(seed)
  const j = () => (r() - 0.5) * size * 0.08
  const a = { x: x + j(), y: y + size * 0.55 + j() }
  const b = { x: x + size * 0.35 + j(), y: y + size * 0.9 + j() }
  const c = { x: x + size * 1.05 + j(), y: y + j() }
  return smoothPath([a, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + size * 0.04 }, b, { x: (b.x + c.x) / 2 - size * 0.05, y: (b.y + c.y) / 2 }, c])
}

/** A rectangle drawn by hand: four strokes that overshoot the corners a little. */
export function roughRect(x: number, y: number, w: number, h: number, seed = 1): string {
  const r = rng(seed)
  const o = () => (r() - 0.3) * 2.2
  const sides: [Pt, Pt][] = [
    [{ x: x - o(), y: y + o() * 0.4 }, { x: x + w + o(), y: y + o() * 0.4 }],
    [{ x: x + w + o() * 0.4, y: y - o() }, { x: x + w + o() * 0.4, y: y + h + o() }],
    [{ x: x + w + o(), y: y + h + o() * 0.4 }, { x: x - o(), y: y + h + o() * 0.4 }],
    [{ x: x + o() * 0.4, y: y + h + o() }, { x: x + o() * 0.4, y: y - o() }],
  ]
  return sides.map(([a, b], i) => roughLine(a, b, seed * 7 + i, 0.02)).join(' ')
}
