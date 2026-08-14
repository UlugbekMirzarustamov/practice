import { useMemo } from 'react'
import { motion } from 'motion/react'
import { Button } from '../../components/Button'

interface MilestoneCelebrationProps {
  milestoneId: string
  onDismiss: () => void
}

interface ParsedMilestone {
  kind: 'sessions' | 'streak'
  value: number
}

function parseMilestone(id: string): ParsedMilestone | null {
  const match = id.match(/^milestone-(sessions|streak)-(\d+)$/)
  if (!match) return null
  return { kind: match[1] as 'sessions' | 'streak', value: Number(match[2]) }
}

const SESSION_COPY: Record<number, { title: string; body: string }> = {
  1: { title: 'First session done', body: "You showed up and finished. That's the whole game." },
  5: { title: '5 sessions in', body: 'The habit is starting to take shape.' },
  25: { title: '25 sessions', body: "Consistency like this doesn't happen by accident." },
  100: { title: '100 sessions', body: 'Certified regular. Triple digits.' },
}

const STREAK_COPY: Record<number, { title: string; body: string }> = {
  7: { title: 'One week streak', body: "Seven days straight. You've built momentum." },
  14: { title: 'Two week streak', body: 'Two weeks without missing a day.' },
  30: { title: '30 day streak', body: 'A full month, unbroken.' },
  60: { title: '60 day streak', body: 'Two months in. This is who you are now.' },
  100: { title: '100 day streak', body: '100 days straight. Absolutely relentless.' },
}

const CONFETTI_COLORS = ['var(--accent)', 'var(--accent-strong)', 'var(--growth)', 'var(--growth-strong)', '#fff']

export function MilestoneCelebration({ milestoneId, onDismiss }: MilestoneCelebrationProps) {
  const parsed = parseMilestone(milestoneId)

  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 0.5,
        duration: 1.6 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 120,
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 6,
      })),
    [],
  )

  if (!parsed) return null

  const copy = parsed.kind === 'sessions' ? SESSION_COPY[parsed.value] : STREAK_COPY[parsed.value]
  if (!copy) return null

  return (
    <motion.div
      className="milestone-overlay"
      role="dialog"
      aria-label={copy.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      <div className="milestone-confetti" aria-hidden="true">
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            className="milestone-confetti-piece"
            style={{ left: `${p.left}%`, width: p.size, height: p.size * 0.4, background: p.color }}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{ y: '110vh', x: p.drift, opacity: [1, 1, 0], rotate: p.rotate }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          />
        ))}
      </div>

      <motion.div
        className="milestone-card"
        initial={{ scale: 0.7, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="milestone-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.3 }}
        >
          {parsed.kind === 'streak' ? '🔥' : '🏆'}
        </motion.div>
        <span className="milestone-eyebrow">Milestone unlocked</span>
        <h2 className="milestone-title">{copy.title}</h2>
        <p className="milestone-body">{copy.body}</p>
        <Button variant="primary" onClick={onDismiss}>
          Keep going
        </Button>
      </motion.div>
    </motion.div>
  )
}
