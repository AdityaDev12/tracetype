import type { ReactNode } from 'react'
import { CodeLine } from '../components/CodeLine.tsx'
import { Terminal } from '../design/Terminal.tsx'
import { HoverNameProvider } from './visuals/HoverName.tsx'

/** Two columns: the exercise on the left, memory/output on the right. Stacks on phones. */
export function StepLayout({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <HoverNameProvider>
      <div className={`step-layout${right ? '' : ' single'}`}>
        <div className="step-left">{left}</div>
        {right && <aside className="step-right">{right}</aside>}
      </div>
    </HoverNameProvider>
  )
}

/** Read-only code in a terminal panel. `active` is a 1-based line to highlight. */
export function CodeBlock({
  title,
  lines,
  active,
  annoPrefix,
  label,
  errorLine,
  neverRan,
}: {
  title: string
  lines: string[]
  active?: number | null
  /** 1-based line the program stopped on with an error. */
  errorLine?: number | null
  /** Lines that never ran (shown greyed). */
  neverRan?: (line: number) => boolean
  /** Adds data-anno="<prefix>-<n>" on each line's text for tutor annotations. */
  annoPrefix?: string
  label?: ReactNode
}) {
  return (
    <Terminal title={title} label={label}>
      <div className="tcode">
        {lines.map((code, i) => (
          <div
            key={i}
            className={`tline${active === i + 1 ? ' active' : ''}${errorLine === i + 1 ? ' stopped' : ''}${neverRan?.(i + 1) ? ' never' : ''}`}
          >
            <span className="tgutter">{i + 1}</span>
            <span className="ttext">
              <span data-anno={annoPrefix ? `${annoPrefix}-${i + 1}` : undefined}>
                <CodeLine code={code} />
              </span>
            </span>
          </div>
        ))}
      </div>
    </Terminal>
  )
}

/** "2 of 3" with dots, for steps that have several items. */
export function ItemPager({ index, count, solved }: { index: number; count: number; solved: boolean[] }) {
  if (count <= 1) return null
  return (
    <div className="item-pager" aria-label={`Item ${index + 1} of ${count}`}>
      <span className="box-label">
        {index + 1} of {count}
      </span>
      <span className="item-dots" aria-hidden>
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`item-dot${solved[i] ? ' done' : ''}${i === index ? ' current' : ''}`} />
        ))}
      </span>
    </div>
  )
}

export function StepTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <header className="step-head">
      <span className="box-label">{kicker}</span>
      <h2>{title}</h2>
    </header>
  )
}

/** Moves to the next item, or finishes the step on the last one. */
export function NextButton({ show, last, onNext, label }: { show: boolean; last: boolean; onNext: () => void; label?: string }) {
  if (!show) return null
  return (
    <button className="tt-btn primary" onClick={onNext} autoFocus>
      {label ?? (last ? 'Continue →' : 'Next →')}
    </button>
  )
}
