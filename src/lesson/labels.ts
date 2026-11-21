import type { StepKind } from '../engine/types.ts'

export const STEP_LABELS: Record<StepKind, string> = {
  intro: 'Intro',
  predict: 'Predict',
  examples: 'Examples',
  investigate: 'Investigate',
  faded: 'Faded',
  parsons: 'Parsons',
  fix: 'Fix',
  modify: 'Modify',
  recall: 'Recall',
  make: 'Make',
  quiz: 'Quiz',
  mistakes: 'Mistakes',
}
