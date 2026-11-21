import { findLesson, findProject, unitsFor } from '../content.ts'
import { AnnotationLayer, type Anno } from '../design/Annotations.tsx'
import { checkMark } from '../design/sketch.ts'
import { STEP_KINDS } from '../engine/types.ts'
import { dueCards, type Progress } from '../progress/model.ts'
import { lessonHref } from '../router.ts'
import { whereYouAre } from './whereYouAre.ts'

function Tick({ id }: { id: string }) {
  let seed = 0
  for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  return (
    <svg className="tree-tick" viewBox="0 0 20 20" aria-hidden>
      <path d={checkMark(2, 2, 16, seed % 97)} pathLength={1} className="draw" />
    </svg>
  )
}

/**
 * The course map as a terminal `tree`: units, then lessons, with the tutor's
 * marks on top: ticks on finished lessons, a circle around "you are here",
 * and a yellow dot on lessons with reviews due.
 */
export function TrackTree({ trackId, progress, compact = false }: { trackId: string; progress: Progress; compact?: boolean }) {
  const units = unitsFor(trackId)
  const here = whereYouAre(trackId, progress)
  const due = new Set(dueCards(progress, new Date()).map((c) => c.lessonId))
  const annos: Anno[] = here
    ? [{ id: `here-${here.id}`, target: `here`, mark: 'circle', color: 'blue', note: 'you are here', side: 'right', dx: 26, dy: -24, width: 140, delay: 200 }]
    : []

  return (
    <AnnotationLayer annotations={annos} className="track-tree-wrap">
      <ul className="track-tree" aria-label="Units and lessons">
        {units.map((u, ui) => {
          const lastUnit = ui === units.length - 1
          const done = u.lessons.filter((id) => progress.lessons[id]?.completedAt).length
          const total = u.lessons.length
          return (
            <li key={u.id} className="tree-unit">
              <div className="tree-row unit-row">
                <span className="tree-branch">{lastUnit && !compact ? '└─ ' : '├─ '}</span>
                <span className="unit-no">unit {ui + 1}</span>
                <span className="unit-title">{u.title}</span>
                <span className="unit-meter" aria-label={`${done} of ${total} lessons done`}>
                  [{'█'.repeat(done)}
                  {'░'.repeat(total - done)}] {done}/{total}
                </span>
              </div>
              <ul>
                {u.lessons.map((id, li) => {
                  const l = findLesson(id)!
                  const s = progress.lessons[id]
                  const steps = STEP_KINDS.filter((k) => s?.done[k]).length
                  const complete = Boolean(s?.completedAt)
                  const isHere = here?.kind === 'lesson' && here.id === id
                  const lastRow = li === u.lessons.length - 1 && !u.project && compact
                  return (
                    <li key={id} className={`tree-row lesson-row${complete ? ' done' : ''}${isHere ? ' here' : ''}`}>
                      <span className="tree-branch">
                        {lastUnit && !compact ? '   ' : '│  '}
                        {lastRow ? '└─ ' : '├─ '}
                      </span>
                      <a href={lessonHref(id)} className="lesson-link">
                        <span className="tree-no">{String(l.order).padStart(2, '0')}</span>
                        <span data-anno={isHere ? 'here' : undefined} className="lesson-name">
                          {l.title}
                        </span>
                      </a>
                      {complete && <Tick id={id} />}
                      {due.has(id) && <span className="review-dot" title="reviews due" aria-label="reviews due" />}
                      {!compact && (
                        <span className="lesson-meta">
                          {l.minutes} min · {complete ? 'done' : steps > 0 ? `${steps}/${STEP_KINDS.length} steps` : 'not started'}
                        </span>
                      )}
                      {!compact && (
                        <a href={lessonHref(id)} className="tt-btn small bracket tree-go">
                          {complete ? 'again' : steps > 0 ? 'continue' : 'start'}
                        </a>
                      )}
                    </li>
                  )
                })}
                {u.project && (
                  <li className={`tree-row extra-row${progress.projects[u.project] ? ' done' : ''}`}>
                    <span className="tree-branch">
                      {lastUnit && !compact ? '   ' : '│  '}
                      {'├─ '}
                    </span>
                    <a href={`#/project/${u.project}`} className="lesson-link">
                      <span className="tree-no">▸</span>
                      <span className="lesson-name" data-anno={here?.kind === 'project' && here.id === u.project ? 'here' : undefined}>
                        mini project: {findProject(u.project)?.title ?? u.project}
                      </span>
                    </a>
                    {progress.projects[u.project] ? <Tick id={u.project} /> : null}
                  </li>
                )}
                <li className={`tree-row extra-row${progress.unitReviews[u.id] ? ' done' : ''}`}>
                  <span className="tree-branch">
                    {lastUnit && !compact ? '   ' : '│  '}
                    {'└─ '}
                  </span>
                  <a href={`#/unit-review/${u.id}`} className="lesson-link">
                    <span className="tree-no">▸</span>
                    <span className="lesson-name">unit review: mixed practice</span>
                  </a>
                  {progress.unitReviews[u.id] ? <Tick id={`${u.id}-review`} /> : null}
                </li>
              </ul>
            </li>
          )
        })}
        {!compact && (
          <li className="tree-row more-row">
            <span className="tree-branch">{'   '}</span>
            <span className="box-label">more units are being written</span>
          </li>
        )}
      </ul>
    </AnnotationLayer>
  )
}

/** A plain list version (for screen readers, phones and anyone who prefers it). */
export function TrackList({ trackId, progress }: { trackId: string; progress: Progress }) {
  return (
    <ol className="track-list">
      {unitsFor(trackId).map((u, ui) => (
        <li key={u.id}>
          <h3>
            Unit {ui + 1}: {u.title}
          </h3>
          <p className="muted">{u.summary}</p>
          <ol>
            {u.lessons.map((id) => {
              const l = findLesson(id)!
              const done = Boolean(progress.lessons[id]?.completedAt)
              return (
                <li key={id}>
                  <a href={lessonHref(id)}>
                    {l.order}. {l.title}
                  </a>{' '}
                  <span className="muted">
                    ({l.minutes} min{done ? ', done' : ''})
                  </span>
                </li>
              )
            })}
            {u.project && (
              <li>
                <a href={`#/project/${u.project}`}>Mini project: {findProject(u.project)?.title}</a>
                {progress.projects[u.project] ? <span className="muted"> (done)</span> : null}
              </li>
            )}
            <li>
              <a href={`#/unit-review/${u.id}`}>Unit review</a>
            </li>
          </ol>
        </li>
      ))}
    </ol>
  )
}
