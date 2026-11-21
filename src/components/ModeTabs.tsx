import { MODES, type Mode } from '../engine/types.ts'
import type { LessonProgress } from '../progress.ts'
import { lessonHref } from '../router.ts'
import { MODE_LABELS } from '../modeLabels.ts'


const MODE_HINTS: Record<Mode, string> = {
  learn: 'Step through the code and watch it run',
  trace: 'Type over the faded code',
  recall: 'Write it from memory',
  quiz: 'Check what you know',
}

export function ModeTabs({ lessonId, mode, progress }: { lessonId: string; mode: Mode; progress?: LessonProgress }) {
  return (
    <nav className="mode-tabs" aria-label="Lesson modes">
      {MODES.map((m, i) => (
        <a
          key={m}
          href={lessonHref(lessonId, m)}
          className={`mode-tab${m === mode ? ' active' : ''}`}
          aria-current={m === mode ? 'page' : undefined}
          title={MODE_HINTS[m]}
        >
          <span className="mode-num">{progress?.[m]?.done ? '✓' : i + 1}</span>
          {MODE_LABELS[m]}
        </a>
      ))}
    </nav>
  )
}
