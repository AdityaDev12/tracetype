import { Mascot } from '../brand/Mascot.tsx'
import { findLesson, findProject, tracks } from '../content.ts'
import { Terminal } from '../design/Terminal.tsx'
import { TypedHeading } from '../design/TypedHeading.tsx'
import { STEP_KINDS } from '../engine/types.ts'
import { STEP_LABELS } from '../lesson/labels.ts'
import { dueCards, level, streak } from '../progress/model.ts'
import { useProgress } from '../progress/store.ts'
import { lessonHref } from '../router.ts'
import { LevelBadge, StreakMark } from './Shell.tsx'
import { TrackTree } from './TrackTree.tsx'
import { whereYouAre } from './whereYouAre.ts'

/** Home for returning visitors: continue, reviews due, streak, level, the map. */
export function Dashboard() {
  const p = useProgress()
  const now = new Date()
  const due = dueCards(p, now).length
  const days = streak(p.days, now)
  const lv = level(p.xp)
  const track = tracks.find((t) => t.status === 'open')!
  const here = whereYouAre(track.id, p)

  // Continue: the last lesson opened if unfinished, else the next thing in the track.
  const last = p.last && !p.lessons[p.last]?.completedAt ? p.last : here?.kind === 'lesson' ? here.id : undefined
  const lastLesson = last ? findLesson(last) : undefined
  const resumeStep = last ? STEP_KINDS[p.lessons[last]?.step ?? 0] : undefined

  return (
    <main className="page dashboard">
      <span className="box-label">{'> whoami'}</span>
      <TypedHeading level={1} text="Welcome back." className="page-title" />

      <div className="dash-grid">
        <Terminal title="continue" className="dash-continue">
          <div className="term-pad">
            {lastLesson ? (
              <>
                <span className="box-label">
                  lesson {lastLesson.order} · {resumeStep ? `resume at ${STEP_LABELS[resumeStep].toLowerCase()}` : 'start'}
                </span>
                <h2 className="dash-title">{lastLesson.title}</h2>
                <p className="muted">{lastLesson.summary}</p>
                <a className="tt-btn primary" href={lessonHref(lastLesson.id)}>
                  Continue →
                </a>
              </>
            ) : here?.kind === 'project' ? (
              <>
                <span className="box-label">mini project</span>
                <h2 className="dash-title">{findProject(here.id)?.title}</h2>
                <a className="tt-btn primary" href={`#/project/${here.id}`}>
                  Start the project →
                </a>
              </>
            ) : (
              <>
                <h2 className="dash-title">You are all caught up with the lessons so far.</h2>
                <p className="muted">New units are being written. Reviews keep what you learned fresh.</p>
              </>
            )}
          </div>
        </Terminal>

        <Terminal title="review" label={`${due} due`} className="dash-review">
          <div className="term-pad">
            {due > 0 ? (
              <>
                <span className="dash-big">{due}</span>
                <span className="box-label"> {due === 1 ? 'card' : 'cards'} due today</span>
                <p className="muted">A few minutes. Mixed from different lessons.</p>
                <a className="tt-btn primary" href="#/review">
                  Review now →
                </a>
              </>
            ) : (
              <div className="sp-empty">
                <Mascot size={36} />
                <div>
                  <div className="box-label">{'> 0 cards due'}</div>
                  <div className="sp-hand">all caught up. nice.</div>
                </div>
              </div>
            )}
          </div>
        </Terminal>

        <Terminal title="you" className="dash-you">
          <div className="term-pad dash-stats">
            <div>
              <span className="box-label">streak</span>
              <StreakMark days={days} />
            </div>
            <div>
              <span className="box-label">level</span>
              <LevelBadge xp={p.xp} />
              <span className="box-label">
                {lv.into}/{lv.span} xp to level {lv.level + 1}
              </span>
            </div>
          </div>
        </Terminal>
      </div>

      <section className="dash-map">
        <div className="dash-map-head">
          <h2>{track.title}</h2>
          <a className="tt-btn prompt" href={`#/track/${track.id}`}>
            {' open the full map'}
          </a>
        </div>
        <TrackTree trackId={track.id} progress={p} compact />
      </section>

      <p className="dash-foot">
        <a href="#/welcome" className="tt-btn prompt">
          {' about TraceType'}
        </a>
        <a href="#/course" className="tt-btn prompt">
          {' all tracks'}
        </a>
      </p>
    </main>
  )
}
