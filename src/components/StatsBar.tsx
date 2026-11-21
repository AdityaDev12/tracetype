interface Props {
  wpm: number
  accuracy: number
  line: number
  total: number
  peeks?: number
}

export function StatsBar({ wpm, accuracy, line, total, peeks }: Props) {
  return (
    <dl className="stats-bar">
      <div>
        <dt>WPM</dt>
        <dd>{wpm}</dd>
      </div>
      <div>
        <dt>Accuracy</dt>
        <dd>{accuracy}%</dd>
      </div>
      <div>
        <dt>Line</dt>
        <dd>
          {line}/{total}
        </dd>
      </div>
      {peeks !== undefined && (
        <div>
          <dt>Peeks</dt>
          <dd>{peeks}</dd>
        </div>
      )}
    </dl>
  )
}
