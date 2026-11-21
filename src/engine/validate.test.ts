import { describe, expect, it } from 'vitest'
import project from '../../content/projects/py-u1-project.json'
import lesson from '../../content/lessons/python/py-01-variables.json'
import { authored, canonicalJson } from './hash.ts'
import { validateLesson, validateProject } from './validate.ts'

const clone = () => JSON.parse(JSON.stringify(lesson))

describe('validateLesson (format v2)', () => {
  it('accepts lesson 1', () => {
    expect(validateLesson(lesson)).toEqual([])
  })

  it('fails a lesson that is missing a step', () => {
    const l = clone()
    delete l.parsons
    expect(validateLesson(l).join()).toMatch(/"parsons" needs at least 1/)
  })

  it('fails a lesson under the minimum counts', () => {
    const l = clone()
    l.quiz = l.quiz.slice(0, 5)
    l.examples = l.examples.slice(0, 2)
    const errors = validateLesson(l).join()
    expect(errors).toMatch(/"quiz" needs at least 6/)
    expect(errors).toMatch(/"examples" needs at least 3/)
  })

  it('needs an intro with an analogy', () => {
    const l = clone()
    l.intro.analogy = ''
    expect(validateLesson(l).join()).toMatch(/analogy/)
  })

  it('checks investigate answers against the real trace', () => {
    const l = clone()
    const q = l.investigate.find((x: { verify?: unknown }) => x.verify)
    q.answer = (q.answer + 1) % q.options.length
    expect(validateLesson(l).join()).toMatch(/real value/)
  })

  it('needs generated data on code items', () => {
    const l = clone()
    delete l.examples[0].gen
    expect(validateLesson(l).join()).toMatch(/examples\[0\]\.gen is missing/)
  })

  it('counts faded blanks against answers', () => {
    const l = clone()
    l.faded[1].answers = ['12']
    expect(validateLesson(l).join()).toMatch(/blanks/)
  })

  it('rejects em dashes in authored text', () => {
    const l = clone()
    l.summary = 'a — b'
    expect(validateLesson(l).join()).toMatch(/dash/)
  })

  it('requires https links', () => {
    const l = clone()
    l.links = [{ title: 'x', url: 'http://docs.python.org/3/' }]
    expect(validateLesson(l).join()).toMatch(/https/)
  })
})

describe('validateProject', () => {
  it('accepts the unit 1 project', () => {
    expect(validateProject(project)).toEqual([])
  })

  it('wants 20 to 40 lines', () => {
    expect(validateProject({ ...project, solution: project.solution.slice(0, 5) }).join()).toMatch(/20 to 40/)
  })
})

describe('canonical hash input', () => {
  it('sorts keys and drops gen, like the Python side', () => {
    expect(canonicalJson(authored({ b: 1, a: ['x', { d: 2, c: 'é' }], gen: { hash: 'z' } }))).toBe(
      '{"a":["x",{"c":"é","d":2}],"b":1}',
    )
  })
})
