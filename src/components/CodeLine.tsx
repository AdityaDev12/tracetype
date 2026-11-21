import { useMemo } from 'react'
import type { Token } from '../engine/tokens.ts'
import { useLanguagePack } from '../languages/LanguageContext.tsx'
import { useHoverName } from '../lesson/visuals/hover.ts'

function NameToken({ t }: { t: Token }) {
  const h = useHoverName()
  return (
    <span
      className="tok-name"
      data-hl={h.name === t.text ? 'on' : undefined}
      onMouseEnter={() => h.set(t.text)}
      onMouseLeave={() => h.set(null)}
    >
      {t.text}
    </span>
  )
}

/** A read-only line of code with syntax colors from the current language pack.
 * Names take part in hover-link (their memory box lights up). */
export function CodeLine({ code }: { code: string }) {
  const pack = useLanguagePack()
  const tokens = useMemo(() => pack.tokenize(code), [pack, code])
  if (code === '') return <span>{' '}</span>
  return (
    <>
      {tokens.map((t) =>
        t.kind === 'name' ? (
          <NameToken key={t.start} t={t} />
        ) : (
          <span key={t.start} className={`tok-${t.kind}`}>
            {t.text}
          </span>
        ),
      )}
    </>
  )
}
