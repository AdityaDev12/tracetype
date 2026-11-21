import type { RunError, Verdict } from '../engine/grade.ts'
import type { LanguagePack } from '../languages/index.ts'
import type { RunnerStatus } from '../languages/index.ts'

/** The real error message, plus what it means in plain words. */
export function ErrorBox({ error, pack }: { error: RunError; pack: LanguagePack }) {
  const plain = pack.explainError(error.message)
  return (
    <div className="fb-error" role="alert">
      <div className="fb-error-msg">
        {error.line ? <span className="fb-line">line {error.line}</span> : null}
        <code>{error.message}</code>
      </div>
      {plain && <p className="fb-plain">{plain}</p>}
    </div>
  )
}

export function VerdictBox({ verdict, pack, okText = 'correct' }: { verdict: Verdict | null; pack: LanguagePack; okText?: string }) {
  if (!verdict) return null
  if (verdict.ok) {
    return (
      <div className="tt-toast ok fb" role="status">
        <span className="tag">✓ {okText}</span>
        {verdict.how === 'same-result' && <span>same output and variables</span>}
        {verdict.how === 'fallback' && <span>(checked without running Python)</span>}
      </div>
    )
  }
  return (
    <div className="fb-wrong" role="status">
      <div className="tt-toast err fb">
        <span className="tag">✗ not yet</span>
        {verdict.failedTest ? (
          <span>
            {verdict.passed}/{verdict.total} checks pass. <b>{verdict.failedTest}</b>: {verdict.error ? 'your code stopped with an error' : verdict.message}
          </span>
        ) : (
          <span>{verdict.error ? 'your code stopped with an error' : verdict.message}</span>
        )}
      </div>
      {verdict.error && <ErrorBox error={verdict.error} pack={pack} />}
      {verdict.got !== undefined && verdict.expected !== undefined && (
        <div className="fb-diff">
          <div>
            <span className="box-label">your output</span>
            <pre>{verdict.got || '(nothing printed)'}</pre>
          </div>
          <div>
            <span className="box-label">expected</span>
            <pre>{verdict.expected}</pre>
          </div>
        </div>
      )}
      <p className="fb-retry">Try again as many times as you like. Wrong tries never count against you.</p>
    </div>
  )
}

/** Shown while Python loads for the first time, or when it could not load. */
export function RunnerNotice({ status, failure, onRetry }: { status: RunnerStatus; failure: string; onRetry: () => void }) {
  if (status === 'loading') {
    return (
      <p className="runner-notice" role="status">
        <span className="tcaret inline" /> loading Python... the first time takes a few seconds
      </p>
    )
  }
  if (status === 'failed') {
    return (
      <div className="runner-notice failed" role="status">
        <span>
          Python could not load here: {failure} Checks will use a simpler comparison, and code that needs running shows
          the answer to compare with.
        </span>
        <button className="tt-btn bracket small" onClick={onRetry}>
          try again
        </button>
      </div>
    )
  }
  return null
}
