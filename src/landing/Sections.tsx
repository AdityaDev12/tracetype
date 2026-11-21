import { tracks } from '../content.ts'
import { AnnotationLayer } from '../design/Annotations.tsx'
import { Terminal } from '../design/Terminal.tsx'
import { TypedHeading } from '../design/TypedHeading.tsx'

// Landing page sections below the hero. The little demos loop with CSS only,
// so they cost nothing to load.

function HowCard({ title, file, note, children }: { title: string; file: string; note: string; children: React.ReactNode }) {
  return (
    <article className="how-card">
      <Terminal title={file}>
        <div className="how-demo">{children}</div>
      </Terminal>
      <h3>{title}</h3>
      <p className="how-note">{note}</p>
    </article>
  )
}

export function HowItWorks() {
  return (
    <section className="lp-section" aria-labelledby="how-title">
      <span className="box-label">{'> man tracetype'}</span>
      <TypedHeading text="How it works" className="lp-h2" />
      <p className="lp-lede">Every lesson moves you from reading code to writing it, in small steps.</p>
      <div className="how-grid">
        <HowCard title="Predict" file="predict.py" note="Guess what it does, then watch it run.">
          <div className="hd-line">
            <span className="tok-name">word</span> <span className="tok-operator">=</span> <span className="tok-string">"hi"</span>
          </div>
          <div className="hd-line">
            <span className="tok-builtin">print</span>
            <span className="tok-punct">(</span>word<span className="tok-punct">,</span> word<span className="tok-punct">)</span>
          </div>
          <div className="hd-out">
            <span className="hd-q">?</span>
            <span className="hd-a">hi hi</span>
          </div>
        </HowCard>
        <HowCard title="Trace" file="trace.py" note="Type over faded code. Mistakes show in red.">
          <div className="hd-line hd-ghostline">
            <span className="hd-ghost">coins = 3</span>
            <span className="hd-typed">coins = 3</span>
          </div>
          <div className="hd-line hd-ghost">print(coins)</div>
        </HowCard>
        <HowCard title="Recall" file="recall.py" note="Write it again from memory, from short tasks.">
          <div className="hd-line tok-comment"># store 3 in coins</div>
          <div className="hd-line hd-ghostline">
            <span className="hd-typed hd-slow">coins = 3</span>
          </div>
        </HowCard>
        <HowCard title="Make" file="make.py" note="Write a small program of your own. Tests check it.">
          <div className="hd-test" style={{ animationDelay: '0.3s' }}>
            <span className="ok">✓</span> prints the sentence
          </div>
          <div className="hd-test" style={{ animationDelay: '0.9s' }}>
            <span className="ok">✓</span> book holds the title
          </div>
          <div className="hd-test" style={{ animationDelay: '1.5s' }}>
            <span className="ok">✓</span> pages is a number
          </div>
        </HowCard>
      </div>
    </section>
  )
}

export function ThePath() {
  return (
    <section className="lp-section" aria-labelledby="path-title">
      <span className="box-label">{'> tree ~/course'}</span>
      <TypedHeading text="The path" className="lp-h2" />
      <p className="lp-lede">Four tracks, in order. Start with the language, end with real machine learning.</p>
      <AnnotationLayer
        annotations={[{ id: 'lp-start', target: 'lp-python', mark: 'circle', color: 'blue', note: 'start here', side: 'right', dx: 70, dy: -44, width: 120, delay: 200 }]}
      >
        <ul className="course-tree lp-tree">
          {tracks.map((t, i) => (
            <li key={t.id} className={`course-track${t.status === 'open' ? ' open' : ' soon'}`}>
              <span className="tree-branch">{i === tracks.length - 1 ? '└─ ' : '├─ '}</span>
              <div className="course-track-body">
                <div className="course-track-head">
                  <span className="track-no">{t.order}</span>
                  {t.status === 'open' ? (
                    <a href={`#/track/${t.id}`} className="track-name" data-anno="lp-python">
                      {t.title}
                    </a>
                  ) : (
                    <span className="track-name">{t.title}</span>
                  )}
                  <span className="track-status">{t.status === 'open' ? 'open' : 'coming soon'}</span>
                </div>
                <p className="track-desc">{t.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </AnnotationLayer>
    </section>
  )
}

const WHY = [
  {
    title: 'Predict before you write',
    text: 'Reading code and guessing what it does comes before writing it. Then you change it, then you make your own. Filling gaps and ordering lines in between builds writing skill with less frustration.',
    links: [
      { label: 'PRIMM (Sentance and Waite, 2017)', url: 'https://doi.org/10.1145/3137065.3137084' },
      { label: 'Faded Parsons problems (Weinman, Fox and Hearst, 2021)', url: 'https://doi.org/10.1145/3411764.3445228' },
    ],
  },
  {
    title: 'Practice from memory',
    text: 'Pulling something out of your memory makes it stick far better than reading it again. That is why every lesson has Recall and Make, not just reading.',
    links: [{ label: 'Test-enhanced learning (Roediger and Karpicke, 2006)', url: 'https://doi.org/10.1111/j.1467-9280.2006.01693.x' }],
  },
  {
    title: 'Review at the right time',
    text: 'Seeing things again after growing gaps beats cramming. Exercises come back after 1, 3, 7, 14, 30 and 60 days, mixed with other topics.',
    links: [{ label: 'Distributed practice (Cepeda and others, 2006)', url: 'https://doi.org/10.1037/0033-2909.132.3.354' }],
  },
]

export function WhyItWorks() {
  return (
    <section className="lp-section" aria-labelledby="why-title">
      <span className="box-label">{'> cat why.txt'}</span>
      <TypedHeading text="Why it works" className="lp-h2" />
      <ol className="why-list">
        {WHY.map((w, i) => (
          <li key={w.title}>
            <span className="why-no">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
              <p className="why-links">
                {w.links.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                    {l.label} ↗
                  </a>
                ))}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="lp-footer">
      <span className="box-label">{'> exit'}</span>
      <p>
        TraceType is free and open source, with no account. The code is under the{' '}
        <a href="https://github.com/AdityaDev12/tracetype/blob/main/LICENSE" target="_blank" rel="noreferrer">
          MIT license ↗
        </a>{' '}
        and the lessons under{' '}
        <a href="https://github.com/AdityaDev12/tracetype/blob/main/LICENSE-CONTENT" target="_blank" rel="noreferrer">
          CC BY 4.0 ↗
        </a>
        . It all lives on{' '}
        <a href="https://github.com/AdityaDev12/tracetype" target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
        .
      </p>
      <p className="muted">All lessons, code and exercises are written for this course. Python runs in your browser with Pyodide.</p>
    </footer>
  )
}
