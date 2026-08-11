import { motion } from 'motion/react'
import { Button } from '../../components/Button'

interface SessionFailedProps {
  onDone: () => void
}

export function SessionFailed({ onDone }: SessionFailedProps) {
  return (
    <motion.div
      className="result-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="result-inner">
        <motion.span
          className="badge badge-danger"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          Session discarded
        </motion.span>

        <motion.h1
          className="result-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          You left before time was up
        </motion.h1>

        <p className="lede">Nothing was saved. Locked sessions only count if you stay for the whole duration.</p>

        <Button variant="primary" onClick={onDone}>
          Try again
        </Button>
      </div>
    </motion.div>
  )
}
