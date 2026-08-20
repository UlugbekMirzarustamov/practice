import type { Theme } from '../lib/theme'

interface ThemeSkyToggleProps {
  theme: Theme
  onToggle: () => void
}

const STARS = [
  { top: '20%', left: '18%' },
  { top: '58%', left: '28%' },
  { top: '32%', left: '40%' },
  { top: '68%', left: '13%' },
]

/** Illustrated day/night switch for the Theme row — sun-and-clouds vs moon-and-stars. */
export function ThemeSkyToggle({ theme, onToggle }: ThemeSkyToggleProps) {
  const isLight = theme === 'light'
  return (
    <button
      type="button"
      className="sky-toggle"
      data-on={isLight}
      onClick={onToggle}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <span className="sky-toggle-layer sky-toggle-layer-night" aria-hidden="true">
        {STARS.map((s, i) => (
          <SparkleGlyph key={i} className="sky-toggle-star" style={{ top: s.top, left: s.left }} />
        ))}
      </span>
      <span className="sky-toggle-layer sky-toggle-layer-day" aria-hidden="true">
        <CloudGlyph className="sky-toggle-cloud sky-toggle-cloud-a" />
        <CloudGlyph className="sky-toggle-cloud sky-toggle-cloud-b" />
      </span>
      <span className="sky-toggle-thumb" aria-hidden="true">
        <span className="sky-toggle-thumb-moon">
          <span className="sky-toggle-crater sky-toggle-crater-a" />
          <span className="sky-toggle-crater sky-toggle-crater-b" />
        </span>
        <span className="sky-toggle-thumb-sun" />
      </span>
    </button>
  )
}

function SparkleGlyph({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} width="7" height="7" viewBox="0 0 8 8" fill="none">
      <path d="M4 0L4.8 3.2L8 4L4.8 4.8L4 8L3.2 4.8L0 4L3.2 3.2L4 0Z" fill="currentColor" />
    </svg>
  )
}

function CloudGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 12" fill="none">
      <path
        d="M4.5 10.5a3.5 3.5 0 010-7 4 4 0 017.6-1.4A3.2 3.2 0 0116.5 5a3 3 0 01-1 5.5h-11z"
        fill="currentColor"
      />
    </svg>
  )
}
