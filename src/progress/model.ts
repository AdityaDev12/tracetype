import type { Lesson, StepKind } from '../engine/types.ts'

// Progress v2: steps, resume position, XP, streak days, review cards and
// settings. Pure functions only (the store in store.ts saves it).

export const XP = { step: 10, lesson: 50, project: 100, card: 5, unitReview: 30 }

/** Review intervals in days (docs/PLAN.md section 5). */
export const INTERVALS = [1, 3, 7, 14, 30, 60]

export type CardKind = 'predict' | 'faded' | 'fix' | 'recall' | 'make'

export interface Card {
  id: string
  lessonId: string
  kind: CardKind
  /** Item id in the lesson (for recall: "recall-<n>"). */
  itemId: string
  /** Index into INTERVALS. */
  box: number
  /** Local date (YYYY-MM-DD) the card is due. */
  due: string
  reviews: number
}

export interface LessonState {
  /** Step to resume at. */
  step: number
  /** Item to resume at, per step kind. */
  item: Partial<Record<StepKind, number>>
  done: Partial<Record<StepKind, number>>
  /** Items where "Show answer" was used. */
  weak: string[]
  completedAt?: number
}

export interface Settings {
  mascot: boolean
  texture: boolean
}

export interface Progress {
  version: 2
  lessons: Record<string, LessonState>
  projects: Record<string, number>
  unitReviews: Record<string, number>
  cards: Record<string, Card>
  xp: number
  /** Local dates with at least one finished step or review. */
  days: string[]
  settings: Settings
  /** Last lesson opened, for "continue where you left off". */
  last?: string
}

export const emptyProgress = (): Progress => ({
  version: 2,
  lessons: {},
  projects: {},
  unitReviews: {},
  cards: {},
  xp: 0,
  days: [],
  settings: { mascot: true, texture: true },
})

// ---------- Dates ----------

export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + n))
}

/** Monday of the week the day is in, used for the weekly rest day. */
function weekOf(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const back = (date.getDay() + 6) % 7
  return dayKey(new Date(y, m - 1, d - back))
}

function markDay(p: Progress, now: Date): Progress {
  const k = dayKey(now)
  return p.days.includes(k) ? p : { ...p, days: [...p.days, k].sort() }
}

// ---------- Lessons ----------

const lessonState = (p: Progress, id: string): LessonState => p.lessons[id] ?? { step: 0, item: {}, done: {}, weak: [] }

function withLesson(p: Progress, id: string, fn: (s: LessonState) => LessonState): Progress {
  return { ...p, lessons: { ...p.lessons, [id]: fn(lessonState(p, id)) } }
}

export function setPosition(p: Progress, lessonId: string, step: number, kind?: StepKind, item?: number): Progress {
  const next = withLesson(p, lessonId, (s) => ({
    ...s,
    step,
    item: kind !== undefined && item !== undefined ? { ...s.item, [kind]: item } : s.item,
  }))
  return { ...next, last: lessonId }
}

export function completeStep(p: Progress, lessonId: string, kind: StepKind, now: Date): Progress {
  const s = lessonState(p, lessonId)
  if (s.done[kind]) return p
  const next = withLesson(p, lessonId, (x) => ({ ...x, done: { ...x.done, [kind]: now.getTime() } }))
  return markDay({ ...next, xp: next.xp + XP.step }, now)
}

export function markWeak(p: Progress, lessonId: string, itemId: string): Progress {
  return withLesson(p, lessonId, (s) => (s.weak.includes(itemId) ? s : { ...s, weak: [...s.weak, itemId] }))
}

/** Review cards a finished lesson creates: Predict, Faded, Fix, Recall and Make items. */
export function cardsFor(lesson: Lesson): { kind: CardKind; itemId: string }[] {
  return [
    ...lesson.predict.map((x) => ({ kind: 'predict' as const, itemId: x.id })),
    ...lesson.faded.map((x) => ({ kind: 'faded' as const, itemId: x.id })),
    ...lesson.fix.map((x) => ({ kind: 'fix' as const, itemId: x.id })),
    ...lesson.recall.map((_, i) => ({ kind: 'recall' as const, itemId: `recall-${i}` })),
    ...lesson.make.map((x) => ({ kind: 'make' as const, itemId: x.id })),
  ]
}

export function completeLesson(p: Progress, lesson: Lesson, now: Date): Progress {
  const s = lessonState(p, lesson.id)
  if (s.completedAt) return p
  const today = dayKey(now)
  const cards = { ...p.cards }
  for (const c of cardsFor(lesson)) {
    const id = `${lesson.id}:${c.itemId}`
    if (cards[id]) continue
    // Items where the learner gave up come back today; the rest tomorrow.
    const weak = s.weak.includes(c.itemId)
    cards[id] = { id, lessonId: lesson.id, kind: c.kind, itemId: c.itemId, box: 0, due: weak ? today : addDays(today, INTERVALS[0]), reviews: 0 }
  }
  const next = withLesson({ ...p, cards }, lesson.id, (x) => ({ ...x, completedAt: now.getTime() }))
  return markDay({ ...next, xp: next.xp + XP.lesson }, now)
}

// ---------- Review ----------

/** Correct moves a card up one interval. "Show answer" sends it back to 1 day.
 * Wrong tries before getting it right do not move it down. */
