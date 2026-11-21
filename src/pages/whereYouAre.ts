import { unitsFor } from '../content.ts'
import type { Progress } from '../progress/model.ts'

/** The next thing to do in a track: first unfinished lesson or project. */
export function whereYouAre(trackId: string, p: Progress): { kind: 'lesson' | 'project'; id: string } | null {
  for (const u of unitsFor(trackId)) {
    for (const id of u.lessons) if (!p.lessons[id]?.completedAt) return { kind: 'lesson', id }
    if (u.project && !p.projects[u.project]) return { kind: 'project', id: u.project }
  }
  return null
}
