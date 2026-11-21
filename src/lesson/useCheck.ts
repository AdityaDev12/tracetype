import { useEffect, useState } from 'react'
import { canShowAnswer, giveUp, newAttempts, recordTry, type Attempts, type Verdict } from '../engine/grade.ts'
import { canRun, useLesson } from './LessonContext.tsx'

/**
 * Shared logic for exercises checked by running code: loads the runner, keeps
 * the tries, and handles "Show answer". `grade` gets the runner, or null if
 * code cannot run (then it should use a fallback).
 */
export function useCheck(itemId: string, onSolved: () => void) {
  const ctx = useLesson()
  const { needRunner, react, markWeak } = ctx
  const [tries, setTries] = useState<Attempts>(newAttempts)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    needRunner()
  }, [needRunner])

  const check = async (grade: (runner: NonNullable<typeof ctx.runner> | null) => Promise<Verdict> | Verdict) => {
    if (busy || tries.solved) return
    setBusy(true)
    try {
      const v = await grade(canRun(ctx) ? ctx.runner : null)
      setVerdict(v)
      setTries((t) => recordTry(t, v.ok))
      react(v.ok ? 'hop' : 'tilt')
      if (v.ok) onSolved()
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setVerdict({ ok: false, message, error: { type: 'Timeout', message: `Timeout: ${message}`, line: null } })
      setTries((t) => recordTry(t, false))
      react('tilt')
    } finally {
      setBusy(false)
    }
  }

  const showAnswer = () => {
    setTries((t) => giveUp(t))
    setVerdict(null)
    markWeak(itemId)
    onSolved()
  }

  const reset = () => {
    setTries(newAttempts())
    setVerdict(null)
  }

  return { ctx, tries, verdict, busy, check, showAnswer, reset, canShow: canShowAnswer(tries) }
}