export function reviewCard(p: Progress, cardId: string, outcome: 'correct' | 'gaveUp', now: Date): Progress {
  const card = p.cards[cardId]
  if (!card) return p
  const today = dayKey(now)
  const box = outcome === 'correct' ? Math.min(card.box + 1, INTERVALS.length - 1) : 0
  const due = addDays(today, INTERVALS[box])
  const next = { ...p, cards: { ...p.cards, [cardId]: { ...card, box, due, reviews: card.reviews + 1 } }, xp: p.xp + XP.card }
  return markDay(next, now)
}

export function dueCards(p: Progress, now: Date): Card[] {
  const today = dayKey(now)
  return Object.values(p.cards)
    .filter((c) => c.due <= today)
    .sort((a, b) => (a.due === b.due ? a.id.localeCompare(b.id) : a.due.localeCompare(b.due)))
}

/** Mix cards so the same lesson rarely comes twice in a row (interleaving). */
export function interleave(cards: Card[], max = 20): Card[] {
  const groups = new Map<string, Card[]>()
  for (const c of cards) groups.set(c.lessonId, [...(groups.get(c.lessonId) ?? []), c])
  const out: Card[] = []
  const queues = [...groups.values()]
  while (out.length < max && queues.some((q) => q.length)) {
    for (const q of queues) {
      const c = q.shift()
      if (c) out.push(c)
      if (out.length >= max) break
    }
  }
  // Within one lesson, also alternate kinds.
  return out
}

/** For testing on a single day: make every card due today. */
export function makeAllDue(p: Progress, now: Date): Progress {
  const today = dayKey(now)
  const cards: Record<string, Card> = {}
  for (const [id, c] of Object.entries(p.cards)) cards[id] = { ...c, due: today }
  return { ...p, cards }
}

// ---------- Projects and unit reviews ----------

export function completeProject(p: Progress, id: string, now: Date): Progress {
  if (p.projects[id]) return p
  return markDay({ ...p, projects: { ...p.projects, [id]: now.getTime() }, xp: p.xp + XP.project }, now)
}

export function completeUnitReview(p: Progress, unitId: string, now: Date): Progress {
  const first = !p.unitReviews[unitId]
  const next = { ...p, unitReviews: { ...p.unitReviews, [unitId]: now.getTime() }, xp: p.xp + (first ? XP.unitReview : 0) }
  return markDay(next, now)
}

// ---------- Streak and level ----------

/**
 * Days in a row with activity. Today does not break the streak until it is
 * over. One missed day per week is a free rest day.
 */
export function streak(days: string[], now: Date): number {
  const set = new Set(days)
  let d = dayKey(now)
  if (!set.has(d)) d = addDays(d, -1)
  let count = 0
  const restWeeks = new Set<string>()
  for (let i = 0; i < 3650; i++) {
    if (set.has(d)) {
      count++
    } else {
      const w = weekOf(d)
      // A rest day only counts if the streak continues on the day before it.
      if (count === 0 || restWeeks.has(w) || !set.has(addDays(d, -1))) break
      restWeeks.add(w)
    }
    d = addDays(d, -1)
  }
  return count
}

/** Level n needs 100 * n * (n - 1) / 2 XP: 0, 100, 300, 600, 1000, ... */
export function level(xp: number): { level: number; into: number; span: number } {
  let n = 1
  while (100 * ((n + 1) * n) / 2 <= xp) n++
  const base = (100 * n * (n - 1)) / 2
  const span = 100 * n
  return { level: n, into: xp - base, span }
}

// ---------- Export, import, migration ----------

export function exportProgress(p: Progress): string {
  return JSON.stringify({ app: 'tracetype', ...p }, null, 2)
}

export function importProgress(text: string): Progress {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That is not valid progress data (it is not JSON).')
  }
  const d = data as Partial<Progress> & { app?: string }
  if (!d || typeof d !== 'object' || d.version !== 2 || typeof d.lessons !== 'object' || typeof d.xp !== 'number') {
    throw new Error('That does not look like TraceType progress.')
  }
  const base = emptyProgress()
  return {
    version: 2,
    lessons: d.lessons ?? {},
    projects: d.projects ?? {},
    unitReviews: d.unitReviews ?? {},
    cards: d.cards ?? {},
    xp: d.xp,
    days: Array.isArray(d.days) ? d.days.filter((x) => typeof x === 'string') : [],
    settings: { ...base.settings, ...(d.settings ?? {}) },
    last: d.last,
  }
}

/**
 * v1 saved four modes per lesson (learn, trace, recall, quiz). Map them onto
 * the v2 steps that do the same job. The lesson is not marked complete, since
 * v2 has many new steps.
 */
export function migrateV1(v1: unknown, now: Date): Progress {
  const p = emptyProgress()
  if (!v1 || typeof v1 !== 'object') return p
  const map: Record<string, StepKind[]> = { learn: ['intro'], trace: ['examples'], recall: ['recall'], quiz: ['quiz'] }
  let out = p
  for (const [lessonId, modes] of Object.entries(v1 as Record<string, Record<string, { done?: boolean }>>)) {
    for (const [mode, info] of Object.entries(modes ?? {})) {
      if (!info?.done) continue
      for (const kind of map[mode] ?? []) out = completeStep(out, lessonId, kind, now)
    }
  }
  return out
}
