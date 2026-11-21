import { Mascot } from '../../brand/Mascot.tsx'
import { RichText } from '../../components/RichText.tsx'
import { useLesson } from '../LessonContext.tsx'
import { StepLayout } from '../common.tsx'

export function IntroStep({ onDone }: { onDone: () => void }) {
  const { lesson } = useLesson()
  return (
    <StepLayout
      left={
        <div className="intro-step">
          <span className="box-label">{'> the idea'}</span>
          <RichText text={lesson.intro.text} className="prose intro-text" />
          <div className="analogy">
            <span className="analogy-label">think of it like this</span>
            <p>{lesson.intro.analogy}</p>
          </div>
          <div className="row-gap">
            <button className="tt-btn primary" onClick={onDone} autoFocus>
              Start →
            </button>
            <span className="box-label">about {lesson.minutes} minutes</span>
          </div>
        </div>
      }
      right={
        <div className="intro-plan">
          <Mascot size={56} />
          <p className="box-label">{'in this lesson you will'}</p>
          <ul className="tree-list">
            <li>predict what code does</li>
            <li>step through and type {lesson.examples.length} examples</li>
            <li>fill gaps, order lines, fix a bug</li>
            <li>change code, then write your own</li>
            <li>check yourself with a quiz</li>
          </ul>
        </div>
      }
    />
  )
}
