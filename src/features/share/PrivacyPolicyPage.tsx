import { usePageMeta } from '../../lib/usePageMeta'

interface PrivacyPolicyPageProps {
  onHome: () => void
}

export function PrivacyPolicyPage({ onHome }: PrivacyPolicyPageProps) {
  usePageMeta({
    title: 'Privacy Policy | Bema',
    description: 'What Bema collects, why, and how row-level security keeps your sessions private.',
  })

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <button type="button" className="landing-wordmark landing-wordmark-btn" onClick={onHome}>
          Bema
        </button>
      </header>

      <section className="landing-section" style={{ maxWidth: 720 }}>
        <span className="landing-chapter">Privacy Policy</span>
        <h1>What we collect, and why</h1>

        <div className="privacy-draft-notice">
          This is a starting draft written in plain language for a small, early-stage app. It is not legal advice,
          and has not been reviewed by a lawyer. Before relying on it for a real launch with paying users or users
          in jurisdictions with specific requirements (GDPR, CCPA, etc.), have it reviewed properly.
        </div>

        <h2>What we collect</h2>
        <p>
          <strong>Account info.</strong> Your email address (used only for sign-in, password reset, and account
          identification), a public handle and display name you choose, and an optional bio and avatar.
        </p>
        <p>
          <strong>Session content.</strong> The text you write or the transcript of what you say during a practice
          session, along with the topic, mode, duration, and timestamp. This is private by default and only becomes
          visible to anyone else if you explicitly choose to publish that session.
        </p>
        <p>
          <strong>Usage stats.</strong> Your XP, level, streak, and session counts. These are calculated
          automatically on our servers from your actual completed sessions, not entered by you or editable by
          anyone.
        </p>

        <h2>Who can see it</h2>
        <p>
          Every table in our database has row-level security enabled, with no exceptions. In practice this means the
          database itself refuses to return your session content, email, or private profile fields to any other
          user, regardless of what the app's interface does or doesn't show. The only things visible to other users
          are: your public handle, display name, avatar, and leaderboard stats, and any individual session you have
          explicitly published. We never expose your email to other users.
        </p>

        <h2>What we don't do</h2>
        <p>
          We don't sell your data. We don't share session content with third parties. We don't use your writing or
          speech to train any model. We don't run ads.
        </p>

        <h2>Analytics</h2>
        <p>
          We use privacy-respecting, cookie-free analytics to understand basic usage patterns (like which pages get
          visited), never to identify or track you individually across other sites.
        </p>

        <h2>Deleting your data</h2>
        <p>
          You can unpublish any session at any time from your Writings page. Full account deletion is handled by
          reaching out to us directly for now; we plan to add a self-serve delete option.
        </p>

        <h2>Contact</h2>
        <p>Questions about this policy can be sent to the address associated with this app.</p>

        <button type="button" className="landing-cta-primary" onClick={onHome} style={{ marginTop: 24 }}>
          &larr; Back to Bema
        </button>
      </section>
    </div>
  )
}
