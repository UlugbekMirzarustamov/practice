import { motion } from 'motion/react'

interface GlowEffectProps {
  className?: string
  colors?: string[]
  duration?: number
}

/** Slow color-shifting glow sitting behind an element, a local equivalent of motion-primitives' GlowEffect. */
export function GlowEffect({ className, colors, duration = 5 }: GlowEffectProps) {
  const glowColors = colors ?? ['var(--accent)', 'var(--growth)', 'var(--accent-strong)', 'var(--accent)']

  return (
    <motion.div
      aria-hidden="true"
      className={['glow-effect', className].filter(Boolean).join(' ')}
      style={{
        background: `linear-gradient(90deg, ${glowColors.join(', ')})`,
        backgroundSize: '300% 300%',
      }}
      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    />
  )
}
