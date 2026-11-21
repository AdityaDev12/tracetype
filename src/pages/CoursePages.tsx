import { useState } from 'react'
import { findTrack, lessonOrder, tracks } from '../content.ts'
import { AnnotationLayer, type Anno } from '../design/Annotations.tsx'
import { TypedHeading } from '../design/TypedHeading.tsx'
import { useProgress } from '../progress/store.ts'
import { TrackList, TrackTree } from './TrackTree.tsx'
import { NotFound } from './NotFound.tsx'

/** The 4 tracks in order as a terminal tree. Python is open, the rest are coming. */
export function CoursePage() {
  const p = useProgress()
  const annos: Anno[] = [{ id: 'start-here', target: 'track-python', mark: 'circle', color: 'blue', note: 'start here', side: 'right', dx: 120, dy: -44, width: 130, delay: 300 }]
  return (
    <main className="page course-page">
      <span className="box-label">{'> tree ~/course'}</span>
      <TypedHeading level={1} text="The course" className="page-title" />
      <p className="lede">
        Four tracks, in order. The language first, then the tools for data, then how machine learning works inside,
        then the real machine learning libraries.
      </p>
      <AnnotationLayer annotations={annos}>
        <ul className="course-tree">
          {tracks.map((t, i) => {
            const open = t.status === 'open'
            const ids = lessonOrder(t.id)
            const done = ids.filter((id) => p.lessons[id]?.completedAt).length
            const last = i === tracks.length - 1
            return (
              <li key={t.id} className={`course-track${open ? ' open' : ' soon'}`}>
                <span className="tree-branch">{last ? '└─ ' : '├─ '}</span>
                <div className="course-track-body">
                  <div className="course-track-head">
                    <span className="track-no">{t.order}</span>
                    {open ? (
                      <a href={`#/track/${t.id}`} className="track-name" data-anno={`track-${t.id}`}>
                        {t.title}
                      </a>
                    ) : (
                      <span className="track-name">{t.title}</span>
                    )}
                    <span className="track-status">{open ? `${done}/${ids.length} lessons` : 'coming soon'}</span>
                  </div>
                  <p className="track-desc">{t.description}</p>
                  {open && (
                    <a className="tt-btn small primary" href={`#/track/${t.id}`}>
                      Open {t.title} →
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </AnnotationLayer>
    </main>
  )
}

/** One track: its units and lessons as a tree, with a plain list toggle. */
export function TrackPage({ id }: { id: string }) {
  const track = findTrack(id)
  const p = useProgress()
  const [view, setView] = useState<'tree' | 'list'>(() => (window.innerWidth < 600 ? 'list' : 'tree'))
  if (!track) return <NotFound />
  if (track.status !== 'open') {
    return (
      <main className="page">
        <span className="box-label">{`> cd ~/course/${track.id}`}</span>
        <h1 className="page-title">{track.title}</h1>
        <p className="lede">{track.description}</p>
        <p className="box-label">{'> coming soon. Finish the Python track first, it is what this one builds on.'}</p>
        <a className="tt-btn prompt" href="#/course">
          {' back to the course'}
        </a>
      </main>
    )
  }
  return (
    <main className="page track-page">
      <nav className="crumbs box-label" aria-label="Breadcrumb">
        <a href="#/course">course</a> / <span>{track.title.toLowerCase()}</span>
      </nav>
      <TypedHeading level={1} text={track.title} className="page-title" />
      <p className="lede">{track.description}</p>
      <div className="view-toggle" role="group" aria-label="View">
        <button className={`tt-btn small ${view === 'tree' ? 'primary' : 'bracket'}`} onClick={() => setView('tree')} aria-pressed={view === 'tree'}>
          tree
        </button>
        <button className={`tt-btn small ${view === 'list' ? 'primary' : 'bracket'}`} onClick={() => setView('list')} aria-pressed={view === 'list'}>
          list
        </button>
      </div>
      <section className="term track-term">
        <header className="term-bar">
          <span className="term-block" aria-hidden />
          <span className="term-title">{`~/course/${track.id}`}</span>
          <span className="term-label">{view}</span>
        </header>
        <div className="term-pad">{view === 'tree' ? <TrackTree trackId={id} progress={p} /> : <TrackList trackId={id} progress={p} />}</div>
      </section>
    </main>
  )
}
