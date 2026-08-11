import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/Button'

type Mode = 'sign-in' | 'sign-up' | 'forgot'

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const clearMessages = () => {
    setError(null)
    setInfo(null)
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    clearMessages()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearMessages()
    setSubmitting(true)

    if (mode === 'sign-in') {
      const { error } = await signIn(email, password)
      if (error) setError(error)
    } else if (mode === 'sign-up') {
      const { error } = await signUp(email, password)
      if (error) setError(error)
      else setInfo('Check your email to confirm your account, then sign in.')
    } else {
      const { error } = await resetPassword(email)
      if (error) setError(error)
      else setInfo('Check your email for a password reset link.')
    }

    setSubmitting(false)
  }

  const handleGoogle = async () => {
    clearMessages()
    const { error } = await signInWithGoogle()
    if (error) setError(error)
  }

  return (
    <motion.div
      className="page auth-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="page-inner auth-inner">
        <span className="wordmark">Practice</span>
        <h1 className="setup-title">
          {mode === 'sign-in' && 'Welcome back.'}
          {mode === 'sign-up' && 'Create your account.'}
          {mode === 'forgot' && 'Reset your password.'}
        </h1>
        <p className="lede">
          {mode === 'forgot'
            ? "We'll email you a link to set a new password."
            : 'Your sessions, streak, and XP now sync across every device.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <span className="field-label">Email</span>
            <input
              className="search-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode !== 'forgot' && (
            <div className="field">
              <span className="field-label">Password</span>
              <input
                className="search-input"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {error && <p className="auth-message auth-error">{error}</p>}
          {info && <p className="auth-message auth-info">{info}</p>}

          <Button variant="primary" block type="submit" disabled={submitting}>
            {submitting
              ? 'Working...'
              : mode === 'sign-in'
                ? 'Sign in'
                : mode === 'sign-up'
                  ? 'Sign up'
                  : 'Send reset link'}
          </Button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>
            <Button block onClick={handleGoogle}>
              Continue with Google
            </Button>
          </>
        )}

        <div className="auth-links">
          {mode === 'sign-in' && (
            <>
              <button type="button" className="text-link" onClick={() => switchMode('sign-up')}>
                Need an account? Sign up
              </button>
              <button type="button" className="text-link" onClick={() => switchMode('forgot')}>
                Forgot password?
              </button>
            </>
          )}
          {mode === 'sign-up' && (
            <button type="button" className="text-link" onClick={() => switchMode('sign-in')}>
              Already have an account? Sign in
            </button>
          )}
          {mode === 'forgot' && (
            <button type="button" className="text-link" onClick={() => switchMode('sign-in')}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
