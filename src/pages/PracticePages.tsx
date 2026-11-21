import { useMemo, useState } from 'react'
import { Mascot } from '../brand/Mascot.tsx'
import { InlineText } from '../components/RichText.tsx'
import { findLesson, findProject, findUnit } from '../content.ts'
import { rng } from '../design/sketch.ts'
import { Terminal } from '../design/Terminal.tsx'
import { TypedHeading } from '../design/TypedHeading.tsx'
import { PracticeItem, PracticeProvider, type Outcome, type PracticeKind } from '../lesson/Practice.tsx'
import { CodeTaskView } from '../lesson/steps/CodeTaskStep.tsx'
import { addDays, completeProject, completeUnitReview, dayKey, dueCards, interleave, reviewCard, type Card } from '../progress/model.ts'
import { updateProgress, useProgress } from '../progress/store.ts'
import { NotFound } from './NotFound.tsx'

const KIND_LABEL: Record<PracticeKind, string> = {
  predict: 'predict',
  faded: 'fill the blanks',
  fix: 'fix the bug',
  modify: 'modify',
  make: 'make it',
  recall: 'from memory',
}

/** Review: due cards, one at a time, mixed across lessons. */
export function ReviewPage() {
  const p = useProgress()
  // The session is fixed when the page opens, so answering a card does not reshuffle it.
  const [cards] = useState<Card[]>(() => interleave(dueCards(p, new Date()), 20))
  const [i, setI] = useState(0)
  const [results, setResults] = useState<Outcome[]>([])

  const finish = (card: Card, outcome: Outcome) => {
    updateProgress((x) => reviewCard(x, card.id, outcome, new Date()))
    setResults((r) => [...r, outcome])
    setI((n) => n + 1)
  }

  if (cards.length === 0) {
    const upcoming = Object.values(p.cards)
      .map((c) => c.due)
      .sort()[0]
    return (
      <main className="page">
        <span className="box-label">{'> review'}</span>
        <TypedHeading level={1} text="Review" className="page-title" />
        <Terminal title="review">
          <div className="term-pad sp-empty">
            <Mascot size={44} />
            <div>
              <div className="box-label">{'> 0 cards due'}</div>
              <div className="sp-hand sp-hand-big">{Object.keys(p.cards).length ? 'all caught up. nice.' : 'finish a lesson and its exercises come back here.'}</div>
              {upcoming && <div className="box-label">{`next card due ${upcoming === addDays(dayKey(new Date()), 1) ? 'tomorrow' : upcoming}`}</div>}
            </div>
          </div>
        </Terminal>
      </main>
    )
  }

  if (i >= cards.length) {
    const right = results.filter((r) => r === 'correct').length
    return (
      <main className="page">
        <span className="box-label">{`> session done · ${cards.length} cards · +${cards.length * 5} xp`}</span>
        <TypedHeading level={1} text="Done for now." className="page-title" />
        <p className="lede">
          {right} of {cards.length} without help. Cards you got come back later and later; the others come back tomorrow.
        </p>
        <Mascot size={48} mood="bounce" />
        <p>
          <a className="tt-btn primary" href="#/">
            Back to your dashboard →
          </a>
        </p>
      </main>
    )
  }

  const card = cards[i]
  const lesson = findLesson(card.lessonId)
  return (
    <main className="page practice-page">
      <div className="practice-head">
        <span className="box-label">
          {`> review · card ${i + 1} of ${cards.length} · ${KIND_LABEL[card.kind]} · from `}
          <a href={`#/lesson/${card.lessonId}`}>{lesson?.title.toLowerCase()}</a>
        </span>
        <ol className="tt-steps" aria-hidden>
          {cards.map((_, k) => (
            <li key={k} className={`tt-step${k < i ? ' done' : k === i ? ' current' : ''}`} />
          ))}
        </ol>
      </div>
      <PracticeItem key={card.id} lessonId={card.lessonId} kind={card.kind} itemId={card.itemId} onFinish={(o) => finish(card, o)} />
    </main>
  )
}

