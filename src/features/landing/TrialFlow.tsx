import type { Mode } from '../../types/session'

interface TrialPickerProps {
  onPick: (mode: Mode) => void
  onBack: () => void
}

export function TrialPicker({ onPick, onBack }: TrialPickerProps) {
  return (
    <div className="landing-page trial-screen">
      <header className="landing-nav">
        <button type="button" className="landing-wordmark landing-wordmark-btn" onClick={onBack}>
          Bema
        </button>
      </header>
      <div className="trial-picker">
        <span className="landing-eyebrow">Three real minutes, no account</span>
        <h1 className="landing-hero-title trial-picker-title">Choose how you want to practice.</h1>
        <p className="landing-hero-sub">
          Three minutes on the clock, starting the moment you choose. Leave the tab and you'll get a short warning
          before it's gone, same as it would for anyone with an account.
        </p>
        <div className="trial-mode-row">
          <button type="button" className="trial-mode-card" onClick={() => onPick('writing')}>
            <span className="trial-mode-title">Writing</span>
            <span className="trial-mode-sub">Type against the clock</span>
          </button>
          <button type="button" className="trial-mode-card" onClick={() => onPick('speaking')}>
            <span className="trial-mode-title">Speaking</span>
            <span className="trial-mode-sub">Talk, live transcription</span>
          </button>
        </div>
        <button type="button" className="landing-footer-link" onClick={onBack}>
          &larr; Back
        </button>
      </div>
    </div>
  )
}

interface TrialCompleteProps {
  mode: Mode
  topic: string
  content: string
  onSignUp: () => void
  onBack: () => void
}

export function TrialComplete({ mode, topic, content, onSignUp, onBack }: TrialCompleteProps) {
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div className="landing-page trial-screen">
      <header className="landing-nav">
        <button type="button" className="landing-wordmark landing-wordmark-btn" onClick={onBack}>
          Bema
        </button>
      </header>
      <div className="trial-complete">
        <span className="landing-eyebrow">Nice work</span>
        <h1 className="landing-hero-title trial-picker-title">That is one real session, done.</h1>
        <p className="landing-hero-sub">
          {wordCount > 0 ? `${wordCount} words on "${topic}."` : `A few minutes of "${topic}," spoken and gone.`} Create an
          account and this kind of session starts counting toward XP, streaks, and the archive.
        </p>

        <div className="trial-transcript">
          <span className="trial-transcript-label">{mode === 'writing' ? 'What you wrote' : 'What was heard'}</span>
          <p>{content.trim() || 'Nothing was said before time ran out. It happens.'}</p>
        </div>

        <div className="landing-cta-row">
          <button type="button" className="landing-cta-primary" onClick={onSignUp}>
            Create an account to save this &rarr;
          </button>
          <span className="landing-cta-note">Free. This transcript is not saved unless you sign up.</span>
        </div>
      </div>
    </div>
  )
}

interface TrialFailedProps {
  mode?: Mode
  topic?: string
  content?: string
  onRetry: () => void
  onSignUp: () => void
  onBack: () => void
}

export function TrialFailed({ mode, topic, content, onRetry, onSignUp, onBack }: TrialFailedProps) {
  const hasPreserved = Boolean(topic && content && content.trim())

  return (
    <div className="landing-page trial-screen">
      <header className="landing-nav">
        <button type="button" className="landing-wordmark landing-wordmark-btn" onClick={onBack}>
          Bema
        </button>
      </header>
      {hasPreserved ? (
        <div className="trial-complete">
          <span className="landing-eyebrow">Saved, not lost</span>
          <h1 className="landing-hero-title trial-picker-title">You stepped away. We kept what you had.</h1>
          <p className="landing-hero-sub">
            &quot;{topic}&quot; is still here. Create an account and it&rsquo;s yours to keep and continue.
          </p>
          <div className="trial-transcript">
            <span className="trial-transcript-label">{mode === 'writing' ? 'What you wrote' : 'What was heard'}</span>
            <p>{content}</p>
          </div>
          <div className="landing-cta-row">
            <button type="button" className="landing-cta-primary" onClick={onSignUp}>
              Create an account to continue &rarr;
            </button>
            <span className="landing-cta-note">Free. This is deleted if you don&rsquo;t sign up.</span>
          </div>
        </div>
      ) : (
        <div className="trial-complete">
          <span className="landing-eyebrow">Session ended</span>
          <h1 className="landing-hero-title trial-picker-title">You gave up before time was up.</h1>
          <p className="landing-hero-sub">That is the whole mechanic. In the real app there is no undo here either.</p>
          <div className="landing-cta-row">
            <button type="button" className="landing-cta-primary" onClick={onRetry}>
              Try again &rarr;
            </button>
            <button type="button" className="landing-footer-link" onClick={onBack}>
              Back to the page
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
