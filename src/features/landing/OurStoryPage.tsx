import { motion } from 'motion/react'
import { InteractiveButton } from '../../components/InteractiveButton'
import { usePageMeta } from '../../lib/usePageMeta'

interface OurStoryPageProps {
  onNavigate: (hash?: string) => void
  onTryFree: () => void
}

const BG_STORY =
  'https://upload.wikimedia.org/wikipedia/commons/a/ae/Campo_Vaccino_verso_il_Campidoglio_-_Plate_031_-_Giuseppe_Vasi.jpg'

const NAV_ITEMS = [
  { label: "Who it's for", hash: 'about' },
  { label: 'Method', hash: 'method' },
  { label: 'Pricing', hash: 'pricing' },
  { label: 'FAQ', hash: 'faq' },
]

const FADE_UP = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
})

export function OurStoryPage({ onNavigate, onTryFree }: OurStoryPageProps) {
  usePageMeta({
    title: 'Our Story | Bema',
    description: 'Why Bema exists: a real clock, a locked page, and no room to hide behind a draft.',
  })

  return (
    <div className="our-story-page">
      <img className="our-story-bg" src={BG_STORY} alt="Campo Vaccino verso il Campidoglio, etching of the Roman Forum by Giuseppe Vasi, 1752" />
      <div className="our-story-scrim" aria-hidden="true" />

      <button type="button" className="our-story-home" onClick={() => onNavigate()}>
        Bema
      </button>

      <nav className="our-story-nav">
        {NAV_ITEMS.map((item) => (
          <button key={item.label} type="button" onClick={() => onNavigate(item.hash)}>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="our-story-content">
        <motion.h1 className="our-story-title" {...FADE_UP(0.1)}>
          Bema
        </motion.h1>

        <div className="our-story-side">
          <motion.p className="our-story-lede" {...FADE_UP(0.45)}>
            Bema exists for the moment right before you speak, when the excuses run out and the words either
            come or they don&rsquo;t. No private drafts, no do-overs, no polishing before anyone sees it. Just a
            locked clock, a blank page, and whatever you actually have to say.
          </motion.p>
          <motion.div {...FADE_UP(0.65)}>
            <InteractiveButton className="our-story-cta" onClick={onTryFree}>
              Start Practicing
            </InteractiveButton>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
