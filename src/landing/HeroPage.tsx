import { useEffect, useState } from 'react'
import { lessonHref } from '../router.ts'
import { HeroDemo } from './HeroDemo.tsx'
import { Footer, HowItWorks, ThePath, WhyItWorks } from './Sections.tsx'

// Rough landing hero (docs/DESIGN.md section 8), built to judge the feel in motion.
// Boot line first (once per visit, any key skips), then headline + live demo.

const BOOT = [
  { text: '> tracetype --start', delay: 0 },
  { text: 'loading python........ ok', delay: 520 },
  { text: 'warming up the cursor. ok', delay: 860 },
]
const BOOT_MS = 1400
const BOOT_KEY = 'tracetype:booted'

function shouldBoot(): boolean {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return window.sessionStorage.getItem(BOOT_KEY) !== '1'
  } catch {
    return true
  }
}

function Boot({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(1)
  useEffect(() => {
    const timers = BOOT.slice(1).map((l, i) => window.setTimeout(() => setShown(i + 2), l.delay))
    timers.push(window.setTimeout(onDone, BOOT_MS))
    const skip = () => onDone()
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [onDone])
  return (
    <div className="boot" role="status" aria-label="Starting TraceType">
      {BOOT.slice(0, shown).map((l, i) => {
        const last = i === shown - 1
        const ok = l.text.endsWith(' ok')
        return (
          <div key={i} className="boot-line">
            {ok ? l.text.slice(0, -2) : l.text}
            {ok && <span className="boot-ok">ok</span>}
            {last && <span className="tcaret boot-caret" />}
          </div>
        )
      })}
    </div>
  )
}

export function HeroPage() {
  const [booting, setBooting] = useState(shouldBoot)
  const finishBoot = () => {
    try {
      window.sessionStorage.setItem(BOOT_KEY, '1')
    } catch {
      // Session storage blocked: the boot line just plays again next time.
    }
    setBooting(false)
  }

  if (booting) return <Boot onDone={finishBoot} />

  return (
    <main className="lp-page">
      <section className="lp-hero">
        <div className="lp-copy">
          <span className="box-label">{'> a python course you type'}</span>
          <h1 className="lp-title">
            Learn Python
            <br />
            by typing it.
          </h1>
          <p className="lp-sub">
            Type real code over a faded ghost, one line at a time. Watch each line change what the computer remembers.
            A tutor points at the parts that matter.
          </p>
          <div className="lp-ctas">
            <a className="tt-btn primary" href={lessonHref('py-01-variables')}>
              Start learning →
            </a>
            <a className="tt-btn bracket" href="#/course">
              See the course
            </a>
          </div>
          <p className="lp-free">free and open source, no account</p>
        </div>
        <HeroDemo />
      </section>
      <HowItWorks />
      <ThePath />
      <WhyItWorks />
      <Footer />
    </main>
  )
}
