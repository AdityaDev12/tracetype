import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Mascot, type MascotMood } from '../brand/Mascot.tsx'
import { useFullLesson } from '../useFullLesson.ts'
import type { Lesson } from '../engine/types.ts'
import { languagePack } from '../languages/index.ts'
import { LanguageContext } from '../languages/LanguageContext.tsx'
import { useRunner } from '../languages/useRunner.ts'
import { useProgress } from '../progress/store.ts'
import { LessonContext, type LessonCtx } from './LessonContext.tsx'
import { CodeTaskView } from './steps/CodeTaskStep.tsx'
import { FadedItemView } from './steps/FadedStep.tsx'
import { PredictStep } from './steps/PredictStep.tsx'
import { RecallView } from './steps/RecallStep.tsx'
import { tasksFor } from './tasks.ts'

export type Outcome = 'correct' | 'gaveUp'
export type PracticeKind = 'predict' | 'faded' | 'fix' | 'modify' | 'make' | 'recall'

/** Gives exercise components what a lesson page gives them: language, runner, mascot. */
export function PracticeProvider({ lesson, onWeak, children }: { lesson: Lesson; onWeak: (itemId: string) => void; children: (react: (m: MascotMood) => void) => ReactNode }) {
  const p = useProgress()
  const runner = useRunner(lesson.language)
  const [mood, setMood] = useState<{ m: MascotMood; k: number }>({ m: 'idle', k: 0 })
  const react = useCallback((m: MascotMood) => setMood((x) => ({ m, k: x.k + 1 })), [])
  const ctx: LessonCtx = {
    lesson,
    pack: languagePack(lesson.language),
    runner: runner.runner,
    status: runner.status,
    failure: runner.failure,
    needRunner: runner.load,
    retryRunner: () => runner.runner?.retry(),
    react,
    markWeak: onWeak,
  }
  return (
    <LanguageContext.Provider value={lesson.language}>
      <LessonContext.Provider value={ctx}>
        {p.settings.mascot && (
          <div className="practice-mascot">
            <Mascot size={32} mood={mood.m} moodKey={mood.k} />
          </div>
        )}
        {children(react)}
      </LessonContext.Provider>
    </LanguageContext.Provider>
  )
}

/**
 * One practice item from a lesson (a review card or a unit review item).
 * Calls onFinish with "correct", or "gaveUp" if Show answer was used (or a
 * prediction was wrong).
 */
export function PracticeItem({ lessonId, kind, itemId, onFinish }: { lessonId: string; kind: PracticeKind; itemId: string; onFinish: (o: Outcome) => void }) {
  const { lesson, status } = useFullLesson(lessonId)
  const weak = useRef(false)
  const right = useRef(true)
  if (status === 'loading') return <p className="box-label">{'> loading...'}</p>
  if (!lesson) return <p className="box-label">{'> this item no longer exists'}</p>
  const finish = () => onFinish(weak.current || !right.current ? 'gaveUp' : 'correct')
  const onWeak = () => {
    weak.current = true
  }

  if (kind === 'predict') {
    const item = lesson.predict.find((x) => x.id === itemId)
    if (item) {
      return (
        <PracticeProvider lesson={{ ...lesson, predict: [item] }} onWeak={onWeak}>
          {() => (
            <PredictStep
              item={0}
              setItem={() => {}}
              onDone={finish}
              onResult={(r) => {
                right.current = r
              }}
            />
          )}
        </PracticeProvider>
      )
    }
  } else if (kind === 'faded') {
    const item = lesson.faded.find((x) => x.id === itemId)
    if (item) {
      return (
        <PracticeProvider lesson={{ ...lesson, faded: [item] }} onWeak={onWeak}>
          {() => <FadedItemView index={0} solvedList={[false]} onSolved={() => {}} onNext={finish} />}
        </PracticeProvider>
      )
    }
  } else if (kind === 'recall') {
    const n = Number(itemId.replace('recall-', ''))
    const r = lesson.recall[n]
    if (r) {
      return (
        <PracticeProvider lesson={lesson} onWeak={onWeak}>
          {() => <RecallView exampleIndex={r.example} itemId={itemId} onNext={finish} last />}
        </PracticeProvider>
      )
    }
  } else {
    const task = tasksFor(kind, lesson).find((t) => t.id === itemId)
    if (task) {
      return (
        <PracticeProvider lesson={lesson} onWeak={onWeak}>
          {() => <CodeTaskView kind={kind} task={task} index={0} count={1} solvedList={[false]} onSolved={() => {}} onNext={finish} />}
        </PracticeProvider>
      )
    }
  }
  return <p className="box-label">{'> this item no longer exists'}</p>
}
