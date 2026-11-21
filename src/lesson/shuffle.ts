import { rng } from '../design/sketch.ts'

/** A stable shuffled order of n options (same seed, same order), so the right
 * answer is not always in the same place. */
export function shuffledOrder(n: number, seedText: string): number[] {
  let seed = 7
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) % 100000
  const r = rng(seed)
  const o = Array.from({ length: n }, (_, i) => i)
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[o[i], o[j]] = [o[j], o[i]]
  }
  return o
}
