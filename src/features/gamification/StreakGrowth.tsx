import { motion } from 'motion/react'

interface StreakGrowthProps {
  streak: number
  sessionCount?: number
  size?: 'sm' | 'lg'
}

interface Leaf {
  x: number
  y: number
  rx: number
  ry: number
  rotate: number
}

function getStage(streak: number): number {
  if (streak <= 0) return 0
  if (streak <= 2) return 1
  if (streak <= 6) return 2
  if (streak <= 13) return 3
  if (streak <= 29) return 4
  return 5
}

const STEM_HEIGHT = [0, 14, 26, 40, 52, 60]

function leafPositions(stage: number): Leaf[] {
  const top = 92 - STEM_HEIGHT[stage]
  switch (stage) {
    case 1:
      return [{ x: 54, y: top + 4, rx: 7, ry: 4, rotate: -20 }]
    case 2:
      return [
        { x: 54, y: top + 6, rx: 8, ry: 4, rotate: -25 },
        { x: 46, y: top + 12, rx: 8, ry: 4, rotate: 25 },
      ]
    case 3:
      return [
        { x: 56, y: top + 6, rx: 9, ry: 4.5, rotate: -25 },
        { x: 44, y: top + 12, rx: 9, ry: 4.5, rotate: 25 },
        { x: 57, y: top + 20, rx: 9, ry: 4.5, rotate: -30 },
        { x: 43, y: top + 26, rx: 9, ry: 4.5, rotate: 30 },
      ]
    case 4:
      return [
        { x: 58, y: top + 8, rx: 10, ry: 5, rotate: -25 },
        { x: 42, y: top + 14, rx: 10, ry: 5, rotate: 25 },
        { x: 59, y: top + 24, rx: 10, ry: 5, rotate: -30 },
        { x: 41, y: top + 30, rx: 10, ry: 5, rotate: 30 },
      ]
    default:
      return []
  }
}

export function StreakGrowth({ streak, sessionCount = 0, size = 'lg' }: StreakGrowthProps) {
  const wilted = streak <= 0 && sessionCount > 0
  const stage = getStage(streak)
  const dim = size === 'sm' ? 56 : 140
  const top = 92 - STEM_HEIGHT[wilted ? 2 : stage]

  return (
    <div className="streak-growth">
      <motion.svg
        key={wilted ? 'wilted' : stage}
        width={dim}
        height={dim}
        viewBox="0 0 100 100"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <ellipse cx="50" cy="92" rx="34" ry="5" fill="var(--border-soft)" />

        {wilted ? (
          <>
            <path
              d="M50 92 C 52 78, 46 66, 54 52"
              stroke="var(--danger)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
            <ellipse cx="60" cy="70" rx="8" ry="4" fill="var(--danger)" opacity="0.55" transform="rotate(50 60 70)" />
            <ellipse cx="44" cy="80" rx="7" ry="3.5" fill="var(--danger)" opacity="0.5" transform="rotate(-40 44 80)" />
            <ellipse cx="56" cy="90" rx="6" ry="3" fill="var(--danger)" opacity="0.4" transform="rotate(15 56 90)" />
          </>
        ) : (
          <>
            {stage === 0 && <circle cx="50" cy="88" r="4" fill="var(--growth)" />}

            {stage >= 1 && stage < 5 && (
              <path d={`M50 92 L50 ${top}`} stroke="var(--growth)" strokeWidth="4" strokeLinecap="round" fill="none" />
            )}

            {leafPositions(stage).map((leaf, i) => (
              <ellipse
                key={i}
                cx={leaf.x}
                cy={leaf.y}
                rx={leaf.rx}
                ry={leaf.ry}
                fill="var(--growth-strong)"
                transform={`rotate(${leaf.rotate} ${leaf.x} ${leaf.y})`}
              />
            ))}

            {stage === 4 && <circle cx="50" cy={top - 4} r="6" fill="var(--accent-strong)" />}

            {stage === 5 && (
              <>
                <path d="M50 92 L50 34" stroke="var(--growth)" strokeWidth="7" strokeLinecap="round" fill="none" />
                <circle cx="50" cy="28" r="22" fill="var(--growth-strong)" opacity="0.9" />
                <circle cx="34" cy="40" r="15" fill="var(--growth)" opacity="0.9" />
                <circle cx="66" cy="40" r="15" fill="var(--growth)" opacity="0.9" />
              </>
            )}
          </>
        )}
      </motion.svg>
      <span className="streak-count tabular">
        {wilted ? 'Streak broken' : `${streak} day${streak === 1 ? '' : 's'}`}
      </span>
    </div>
  )
}
