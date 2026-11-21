import { useCallback, useEffect, useState } from 'react'
import { Mascot, type MascotMood } from '../brand/Mascot.tsx'
import { ReadMore } from '../components/ReadMore.tsx'
import { findLesson, findTrack, findUnit, nextLessonId } from '../content.ts'
import { checkMark } from '../design/sketch.ts'
import { STEP_KINDS, type StepKind } from '../engine/types.ts'
import { STEP_LABELS } from './labels.ts'
import { languagePack } from '../languages/index.ts'
import { LanguageContext } from '../languages/LanguageContext.tsx'
import { useRunner } from '../languages/useRunner.ts'
import { completeLesson, completeStep, markWeak as markWeakModel, setPosition } from '../progress/model.ts'
import { getProgress, updateProgress, useProgress } from '../progress/store.ts'
import { lessonHref } from '../router.ts'
import { LessonContext, type LessonCtx } from './LessonContext.tsx'
import { CodeTaskStep } from './steps/CodeTaskStep.tsx'
import { ExamplesStep } from './steps/ExamplesStep.tsx'
import { FadedStep } from './steps/FadedStep.tsx'
import { IntroStep } from './steps/IntroStep.tsx'
import { InvestigateStep } from './steps/InvestigateStep.tsx'
import { MistakesStep } from './steps/MistakesStep.tsx'
import { ParsonsStep } from './steps/ParsonsStep.tsx'
import { PredictStep } from './steps/PredictStep.tsx'
import { QuizStep } from './steps/QuizStep.tsx'
import { RecallStep } from './steps/RecallStep.tsx'

