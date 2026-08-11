import { motion } from 'motion/react'

interface OptionToggleProps {
  groupId: string
  label: string
  tagline?: string
  selected: boolean
  disabled?: boolean
  onClick: () => void
}

export function OptionToggle({ groupId, label, tagline, selected, disabled, onClick }: OptionToggleProps) {
  return (
    <motion.button
      type="button"
      className={['option', selected ? 'selected' : '', disabled ? 'disabled' : ''].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      title={disabled ? 'Not supported in this browser' : undefined}
    >
      {selected && (
        <motion.span layoutId={`${groupId}-check`} className="check" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />
      )}
      <span className="option-label">{label}</span>
      {tagline && <span className="option-tagline">{tagline}</span>}
    </motion.button>
  )
}
