import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/Button'
import { InteractiveButton } from '../../components/InteractiveButton'
import { usePageMeta } from '../../lib/usePageMeta'
import authPhilosopher from '../../assets/auth-philosopher.jpg'

type Mode = 'sign-in' | 'sign-up' | 'forgot'

const MODE_TITLES: Record<Mode, string> = {
  'sign-in': 'Sign in | Bema',
  'sign-up': 'Create your account | Bema',
  forgot: 'Reset your password | Bema',
}

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('sign-in')
  usePageMeta({
    title: MODE_TITLES[mode],
    description: 'Sign in or create a free Bema account to save your sessions, streak, and XP across devices.',
  })
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
      className="auth-split"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="auth-form-side">
        <div className="auth-inner">
          <div className="auth-card">
            <span className="auth-badge">
              <SignInIcon />
            </span>
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

              <InteractiveButton className="btn btn-primary btn-block" type="submit" disabled={submitting}>
                {submitting
                  ? 'Working...'
                  : mode === 'sign-in'
                    ? 'Sign in'
                    : mode === 'sign-up'
                      ? 'Sign up'
                      : 'Send reset link'}
              </InteractiveButton>
            </form>

            {mode !== 'forgot' && (
              <>
                <div className="auth-divider">
                  <span>or</span>
                </div>
                <Button block onClick={handleGoogle}>
                  <GoogleIcon />
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
        </div>
      </div>

      <div className="auth-visual-side">
        <img
          className="auth-visual-image"
          src={authPhilosopher}
          alt="A philosopher in a traveling cloak, arms crossed, looking out toward the Acropolis at dusk"
        />
        <div className="auth-visual-scrim" aria-hidden="true" />
        <blockquote className="auth-visual-quote">
          <p>&ldquo;The unexamined life is not worth living.&rdquo;</p>
          <cite>&mdash; Socrates</cite>
        </blockquote>
      </div>
    </motion.div>
  )
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.9A9 9 0 000 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.9 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  )
}

function SignInIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
      <path d="M8 4H5a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.5 13.5L16 10l-3.5-3.5M16 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
