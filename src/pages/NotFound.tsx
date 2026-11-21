import { Mascot } from '../brand/Mascot.tsx'
import { Terminal } from '../design/Terminal.tsx'

export function NotFound() {
  return (
    <main className="page">
      <Terminal title="404">
        <div className="term-pad sp-empty">
          <Mascot size={44} mood="tilt" />
          <div>
            <div className="box-label">{`> cd ${window.location.hash.replace(/^#/, '') || '/'}`}</div>
            <div className="box-label">{'> page not found'}</div>
            <a className="tt-btn prompt" href="#/">
              {' cd ~'}
            </a>
          </div>
        </div>
      </Terminal>
    </main>
  )
}
