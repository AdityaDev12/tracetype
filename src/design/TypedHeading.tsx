import { useEffect, useRef, useState } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * A heading that types itself the first time it scrolls into view, then keeps a
 * blinking block cursor at the end. Screen readers get the full text at once.
 */
export function TypedHeading({
  text,
  level = 2,
  speed = 28,
  className,
  cursor = true,
}: {
  text: string
  level?: 1 | 2 | 3
  speed?: number
  className?: string
  cursor?: boolean
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  const [shown, setShown] = useState(() => (reduced() ? text.length : 0))

  useEffect(() => {
    if (reduced()) return
    const el = ref.current
    if (!el) return
    let timer = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        let i = 0
        const tick = () => {
          i++
          setShown(i)
          if (i < text.length) timer = window.setTimeout(tick, speed + Math.random() * speed * 0.6)
        }
        timer = window.setTimeout(tick, 120)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(timer)
    }
  }, [text, speed])

  const Tag = `h${level}` as 'h1'
  return (
    <Tag ref={ref} className={`typed-heading${className ? ` ${className}` : ''}`} aria-label={text}>
      <span aria-hidden>
        {text.slice(0, shown)}
        {cursor && <span className="heading-cursor" />}
        {shown < text.length && <span className="typed-rest">{text.slice(shown)}</span>}
      </span>
    </Tag>
  )
}
