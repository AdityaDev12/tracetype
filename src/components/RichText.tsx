import type { ReactNode } from 'react'

// Tiny formatter for lesson text: **bold**, `code`, blank line = new paragraph.
// Builds React nodes directly, so lesson text can never inject HTML.

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>)
    else out.push(<code key={k++} className="inline-code">{tok.slice(1, -1)}</code>)
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const paras = text.split(/\n\s*\n/)
  return (
    <div className={className}>
      {paras.map((p, i) => (
        <p key={i}>{inline(p)}</p>
      ))}
    </div>
  )
}

export function InlineText({ text }: { text: string }) {
  return <>{inline(text)}</>
}
