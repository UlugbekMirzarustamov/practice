import { useEffect, useState } from 'react'
import { motion, animate } from 'motion/react'
import { levelProgress } from '../../lib/gamification'

interface XpBarProps {
  prevXp: number
  nextXp: number
}

export function XpBar({ prevXp, nextXp }: XpBarProps) {
  const prev = levelProgress(prevXp)
  const next = levelProgress(nextXp)
  const leveledUp = next.level > prev.level

  const [phase, setPhase] = useState<'fill-prev' | 'levelup' | 'fill-next'>(leveledUp ? 'fill-prev' : 'fill-next')
  const [displayXp, setDisplayXp] = useState(prevXp)

  useEffect(() => {
    const controls = animate(prevXp, nextXp, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (v: number) => setDisplayXp(Math.round(v)),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!leveledUp) return
    const t1 = setTimeout(() => setPhase('levelup'), 700)
    const t2 = setTimeout(() => setPhase('fill-next'), 1500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showingNext = phase === 'fill-next'
  const barProgress = showingNext ? next.progress : leveledUp ? 1 : prev.progress
  const shownLevel = showingNext ? next.level : prev.level

  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-labels">
        <span>Lv {shownLevel}</span>
        <span className="tabular">{displayXp} XP</span>
      </div>
      <div className="xp-bar-track">
        <motion.div
          className="xp-bar-fill"
          animate={{ width: `${Math.min(100, barProgress * 100)}%` }}
          transition={{ duration: showingNext ? 0.9 : 0.6, ease: 'easeInOut' }}
        />
      </div>
      {phase === 'levelup' && (
        <motion.div
          className="level-up-flash"
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          Level {next.level}!
        </motion.div>
      )}
    </div>
  )
}