function StepBar({ current, done, onPick }: { current: number; done: Partial<Record<StepKind, number>>; onPick: (i: number) => void }) {
  return (
    <nav className="lesson-steps" aria-label="Lesson steps">
      <ol>
        {STEP_KINDS.map((k, i) => {
          const state = i === current ? 'current' : done[k] ? 'done' : 'todo'
          return (
            <li key={k}>
              <button
                className={`lstep ${state}`}
                onClick={() => onPick(i)}
                aria-current={i === current ? 'step' : undefined}
                aria-label={`${STEP_LABELS[k]}${done[k] ? ', done' : ''}`}
                title={STEP_LABELS[k]}
              >
                <span className="lstep-bar" aria-hidden />
                <span className="lstep-label">{STEP_LABELS[k]}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function Complete({ lessonId, onReview }: { lessonId: string; onReview: () => void }) {
  const lesson = findLesson(lessonId)!
  const next = nextLessonId(lessonId)
  const unit = findUnit(lesson.unit)
  const lastInUnit = unit && unit.unit.lessons[unit.unit.lessons.length - 1] === lessonId
  return (
    <div className="lesson-complete">
      <svg className="complete-check" viewBox="0 0 80 80" aria-hidden>
        <path d={checkMark(12, 14, 56, 5)} pathLength={1} className="draw" />
      </svg>
      <span className="box-label">{'> lesson complete · +50 xp'}</span>
      <h2>You finished {lesson.title}.</h2>
      <p className="muted">
        The exercises you did will come back for a quick review over the next days, so they stick. Reviews start
        tomorrow.
      </p>
      <div className="row-gap">
        {lastInUnit && unit?.unit.project ? (
          <a className="tt-btn primary" href={`#/project/${unit.unit.project}`}>
            Unit mini project →
          </a>
        ) : next ? (
          <a className="tt-btn primary" href={lessonHref(next)}>
            Next lesson →
          </a>
        ) : null}
        <a className="tt-btn bracket" href={`#/track/${lesson.track}`}>
          back to the course
        </a>
        <button className="tt-btn prompt" onClick={onReview}>
          {' go over the steps again'}
        </button>
      </div>
      <ReadMore lesson={lesson} />
    </div>
  )
}

export function LessonPage({ id, step: stepParam }: { id: string; step?: string }) {
  const lesson = findLesson(id)
  if (!lesson) {
    return (
      <main className="page">
        <p className="box-label">{'> lesson not found'}</p>
        <a className="tt-btn prompt" href="#/course">
          {' back to the course'}
        </a>
      </main>
    )
  }
  return <LessonInner key={id} id={id} stepParam={stepParam} />
}

function LessonInner({ id, stepParam }: { id: string; stepParam?: string }) {
  const lesson = findLesson(id)!
  const progress = useProgress()
  const saved = progress.lessons[id]
  const fromUrl = STEP_KINDS.indexOf(stepParam as StepKind)
  const [step, setStep] = useState(() => (fromUrl >= 0 ? fromUrl : (saved?.step ?? 0)))
  const [showComplete, setShowComplete] = useState(false)
  const [mood, setMood] = useState<{ m: MascotMood; k: number }>({ m: 'idle', k: 0 })
  const pack = languagePack(lesson.language)
  const runnerState = useRunner(lesson.language)
  const kind = STEP_KINDS[step]
  const item = saved?.item[kind] ?? 0
  const track = findTrack(lesson.track)
  const unit = findUnit(lesson.unit)

  // A step in the URL (link, back button, typed address) moves to that step.
  // Adjusting state while rendering, as the React docs suggest for this case.
  const [urlSeen, setUrlSeen] = useState(fromUrl)
  if (fromUrl !== urlSeen) {
    setUrlSeen(fromUrl)
    if (fromUrl >= 0 && fromUrl !== step) {
      setStep(fromUrl)
      setShowComplete(false)
    }
  }

  // Keep the URL and the resume position in sync with the current step.
  useEffect(() => {
    const href = lessonHref(id, kind)
    if (window.location.hash !== href) window.history.replaceState(null, '', href)
    updateProgress((p) => setPosition(p, id, step))
    window.scrollTo({ top: 0 })
  }, [id, kind, step])

  const react = useCallback((m: MascotMood) => setMood((p) => ({ m, k: p.k + 1 })), [])
  const { load, runner, status, failure } = runnerState

  const ctx: LessonCtx = {
    lesson,
    pack,
    runner,
    status,
    failure,
    needRunner: load,
    retryRunner: () => runner?.retry(),
    react,
    markWeak: (itemId: string) => updateProgress((p) => markWeakModel(p, id, itemId)),
  }

  const setItem = (n: number) => updateProgress((p) => setPosition(p, id, step, kind, n))

  const finishStep = () => {
    const now = new Date()
    updateProgress((p) => completeStep(p, id, kind, now))
    const done = getProgress().lessons[id]?.done ?? {}
    if (STEP_KINDS.every((k) => done[k])) {
      updateProgress((p) => completeLesson(p, lesson, now))
      react('bounce')
      setShowComplete(true)
      return
    }
    // Go to the next step that is not done yet (or simply the next one).
    const nextTodo = STEP_KINDS.findIndex((k, i) => i > step && !done[k])
    if (nextTodo >= 0) setStep(nextTodo)
    else if (step + 1 < STEP_KINDS.length) setStep(step + 1)
    else {
      const firstTodo = STEP_KINDS.findIndex((k) => !done[k])
      if (firstTodo >= 0) setStep(firstTodo)
    }
  }

  const props = { item, setItem, onDone: finishStep }
  const body = showComplete ? (
    <Complete lessonId={id} onReview={() => (setShowComplete(false), setStep(0))} />
  ) : kind === 'intro' ? (
    <IntroStep onDone={finishStep} />
  ) : kind === 'predict' ? (
    <PredictStep {...props} />
  ) : kind === 'examples' ? (
    <ExamplesStep {...props} />
  ) : kind === 'investigate' ? (
    <InvestigateStep {...props} />
  ) : kind === 'faded' ? (
    <FadedStep {...props} />
  ) : kind === 'parsons' ? (
    <ParsonsStep {...props} />
  ) : kind === 'fix' || kind === 'modify' || kind === 'make' ? (
    <CodeTaskStep kind={kind} {...props} />
  ) : kind === 'recall' ? (
    <RecallStep {...props} />
  ) : kind === 'quiz' ? (
    <QuizStep {...props} />
  ) : (
    <MistakesStep {...props} />
  )

  return (
    <LanguageContext.Provider value={lesson.language}>
      <LessonContext.Provider value={ctx}>
        <main className="page lesson-v2">
          <header className="lesson-head">
            <nav className="crumbs box-label" aria-label="Breadcrumb">
              <a href="#/course">course</a> / <a href={`#/track/${lesson.track}`}>{track?.title.toLowerCase()}</a> /{' '}
              <span>{unit?.unit.title.toLowerCase()}</span>
            </nav>
            <h1>
              <span className="lesson-no">{lesson.order}.</span> {lesson.title}
            </h1>
          </header>
          <div className="steps-row">
            <StepBar current={showComplete ? -1 : step} done={saved?.done ?? {}} onPick={(i) => (setShowComplete(false), setStep(i))} />
            {progress.settings.mascot && <Mascot size={34} mood={mood.m} moodKey={mood.k} />}
          </div>
          <div key={`${kind}:${showComplete}`} className="step-wrap">
            {body}
          </div>
          {!showComplete && (
            <nav className="step-nav" aria-label="Previous and next step">
              <button className="tt-btn prompt" onClick={() => setStep(step - 1)} disabled={step === 0}>
                {step > 0 ? ` back to ${STEP_LABELS[STEP_KINDS[step - 1]].toLowerCase()}` : ' first step'}
              </button>
              {step + 1 < STEP_KINDS.length && (
                <button className="tt-btn prompt" onClick={() => setStep(step + 1)}>
                  {` skip to ${STEP_LABELS[STEP_KINDS[step + 1]].toLowerCase()}`}
                </button>
              )}
            </nav>
          )}
        </main>
      </LessonContext.Provider>
    </LanguageContext.Provider>
  )
}
