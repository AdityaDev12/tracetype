/** "What you type": the answers input() gets when you run your own code. */
export function StdinBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const rows = Math.min(6, Math.max(2, value.split('\n').length))
  return (
    <label className="tt-field stdin-box">
      <span className="tt-field-label">{'> what you type when it asks (one answer per line)'}</span>
      <textarea className="tt-input mono" rows={rows} value={value} spellCheck={false} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
