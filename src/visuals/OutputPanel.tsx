export function OutputPanel({ output, newOutput }: { output: string; newOutput: string }) {
  const old = output.slice(0, output.length - newOutput.length)
  return (
    <section className="panel output-panel" aria-label="Output">
      <h3 className="panel-title">Output</h3>
      {output === '' ? (
        <p className="panel-empty">Nothing printed yet.</p>
      ) : (
        <pre className="output">
          {old}
          {newOutput && (
            <span className="output-new" key={output.length}>
              {newOutput}
            </span>
          )}
        </pre>
      )}
    </section>
  )
}
