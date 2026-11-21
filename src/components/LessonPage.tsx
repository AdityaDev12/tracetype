import { findLesson } from '../content.ts'

// Temporary while lesson page v2 is built (next commit in Milestone 2).
export function LessonPage({ id }: { id: string }) {
  const lesson = findLesson(id)
  return (
    <main className="page">
      <p className="box-label">{'> lesson page v2 is being rebuilt'}</p>
      <h1>{lesson?.title ?? 'Lesson not found'}</h1>
    </main>
  )
}
