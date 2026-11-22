import type { TraceStep } from '../../engine/types.ts'

// Logic for the Unit 5 list cells: what changed in a list since the step
// before (new cells, replaced cells, removed items). Every value comes from the trace.

export type CellMark = 'same' | 'new' | 'changed'

export interface ListChange {
  /** One mark per item of the list now. */
  marks: CellMark[]
  /** For a changed cell, the value it had before. */
  was: (string | undefined)[]
  /** Items that left the list, with the position they had before. */
  removed: { at: number; repr: string }[]
}

/** Items of a list variable at one step, or null when it is not a list there. */
export function listItemsAt(trace: TraceStep[], index: number, name: string): string[] | null {
  const step = trace[index]
  const v = step?.vars[name]
  if (!v?.ref) return null
  const o = step.heap?.[v.ref]
  return o && o.kind === 'list' ? o.items.map((x) => x.repr) : null
}

/** Compare a list before and after one step. Uses the longest run of items
 * kept in order, so an insert slides the later items right and a removal
 * slides them left. A removal and an add at the same place count as one
 * replaced cell (items[1] = x). */
export function listChange(before: string[] | null, now: string[]): ListChange {
  const marks: CellMark[] = now.map(() => 'same')
  const was: (string | undefined)[] = now.map(() => undefined)
  if (!before) return { marks, was, removed: [] }
  const n = before.length
  const m = now.length
  // lcs[i][j]: longest common run of before[i:] and now[j:]
  const lcs = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = before[i] === now[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }
  const gone: number[] = []
  const added: number[] = []
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && before[i] === now[j]) {
      i++
      j++
    } else if (j < m && (i >= n || lcs[i][j + 1] >= lcs[i + 1][j])) {
      added.push(j++)
    } else {
      gone.push(i++)
    }
  }
  const removed: { at: number; repr: string }[] = []
  for (const at of gone) {
    // Removed and added at the same position: a replacement.
    const k = added.indexOf(at)
    if (k >= 0) {
      marks[at] = 'changed'
      was[at] = before[at]
      added.splice(k, 1)
    } else {
      removed.push({ at, repr: before[at] })
    }
  }
  for (const a of added) marks[a] = 'new'
  return { marks, was, removed }
}
