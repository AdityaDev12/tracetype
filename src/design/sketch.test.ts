import { describe, expect, it } from 'vitest'
import { arrow, checkMark, rng, roughEllipse, roughRect, wavyLine } from './sketch.ts'

describe('sketch paths', () => {
  it('rng is deterministic per seed', () => {
    const a = rng(42)
    const b = rng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(rng(1)()).not.toBe(rng(2)())
  })

  it('the same seed gives the same mark (no jitter between renders)', () => {
    expect(roughEllipse(50, 20, 30, 10, 3)).toBe(roughEllipse(50, 20, 30, 10, 3))
    expect(roughEllipse(50, 20, 30, 10, 3)).not.toBe(roughEllipse(50, 20, 30, 10, 4))
  })

  it('produces valid looking SVG path data', () => {
    for (const d of [
      roughEllipse(0, 0, 10, 5),
      wavyLine(0, 100, 10),
      arrow({ x: 0, y: 0 }, { x: 50, y: 20 }).shaft,
      arrow({ x: 0, y: 0 }, { x: 50, y: 20 }).head,
      checkMark(0, 0),
      roughRect(0, 0, 20, 10),
    ]) {
      expect(d).toMatch(/^M-?\d/)
      expect(d).not.toMatch(/NaN|undefined/)
    }
  })

  it('the arrow ends exactly at the target', () => {
    const { shaft } = arrow({ x: 0, y: 0 }, { x: 80, y: 30 })
    expect(shaft.endsWith('80 30')).toBe(true)
  })

  it('a wavy line spans from x1 to x2', () => {
    const d = wavyLine(10, 90, 5)
    expect(d.startsWith('M10 ')).toBe(true)
    expect(d).toMatch(/ 90 [\d.]+$/)
  })
})