/** Unit review: an interleaved mix of Predict, Faded, Fix and Make from the unit's lessons. */
export function UnitReviewPage({ id }: { id: string }) {
  const found = findUnit(id)
  const items = useMemo(() => {
    if (!found) return []
    const all: { lessonId: string; kind: PracticeKind; itemId: string }[] = []
    for (const lid of found.unit.lessons) {
      const l = findLesson(lid)
      if (!l) continue
      all.push(...l.predict.map((x) => ({ lessonId: lid, kind: 'predict' as const, itemId: x.id })))
      all.push(...l.faded.map((x) => ({ lessonId: lid, kind: 'faded' as const, itemId: x.id })))
      all.push(...l.fix.map((x) => ({ lessonId: lid, kind: 'fix' as const, itemId: x.id })))
      all.push(...l.make.map((x) => ({ lessonId: lid, kind: 'make' as const, itemId: x.id })))
    }
    // Shuffle so kinds and lessons are mixed, not in lesson order.
    const r = rng(all.length * 13 + 1)
    for (let k = all.length - 1; k > 0; k--) {
      const j = Math.floor(r() * (k + 1))
      ;[all[k], all[j]] = [all[j], all[k]]
    }
    return all.slice(0, 15)
  }, [found])
  const [i, setI] = useState(0)

  if (!found) return <NotFound />
  const { unit, track } = found

  if (i >= items.length) {
    return (
      <main className="page">
        <span className="box-label">{`> unit review done · ${items.length} items`}</span>
        <TypedHeading level={1} text={`${unit.title}: reviewed.`} className="page-title" />
        <Mascot size={48} mood="bounce" />
        <p>
          <a className="tt-btn primary" href={`#/track/${track.id}`}>
            Back to {track.title} →
          </a>
        </p>
      </main>
    )
  }

  const it = items[i]
  const next = () => {
    if (i + 1 >= items.length) updateProgress((p) => completeUnitReview(p, unit.id, new Date()))
    setI(i + 1)
  }
  return (
    <main className="page practice-page">
      <div className="practice-head">
        <span className="box-label">{`> unit review: ${unit.title.toLowerCase()} · ${i + 1} of ${items.length} · ${KIND_LABEL[it.kind]}`}</span>
        <ol className="tt-steps" aria-hidden>
          {items.map((_, k) => (
            <li key={k} className={`tt-step${k < i ? ' done' : k === i ? ' current' : ''}`} />
          ))}
        </ol>
      </div>
      <PracticeItem key={`${it.lessonId}:${it.itemId}:${i}`} lessonId={it.lessonId} kind={it.kind} itemId={it.itemId} onFinish={next} />
    </main>
  )
}

/** The unit's mini project: a bigger Make task with step by step hints. */
export function ProjectPage({ id }: { id: string }) {
  const project = findProject(id)
  const p = useProgress()
  const found = project ? findUnit(project.unit) : undefined
  const [shownHints, setShownHints] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const [redo, setRedo] = useState(false)
  if (!project || !found) return <NotFound />
  const lesson = findLesson(found.unit.lessons[0])!
  const task = {
    id: project.id,
    prompt: project.prompt,
    start: project.starter ?? [],
    solution: project.solution,
    tests: project.tests,
    hints: [],
  }
  const steps = (
    <div className="project-extra">
      <ol className="project-steps">
        {project.steps.map((s, k) => (
          <li key={k}>
            <InlineText text={s.text} />{' '}
            {shownHints.includes(k) ? (
              <span className="hint-inline">
                <span className="hint-tag">hint</span> <InlineText text={s.hint} />
              </span>
            ) : (
              <button className="tt-btn prompt small" onClick={() => setShownHints((h) => [...h, k])}>
                {' hint'}
              </button>
            )}
          </li>
        ))}
      </ol>
      {project.output && (
        <Terminal title="expected output">
          <pre className="toutput">{project.output}</pre>
        </Terminal>
      )}
    </div>
  )
  return (
    <main className="page lesson-v2">
      <nav className="crumbs box-label" aria-label="Breadcrumb">
        <a href="#/course">course</a> / <a href={`#/track/${found.track.id}`}>{found.track.title.toLowerCase()}</a> /{' '}
        <span>{found.unit.title.toLowerCase()}</span>
      </nav>
      <TypedHeading level={1} text={`Mini project: ${project.title}`} className="page-title" />
      <p className="lede">{project.summary}</p>
      {(done || p.projects[project.id]) && !redo ? (
        <div className="lesson-complete">
          <span className="box-label">{`> project complete${done ? ' · +100 xp' : ''}`}</span>
          <h2>Nice work. You built the whole thing.</h2>
          <div className="row-gap">
            <a className="tt-btn primary" href={`#/unit-review/${found.unit.id}`}>
              Unit review →
            </a>
            <a className="tt-btn bracket" href={`#/track/${found.track.id}`}>
              back to the course
            </a>
            <button className="tt-btn prompt" onClick={() => (setDone(false), setRedo(true))}>
              {' do it again'}
            </button>
          </div>
        </div>
      ) : (
        <PracticeProvider lesson={{ ...lesson, language: project.language }} onWeak={() => {}}>
          {() => (
            <CodeTaskView
              kind="project"
              task={task}
              index={0}
              count={1}
              solvedList={[false]}
              file="project.py"
              extra={steps}
              onSolved={() => updateProgress((x) => completeProject(x, project.id, new Date()))}
              onNext={() => (setDone(true), setRedo(false))}
            />
          )}
        </PracticeProvider>
      )}
    </main>
  )
}
