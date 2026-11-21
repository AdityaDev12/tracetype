import { useMemo } from 'react'
import { useLanguagePack } from '../languages/LanguageContext.tsx'

/** A read-only line of code with syntax colors from the current language pack. */
export function CodeLine({ code }: { code: string }) {
  const pack = useLanguagePack()
  const tokens = useMemo(() => pack.tokenize(code), [pack, code])
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
