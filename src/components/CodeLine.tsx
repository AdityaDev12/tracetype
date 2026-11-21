import { useMemo } from 'react'
import { tokenize } from '../engine/highlight.ts'

/** A read-only line of Python with syntax colors. */
export function CodeLine({ code }: { code: string }) {
  const tokens = useMemo(() => tokenize(code), [code])
  if (code === '') return <span>{' '}</span>
  return (
    <>
      {tokens.map((t) => (
        <span key={t.start} className={`tok-${t.kind}`}>
          {t.text}
        </span>
      ))}
    </>
  )
}
