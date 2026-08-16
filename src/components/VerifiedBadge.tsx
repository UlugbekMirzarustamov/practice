import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

const EXPLAINER_SEEN_KEY = 'practice.verifiedBadgeExplainerSeen'

interface VerifiedBadgeProps {
  size?: 'sm' | 'md'
  /** Suppresses the one-time explainer even on first sight — for dense list contexts like archive cards. */
  compact?: boolean
}

/** Small seal/stamp badge shown on sessions that passed the "Verified Unaided" authenticity check. */
export function VerifiedBadge({ size = 'md', compact = false }: VerifiedBadgeProps) {
  const [showExplainer, setShowExplainer] = useState(false)

  useEffect(() => {
    if (compact) return
    if (!localStorage.getItem(EXPLAINER_SEEN_KEY)) {
      setShowExplainer(true)
      localStorage.setItem(EXPLAINER_SEEN_KEY, 'true')
    }
  }, [compact])

  return (
    <span className="verified-badge-wrap">
      <span className={['verified-badge', `verified-badge-${size}`].join(' ')} title="Verified Unaided">
        <SealIcon />
        Verified Unaided
      </span>
      {showExplainer && (
        <motion.span
          className="verified-badge-explainer"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          AI can generate words instantly. That makes genuine human thought more valuable, not less — this badge is
          proof yours was live, start to finish, no shortcuts.
        </motion.span>
      )}
    </span>
  )
}

function SealIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8.4" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.7 1.7" />
      <circle cx="10" cy="10" r="5.8" stroke="currentColor" strokeWidth="1" />
      <path d="M6.9 10.1l2.1 2.1 4.2-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
