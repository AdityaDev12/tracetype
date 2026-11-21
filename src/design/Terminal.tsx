import type { ReactNode } from 'react'

/** A terminal panel: slim title bar with a file name, square corners, warm glow. */
export function Terminal({
  title,
  label,
  children,
  className,
}: {
  title: string
  label?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`term${className ? ` ${className}` : ''}`} aria-label={title}>
      <header className="term-bar">
        <span className="term-block" aria-hidden />
        <span className="term-title">{title}</span>
        {label && <span className="term-label">{label}</span>}
      </header>
      <div className="term-body">{children}</div>
    </section>
  )
}
