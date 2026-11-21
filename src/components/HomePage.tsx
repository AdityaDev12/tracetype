import { MODES } from '../engine/types.ts'
import { lessonsForTrack, tracks } from '../lessons.ts'
import { isLessonComplete, useProgress } from '../progress.ts'
import { lessonHref } from '../router.ts'
import { MODE_LABELS } from '../modeLabels.ts'

export function HomePage() {
  const progress = useProgress()
  return (
    <main className="page home">
      <section className="hero">
        <h1>
          Trace<span className="accent">Type</span>
        </h1>
        <p className="hero-sub">
          Learn Python by typing over real code while a panel shows what every line does.
        </p>
        <ol className="how">
          <li>
            <strong>Learn</strong> step through the code
          </li>
          <li>
            <strong>Trace</strong> type over it
          </li>
          <li>
            <strong>Recall</strong> write it from memory
          </li>
          <li>
            <strong>Quiz</strong> check yourself
          </li>
        </ol>
      </section>

      {tracks.map((track) => {
        const list = lessonsForTrack(track.id)
        if (list.length === 0) return null
        const doneCount = list.filter((l) => isLessonComplete(progress[l.id])).length
        return (
          <section key={track.id} className="track">
            <div className="track-head">
              <h2>{track.title}</h2>
              <span className="muted">
                {doneCount}/{list.length} done
              </span>
            </div>
            <p className="muted">{track.description}</p>
            <ul className="lesson-list">
              {list.map((l) => {
                const p = progress[l.id]
                const complete = isLessonComplete(p)
                return (
                  <li key={l.id}>
                    <a href={lessonHref(l.id)} className={`lesson-item${complete ? ' complete' : ''}`}>
                      <span className="lesson-check" aria-label={complete ? 'Completed' : 'Not completed'}>
                        {complete ? '✓' : l.order}
                      </span>
                      <span className="lesson-info">
                        <span className="lesson-title">{l.title}</span>
                        <span className="lesson-summary">{l.summary}</span>
                      </span>
                      <span className="mode-dots">
                        {MODES.map((m) => (
                          <span
                            key={m}
                            className={p?.[m]?.done ? 'mode-dot on' : 'mode-dot'}
                            title={`${MODE_LABELS[m]}${p?.[m]?.done ? ' done' : ''}`}
                          >
                            {MODE_LABELS[m][0]}
                          </span>
                        ))}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </main>
  )
}
