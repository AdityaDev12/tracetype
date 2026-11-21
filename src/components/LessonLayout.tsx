import type { ReactNode } from 'react'

/** Editor and explanation on the left, visual panel on the right. Stacks on phones. */
export function LessonLayout({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="lesson-layout">
      <div className="lesson-left">{left}</div>
      <aside className="lesson-right">{right}</aside>
    </div>
  )
}
