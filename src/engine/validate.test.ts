import { describe, expect, it } from 'vitest'
import lesson from '../../content/lessons/python-basics/py-01-variables.json'
import { validateLesson } from './validate.ts'

describe('validateLesson', () => {
  it('accepts lesson 1', () => {
    expect(validateLesson(lesson)).toEqual([])
  })

  it('requires at least one link', () => {
    expect(validateLesson({ ...lesson, links: [] }).join()).toMatch(/links/)
    expect(validateLesson({ ...lesson, links: undefined }).join()).toMatch(/links/)
  })

  it('requires https links with a title', () => {
    const bad = validateLesson({
      ...lesson,
      links: [
        { title: 'x', url: 'http://docs.python.org/3/' },
        { title: '', url: 'https://docs.python.org/3/' },
        { title: 'y', url: 'not a url' },
      ],
    })
    expect(bad.some((e) => e.includes('links[0].url'))).toBe(true)
    expect(bad.some((e) => e.includes('links[1]'))).toBe(true)
    expect(bad.some((e) => e.includes('links[2].url'))).toBe(true)
  })

  it('rejects duplicate links', () => {
    const l = { title: 'a', url: 'https://docs.python.org/3/' }
    expect(validateLesson({ ...lesson, links: [l, l] }).join()).toMatch(/twice/)
  })

  it('rejects em dashes in text', () => {
    expect(validateLesson({ ...lesson, summary: 'a \u2014 b' }).join()).toMatch(/dash/)
  })
})
