import { useCallback } from 'react'
import { MODES, type Mode } from '../engine/types.ts'
import { findLesson, tracks } from '../lessons.ts'
import { saveModeResult, useProgress } from '../progress.ts'
import { lessonHref, navigate } from '../router.ts'
import { LearnView } from './LearnView.tsx'
import { MODE_LABELS } from '../modeLabels.ts'
import { ModeTabs } from './ModeTabs.tsx'
import { QuizView } from './QuizView.tsx'
import { TypingView, type TypingResult } from './TypingView.tsx'

export function LessonPage({ id, mode }: { id: string; mode: Mode }) {
  const lesson = findLesson(id)
  const progress = useProgress()

  const nextMode = MODES[MODES.indexOf(mode) + 1]
  const goNext = useCallback(() => {
    if (nextMode) navigate(lessonHref(id, nextMode))
    else navigate('#/')
  }, [id, nextMode])

  const learnDone = useCallback(() => saveModeResult(id, 'learn', {}), [id])
  const typingDone = useCallback(
    (r: TypingResult) =>
      saveModeResult(id, mode, mode === 'recall' ? r : { wpm: r.wpm, accuracy: r.accuracy }),
    [id, mode],
  )
  const quizDone = useCallback((score: number, total: number) => saveModeResult(id, 'quiz', { score, total }), [id])

  if (!lesson) {
    return (
      <main className="page">
        <p>That lesson does not exist.</p>
        <a href="#/">Back to lessons</a>
      </main>
    )
  }

  const track = tracks.find((t) => t.id === lesson.track)
  const nextLabel = nextMode ? `Start ${MODE_LABELS[nextMode]} →` : 'Back to lessons'

  return (
    <main className="page lesson-page">
      <header className="lesson-header">
        <a href="#/" className="back-link">
          ← {track?.title ?? 'Lessons'}
        </a>
        <h1>
          <span className="lesson-num">{lesson.order}.</span> {lesson.title}
        </h1>
        <p className="muted">{lesson.summary}</p>
      </header>
      <ModeTabs lessonId={lesson.id} mode={mode} progress={progress[lesson.id]} />
      {/* key resets each mode's state when switching lessons or modes */}
      <div key={`${lesson.id}:${mode}`}>
        {mode === 'learn' && <LearnView lesson={lesson} onComplete={learnDone} onNextMode={goNext} />}
        {(mode === 'trace' || mode === 'recall') && (
          <TypingView
            lesson={lesson}
            variant={mode}
            onComplete={typingDone}
            onNextMode={goNext}
            nextLabel={nextLabel}
          />
        )}
        {mode === 'quiz' && <QuizView lesson={lesson} onComplete={quizDone} onBack={() => navigate('#/')} />}
      </div>
    </main>
  )
}
