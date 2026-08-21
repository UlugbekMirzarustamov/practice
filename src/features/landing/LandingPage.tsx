import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ScrollRevealCard } from './ScrollRevealCard'
import { ParallaxHero } from './ParallaxHero'
import { usePageMeta } from '../../lib/usePageMeta'
import { InteractiveButton } from '../../components/InteractiveButton'
import heroHistorian from '../../assets/hero-historian.jpg'

interface LandingPageProps {
  onEnter: () => void
  onTryFree: () => void
}

const REVEAL = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: 'easeOut' },
} as const

const FEATURES = [
  {
    n: '1',
    title: 'Off the Cuff',
    body: 'A topic appears and you start writing immediately, whatever comes out first. There’s no outline stage, and definitely no time to draft the smarter-sounding version of yourself before anyone sees it.',
  },
  {
    n: '2',
    title: 'Deep Research',
    body: 'Same prompt, but you get up to sixty minutes to think it through first. The moment you actually start writing or speaking, though, the lock kicks in exactly like it does everywhere else on this page.',
  },
  {
    n: '3',
    title: 'Dangerous Mode',
    body: 'Optional, and not for everyone. Go quiet too long, or stop typing, and the session ends immediately, without asking twice. There’s no audience watching, but the session behaves like there is one.',
  },
  {
    n: '4',
    title: 'Streaks & XP',
    body: 'Every finished session earns XP and extends your streak, both computed server-side from sessions you actually completed. Even you can’t inflate that number — there’s simply no path to do it from your side of the screen.',
  },
  {
    n: '5',
    title: 'The Archive',
    body: 'Every session is kept, word for word, going back to the very first one you ever finished. Come back to a category six months later and Bema puts your first attempt right next to your latest — same prompt category, two very different word counts, usually.',
  },
  {
    n: '6',
    title: 'Verified Unaided',
    body: 'AI can generate words instantly. That makes genuine human thought more valuable, not less. A session earns the Verified Unaided badge by being typed or spoken live, start to finish, inside the lock — proof the words on the page are actually yours.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'Is Bema free?',
    a: 'Yes. Bema is free while it is young, and sign-in stays that way for you. No card, no trial period that quietly starts billing you.',
  },
  {
    q: 'Is my writing or speaking private?',
    a: 'Yes, by default. Every session is stored behind row-level security in our database, meaning the database itself refuses to hand your content to anyone but you, regardless of what the interface shows. It only becomes visible to others if you explicitly choose to publish that one session.',
  },
  {
    q: 'What is Dangerous Mode?',
    a: 'An optional setting that ends your session the moment you go quiet or stop typing for too long. Nothing softens that. It’s for people who want real performance pressure while practicing completely alone in their room.',
  },
  {
    q: 'Do I need an account to try it?',
    a: 'No. Your first three-minute session runs without an account, no strings attached. An account only starts to matter once you want that session saved somewhere, counted toward your XP, and sitting in an archive you can return to later.',
  },
]

const BG_DEMOSTHENES =
  'https://upload.wikimedia.org/wikipedia/commons/1/1b/Delacroix_-_Demosthenes_Declaiming_by_the_Seashore%2C_1859.jpg'
const BG_FORUM =
  'https://upload.wikimedia.org/wikipedia/commons/a/ae/Campo_Vaccino_verso_il_Campidoglio_-_Plate_031_-_Giuseppe_Vasi.jpg'
const BG_ARISTOTLE =
  'https://upload.wikimedia.org/wikipedia/commons/f/fb/Aristotle_tutoring_Alexander_by_J_L_G_Ferris_1895.jpg'

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.6 2.6" />
      <path d="M10 6v4.2l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FaqChevron({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.25 }}
    >
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}

function FaqChatAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="faq-chat-list">
      {FAQ_ITEMS.map((item, i) => {
        const open = openIndex === i
        return (
          <div key={item.q} className="faq-chat-pair">
            <button
              type="button"
              className="faq-chat-bubble faq-chat-question"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              <span>{item.q}</span>
              <FaqChevron open={open} />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  className="faq-chat-answer-collapse"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="faq-chat-bubble faq-chat-answer">
                    <p>{item.a}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export function LandingPage({ onEnter, onTryFree }: LandingPageProps) {
  usePageMeta({
    title: 'Bema — Never freeze up again',
    description:
      'A locked-timer writing and speaking practice discipline. Off the Cuff, Deep Research, and Dangerous Mode, with a real leaderboard and archive. Free, no card needed.',
  })
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0.05 })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-page">
      <header className={['landing-nav', scrolled ? 'scrolled' : ''].filter(Boolean).join(' ')}>
        <span className="landing-wordmark">Bema</span>
        <nav className="landing-nav-links">
          <a href="#about">Who it&rsquo;s for</a>
          <a href="#method">Method</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="landing-nav-actions">
          <button type="button" className="landing-footer-link" onClick={onEnter}>
            Sign in
          </button>
          <InteractiveButton className="landing-nav-cta" onClick={onTryFree}>
            Start Practicing
          </InteractiveButton>
        </div>
      </header>

      <section className="parallax-hero-full" ref={heroRef}>
        <ParallaxHero
          containerRef={heroRef}
          backgroundSrc={heroHistorian}
          backgroundAlt="A historian writing by hand on the hills above the Acropolis, Athens"
          figureSrc={heroHistorian}
          figureAlt=""
        />
      </section>

      <div className="landing-rule" />

      <ScrollRevealCard />

      <p className="landing-bridge-line">That is the whole premise. Here is who it is built for.</p>

      <motion.div className="landing-band-dark landing-band-figure" {...REVEAL}>
        <img
          className="landing-bg-figure"
          src={BG_DEMOSTHENES}
          alt="Demosthenes Declaiming by the Seashore, painting by Eugène Delacroix, 1859, National Gallery of Ireland"
        />
        <div className="landing-bg-scrim" />
        <div className="landing-band-fade landing-band-fade-about" />
        <section id="about" className="landing-section">
          <h2>
            <span className="hw-small">Who</span> This Is <b>For</b>
          </h2>
          <p>
            The page doesn&rsquo;t care how you feel about it, and neither should you. Writers who wait for the
            right mood rarely start at all. Speakers who over-rehearse run into the opposite problem &mdash; the
            rehearsal becomes the whole performance, and the real one never happens. So the session locks the
            moment you start &mdash; no leaving, no switching tabs, no quietly opening a new one to escape a hard
            sentence. The clock keeps running whether the words come easily or not, and whatever&rsquo;s on the
            page when time runs out is what you get.
          </p>
          <p>
            Most practice tools let you drill in private, at your own pace, with an undo button always in reach.
            That builds comfort with practicing &mdash; not with the moment that actually counts, like the
            best-man toast you agreed to give six months ago and have been avoiding writing ever since. This is
            built for IELTS candidates and speakers who freeze under pressure, but also just anyone who&rsquo;s
            noticed their writing habit quietly died sometime last year. A locked three-minute clock will feel
            uncomfortable at first.
          </p>
          <div className="landing-callout">
            <p>
              Demosthenes stammered, then trained by shouting over the sea with pebbles in his mouth, so no room
              would ever sound louder than the ocean. Dangerous Mode is the same idea. Three minutes at a time.
            </p>
          </div>
          <p className="landing-founder-note">
            Built by Ulugbek Mirzarustamov, who wanted a real clock instead of another private practice tool.
          </p>
        </section>
      </motion.div>

      <motion.div className="landing-band-dark landing-band-figure landing-band-method" {...REVEAL}>
        <img
          className="landing-bg-figure"
          src={BG_FORUM}
          alt="Campo Vaccino verso il Campidoglio, etching of the Roman Forum by Giuseppe Vasi, 1752"
        />
        <div className="landing-bg-scrim" />
        <div className="landing-band-fade landing-band-fade-method" />
        <section id="method" className="landing-section landing-section-wide">
          <h2>
            <span className="hw-small">The</span> <b>Method</b>
          </h2>
          <div className="feature-grid">
            {FEATURES.map((item) => (
              <div key={item.n} className="feature-card">
                <span className="landing-method-num">{item.n}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </motion.div>

      <motion.section className="landing-section landing-proof" {...REVEAL}>
        <p className="landing-section-lede landing-proof-lede">
          No seeded accounts, no invented rivals. Every number on the leaderboard comes from a session someone
          actually finished.
        </p>
        <div className="social-proof-grid">
          <div className="social-proof-card social-proof-empty">
            <span className="social-proof-empty-icon">
              <ClockIcon />
            </span>
            <p>Reviews open up once real sessions are finished. None invented in the meantime.</p>
          </div>
          <div className="social-proof-card social-proof-empty">
            <span className="social-proof-empty-icon">
              <ClockIcon />
            </span>
            <p>Yours could be the first one on this page.</p>
          </div>
        </div>
      </motion.section>

      <motion.div className="landing-band-figure" {...REVEAL}>
        <img
          className="landing-bg-figure"
          src={BG_ARISTOTLE}
          alt="Aristotle Tutoring Alexander, painting by Jean Leon Gerome Ferris, 1895"
        />
        <div className="landing-bg-scrim" />
        <div className="landing-band-fade landing-band-fade-pricing" />
        <section id="pricing" className="landing-section landing-pricing">
          <h2>
            <span className="hw-small">What</span> It <b>Costs</b>
          </h2>
          <div className="landing-price-card">
            <span className="landing-price">Free</span>
            <p>Free. We haven&rsquo;t figured out how to charge you yet.</p>
            <button type="button" className="landing-cta-primary" onClick={onEnter}>
              Start Practicing &rarr;
            </button>
          </div>
        </section>
      </motion.div>

      <motion.section id="faq" className="landing-section" {...REVEAL}>
        <h2>
          <span className="hw-small">A</span> Few <b>Questions</b>
        </h2>
        <FaqChatAccordion />
      </motion.section>

      <footer className="landing-footer">
        <div className="landing-footer-flourish" />
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            <span className="landing-wordmark">Bema</span>
            <p className="landing-footer-quote">
              &ldquo;Talent is common. Showing up is not. If you&rsquo;re here, you already have the harder
              part.&rdquo;
            </p>
            <button type="button" className="landing-cta-primary landing-footer-cta" onClick={onTryFree}>
              Start Practicing &rarr;
            </button>
          </div>
          <div className="landing-footer-col">
            <span className="landing-footer-heading">Product</span>
            <a href="#method">Off the Cuff</a>
            <a href="#method">Dangerous Mode</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="landing-footer-col">
            <span className="landing-footer-heading">Resources</span>
            <a href="#about">Who it&rsquo;s for</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="landing-footer-col">
            <span className="landing-footer-heading">Legal</span>
            <a href="/privacy">Privacy Policy</a>
            <span className="landing-footer-placeholder">Terms of Service (coming soon)</span>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Bema. All rights reserved.</span>
          <span>Built by Ulugbek Mirzarustamov</span>
        </div>
      </footer>
    </div>
  )
}
