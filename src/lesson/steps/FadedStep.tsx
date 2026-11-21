import { Fragment, useState } from 'react'
import { CodeLine } from '../../components/CodeLine.tsx'
import { Terminal } from '../../design/Terminal.tsx'
import { fallbackFaded, gradeByResult, runOptions, sourceOf } from '../../engine/grade.ts'
import { RunnerNotice, VerdictBox } from '../Feedback.tsx'
import { ItemPager, NextButton, StepLayout, StepTitle } from '../common.tsx'
import { useCheck } from '../useCheck.ts'
import { useLesson } from '../LessonContext.tsx'

const BLANK = '___'

/** Faded code: fill the blanks. Accepted if the program gives the expected output and variables. */
export function FadedStep({ item, setItem, onDone }: { item: number; setItem: (n: number) => void; onDone: () => void }) {
  const { lesson } = useLesson()
  const items = lesson.faded
  const [solved, setSolved] = useState<boolean[]>(() => items.map(() => false))
  const f = items[item]
  return (
    <FadedItemView
      key={f.id}
      index={item}
      solvedList={solved}
      onSolved={() => setSolved((s) => s.map((x, i) => (i === item ? true : x)))}
      onNext={() => (item + 1 < items.length ? setItem(item + 1) : onDone())}
    />
  )
}

export function FadedItemView({ index, solvedList, onSolved, onNext }: { index: number; solvedList: boolean[]; onSolved: () => void; onNext: () => void }) {
  const { lesson } = useLesson()
  const f = lesson.faded[index]
  const [values, setValues] = useState<string[]>(() => f.answers.map(() => ''))
  const { ctx, tries, verdict, busy, check, showAnswer, canShow } = useCheck(f.id, onSolved)

  const filled = () => {
    let k = 0
    return sourceOf(f.code).replace(/___/g, () => values[k++] ?? '')
  }

  const submit = () =>
    check((runner) => (runner ? gradeByResult(runner, filled(), f.gen.expected, runOptions(f)) : fallbackFaded(values, f.answers)))

  const reveal = () => {
    setValues(f.answers)
    showAnswer()
  }

  let blank = 0
  return (
    <StepLayout
      left={
        <div className="step-body">
          <StepTitle kicker="> faded code: fill the blanks" title={f.prompt.split('\n')[0]} />
          {f.prompt.includes('\n') && <pre className="prompt-pre">{f.prompt.split('\n').slice(1).join('\n')}</pre>}
          <ItemPager index={index} count={lesson.faded.length} solved={solvedList} />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <Terminal title={`faded_${index + 1}.py`}>
              <div className="tcode">
                {f.code.map((line, i) => {
                  const parts = line.split(BLANK)
                  return (
                    <div key={i} className="tline">
                      <span className="tgutter">{i + 1}</span>
                      <span className="ttext">
                        {parts.map((part, j) => {
                          const k = j < parts.length - 1 ? blank++ : -1
                          return (
                            <Fragment key={j}>
                              <CodeLine code={part} />
                              {k >= 0 && (
                                <input
                                  className="blank-input"
                                  aria-label={`Blank ${k + 1}`}
                                  value={values[k]}
                                  readOnly={tries.solved}
                                  size={Math.max(4, f.answers[k].length + 2, values[k].length + 1)}
                                  autoFocus={k === 0}
                                  autoCapitalize="off"
                                  autoCorrect="off"
                                  spellCheck={false}
                                  onChange={(e) => setValues((v) => v.map((x, n) => (n === k ? e.target.value : x)))}
                                />
                              )}
                            </Fragment>
                          )
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Terminal>
            <RunnerNotice status={ctx.status} failure={ctx.failure} onRetry={ctx.retryRunner} />
            <VerdictBox verdict={verdict} pack={ctx.pack} />
            {tries.gaveUp && <p className="fb-retry">Here are the answers. This one will come back in your reviews soon.</p>}
            <div className="row-gap">
              {!tries.solved && (
                <button className="tt-btn primary" type="submit" disabled={busy || values.some((v) => v.trim() === '') || ctx.status === 'loading'}>
                  {busy ? 'running...' : 'Check'}
                </button>
              )}
              {canShow && (
                <button className="tt-btn bracket" type="button" onClick={reveal}>
                  show answer
                </button>
              )}
              <NextButton show={tries.solved} last={index + 1 >= lesson.faded.length} onNext={onNext} />
            </div>
          </form>
        </div>
      }
    />
  )
}
