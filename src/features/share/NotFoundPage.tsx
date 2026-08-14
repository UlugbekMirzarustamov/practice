import { usePageMeta } from '../../lib/usePageMeta'

interface NotFoundPageProps {
  onHome: () => void
}

const BG_FORUM =
  'https://upload.wikimedia.org/wikipedia/commons/a/ae/Campo_Vaccino_verso_il_Campidoglio_-_Plate_031_-_Giuseppe_Vasi.jpg'

export function NotFoundPage({ onHome }: NotFoundPageProps) {
  usePageMeta({ title: 'Page not found — Bema', description: 'This page does not exist.' })

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <span className="landing-wordmark">Bema</span>
      </header>
      <div className="landing-band-figure not-found-figure">
        <img
          className="landing-bg-figure"
          src={BG_FORUM}
          alt="Campo Vaccino verso il Campidoglio, etching of the Roman Forum in ruins by Giuseppe Vasi, 1752"
        />
        <div className="landing-bg-scrim" />
        <div className="not-found-content">
          <span className="landing-chapter">404</span>
          <h1 className="landing-hero-title">This page fell into ruin.</h1>
          <p className="landing-hero-sub">
            There&rsquo;s nothing here, the same way there&rsquo;s nothing left of most of what people build. Go
            build something that lasts a minute instead.
          </p>
          <button type="button" className="landing-cta-primary" onClick={onHome}>
            Back to Bema &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
