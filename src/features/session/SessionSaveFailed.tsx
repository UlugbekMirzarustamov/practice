import { useState } from 'react'
import { motion } from 'motion/react'
import { Button } from '../../components/Button'

interface SessionSaveFailedProps {
  content: string
  draftBackedUp: boolean
  onRetry: () => Promise<void>
  onDiscard: () => void
}

export function SessionSaveFailed({ content, draftBackedUp, onRetry, onDiscard }: SessionSaveFailedProps) {
  const [retrying, setRetrying] = useState(false)
  const [retryFailed, setRetryFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleRetry = async () => {
    setRetrying(true)
    setRetryFailed(false)
    try {
      await onRetry()
    } catch {
      setRetryFailed(true)
    } finally {
      setRetrying(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard access denied, silently ignore
    }
  }

  return (
    <motion.div className="result-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <div className="result-inner save-failed-inner">
        <motion.span
          className="badge badge-warning"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          Couldn&rsquo;t save
        </motion.span>

        <motion.h1 className="result-title" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          Your writing is safe. The save isn&rsquo;t &mdash; yet.
        </motion.h1>

        <p className="lede">
          The session finished, but saving it to your account failed
          {draftBackedUp
            ? " — most likely a dropped connection. It's held below, and we've also backed it up as a draft."
            : ". It's held below exactly as you left it — nothing has been discarded."}{' '}
          Copy it out if you want a second copy of your own, then try saving again.
        </p>

        <div className="save-failed-content">{content || <em>No content captured.</em>}</div>

        <div className="save-failed-actions">
          <Button variant="primary" onClick={handleRetry} disabled={retrying}>
            {retrying ? 'Saving...' : 'Try saving again'}
          </Button>
          <button type="button" className="text-link" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy text'}
          </button>
        </div>

        {retryFailed && (
          <p className="option-hint save-failed-warning">
            Still couldn&rsquo;t save. Check your connection and try again — your writing isn&rsquo;t going anywhere.
          </p>
        )}

        <button type="button" className="text-link" onClick={onDiscard}>
          Back to dashboard
        </button>
      </div>
    </motion.div>
  )
}
