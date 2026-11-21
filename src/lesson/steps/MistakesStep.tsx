import { RichText } from '../../components/RichText.tsx'
import { AnnotationLayer } from '../../design/Annotations.tsx'
import { Terminal } from '../../design/Terminal.tsx'
import { ErrorBox } from '../Feedback.tsx'
import { CodeBlock, ItemPager, NextButton, StepLayout, StepTitle } from '../common.tsx'
import { useLesson } from '../LessonContext.tsx'

/** Common mistakes: typical beginner errors with the real error message and the fix. */
export function MistakesStep({ item, setItem, onDone }: { item: number; setItem: (n: number) => void; onDone: () => void }) {
  const { lesson, pack } = useLesson()
  const items = lesson.mistakes
  const m = items[item]
  const errLine = m.gen.line ?? undefined
  return (
    <StepLayout
      left={
        <div className="step-body">
          <StepTitle kicker="> common mistakes" title={m.title} />
          <ItemPager index={item} count={items.length} solved={items.map((_, i) => i < item)} />
          <AnnotationLayer
            annotations={
              errLine ? [{ id: `${m.id}-u`, target: `mis-${errLine}`, mark: 'underline', color: 'red', note: 'Python stops here', side: 'right', dx: 34, dy: -26, delay: 150 }] : []
            }
          >
            <CodeBlock title="mistake.py" lines={m.code} active={errLine} annoPrefix="mis" label="what goes wrong" />
          </AnnotationLayer>
          <Terminal title="output">
            <div className="term-pad">
              <ErrorBox error={{ type: m.gen.error.split(':')[0], message: m.gen.error, line: m.gen.line }} pack={pack} />
            </div>
          </Terminal>
          <RichText text={m.explain} className="prose" />
          <CodeBlock title="fixed.py" lines={m.fix} label="the fix" />
          <div className="row-gap">
            <NextButton show last={item + 1 >= items.length} onNext={() => (item + 1 < items.length ? setItem(item + 1) : onDone())} label={item + 1 < items.length ? 'Next mistake →' : 'Finish lesson →'} />
          </div>
        </div>
      }
    />
  )
}
