import { describe, expect, it } from 'vitest'
import lessonJson from '../../content/lessons/python/py-01-variables.json'
import type { Lesson } from '../engine/types.ts'
import {
  addDays,
  cardsFor,
  completeLesson,
  completeStep,
  dayKey,
  dueCards,
  emptyProgress,
  exportProgress,
  importProgress,
  interleave,
  level,
  makeAllDue,
  markWeak,
  migrateV1,
  reviewCard,
  streak,
  XP,
} from './model.ts'

const lesson = lessonJson as unknown as Lesson
const day = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

describe('steps and XP', () => {
  it('gives XP once per step and records the day', () => {
    let p = completeStep(emptyProgress(), 'l1', 'intro', day('2026-11-20'))
    p = completeStep(p, 'l1', 'intro', day('2026-11-20'))
    expect(p.xp).toBe(XP.step)
    expect(p.days).toEqual(['2026-11-20'])
  })
})

describe('review cards', () => {
  it('a finished lesson makes cards for Predict, Faded, Fix, Recall and Make', () => {
    const kinds = new Set(cardsFor(lesson).map((c) => c.kind))
    expect([...kinds].sort()).toEqual(['faded', 'fix', 'make', 'predict', 'recall'])
    const p = completeLesson(emptyProgress(), lesson, day('2026-11-20'))
    expect(Object.keys(p.cards).length).toBe(cardsFor(lesson).length)
    expect(p.xp).toBe(XP.lesson)
  })

  it('new cards are due tomorrow, items you gave up on are due today', () => {
    let p = markWeak(emptyProgress(), lesson.id, 'f1')
    p = completeLesson(p, lesson, day('2026-11-20'))
    expect(p.cards[`${lesson.id}:f1`].due).toBe('2026-11-20')
    expect(p.cards[`${lesson.id}:p1`].due).toBe('2026-11-21')
    expect(dueCards(p, day('2026-11-20')).map((c) => c.itemId)).toEqual(['f1'])
    expect(dueCards(p, day('2026-11-21')).length).toBe(cardsFor(lesson).length)
  })

  it('correct moves up the intervals 1, 3, 7, 14, 30, 60 days', () => {
    let p = completeLesson(emptyProgress(), lesson, day('2026-11-20'))
    const id = `${lesson.id}:p1`
    const dues: string[] = []
    let today = '2026-11-21'
    for (let i = 0; i < 6; i++) {
      p = reviewCard(p, id, 'correct', day(today))
      dues.push(p.cards[id].due)
      today = p.cards[id].due
    }
    expect(dues).toEqual(['2026-11-24', '2026-12-01', '2026-12-15', '2027-01-14', '2027-03-15', '2027-05-14'])
  })

  it('show answer sends a card back to 1 day', () => {
    let p = completeLesson(emptyProgress(), lesson, day('2026-11-20'))
    const id = `${lesson.id}:p1`
    p = reviewCard(p, id, 'correct', day('2026-11-21'))
    p = reviewCard(p, id, 'gaveUp', day('2026-11-24'))
    expect(p.cards[id]).toMatchObject({ box: 0, due: '2026-11-25' })
  })

  it('interleaves cards from different lessons', () => {
    const c = (lessonId: string, n: number) => ({ id: `${lessonId}:${n}`, lessonId, kind: 'predict' as const, itemId: `${n}`, box: 0, due: '2026-01-01', reviews: 0 })
    const mixed = interleave([c('a', 1), c('a', 2), c('a', 3), c('b', 1), c('b', 2)])
    expect(mixed.map((x) => x.lessonId)).toEqual(['a', 'b', 'a', 'b', 'a'])
  })

  it('make all due is a testing helper', () => {
    const p = makeAllDue(completeLesson(emptyProgress(), lesson, day('2026-11-20')), day('2026-11-20'))
    expect(dueCards(p, day('2026-11-20')).length).toBe(cardsFor(lesson).length)
  })
})

describe('streak', () => {
  const days = (start: string, n: number) => Array.from({ length: n }, (_, i) => addDays(start, i))

  it('counts days in a row', () => {
    expect(streak(days('2026-11-16', 5), day('2026-11-20'))).toBe(5)
  })

  it('today does not break the streak before it is over', () => {
    expect(streak(days('2026-11-16', 4), day('2026-11-20'))).toBe(4)
  })

  it('one missed day a week is a free rest day', () => {
    // Mon 16, Tue 17, (Wed 18 missed), Thu 19, Fri 20
    expect(streak(['2026-11-16', '2026-11-17', '2026-11-19', '2026-11-20'], day('2026-11-20'))).toBe(4)
  })

  it('two missed days in the same week break it', () => {
    expect(streak(['2026-11-16', '2026-11-18', '2026-11-20'], day('2026-11-20'))).toBe(2)
  })

  it('is 0 with no recent activity', () => {
    expect(streak(['2026-11-01'], day('2026-11-20'))).toBe(0)
  })
})

describe('level', () => {
  it('grows with XP', () => {
    expect(level(0)).toEqual({ level: 1, into: 0, span: 100 })
    expect(level(99).level).toBe(1)
    expect(level(100)).toEqual({ level: 2, into: 0, span: 200 })
    expect(level(650)).toEqual({ level: 4, into: 50, span: 400 })
  })
})

describe('export, import, migration', () => {
  it('round-trips through export and import', () => {
    const p = completeLesson(emptyProgress(), lesson, day('2026-11-20'))
    expect(importProgress(exportProgress(p))).toEqual(p)
  })

  it('rejects data that is not progress', () => {
    expect(() => importProgress('nope')).toThrow(/not JSON/)
    expect(() => importProgress('{"a":1}')).toThrow(/does not look like/)
  })

  it('maps v1 modes onto v2 steps', () => {
    const p = migrateV1({ 'py-01-variables': { learn: { done: true }, quiz: { done: true, score: 5 } } }, day('2026-11-20'))
    expect(Object.keys(p.lessons['py-01-variables'].done).sort()).toEqual(['intro', 'quiz'])
    expect(p.lessons['py-01-variables'].completedAt).toBeUndefined()
  })

  it('dayKey uses the local date', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
