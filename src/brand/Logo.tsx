import logoSvg from './logo.svg?raw'

// The TraceType logo: "Trace" in chalk with the tutor's blue underline, a
// glowing amber block cursor, and "Type" in ghost color. The SVG is generated
// by scripts/brand/make_brand.py (letters outlined from IBM Plex Mono), so it
// looks the same everywhere. Inline so the cursor can blink and the underline
// can draw itself on.

export function Logo({ height = 28, animate = true }: { height?: number; animate?: boolean }) {
  return (
    <span
      className={`logo${animate ? ' logo-animated' : ''}`}
      style={{ height }}
      role="img"
      aria-label="TraceType"
      // Our own generated file, not user content.
      dangerouslySetInnerHTML={{ __html: logoSvg }}
    />
  )
}
