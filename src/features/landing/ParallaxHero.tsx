import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface ParallaxHeroProps {
  containerRef: RefObject<HTMLDivElement | null>
  backgroundSrc: string
  backgroundAlt: string
  figureSrc: string
  figureAlt: string
}

/**
 * Renders as siblings of the caller's own hero-figure children (no wrapper div) so the
 * existing .landing-bg-figure / .landing-hero-figure CSS (filters, scrim, fade) keeps
 * applying untouched — this only adds scroll-driven depth on top of it.
 */
export function ParallaxHero({ containerRef, backgroundSrc, backgroundAlt, figureSrc, figureAlt }: ParallaxHeroProps) {
  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.4,
        },
      })
      tl.to(root.querySelectorAll('[data-parallax-layer="back"]'), { yPercent: 16, ease: 'none' }, 0)
      tl.to(root.querySelectorAll('[data-parallax-layer="title"]'), { yPercent: 32, ease: 'none' }, 0)
      tl.to(root.querySelectorAll('[data-parallax-layer="figure"]'), { yPercent: 52, ease: 'none' }, 0)
    }, root)

    return () => ctx.revert()
  }, [containerRef])

  return (
    <>
      <img
        data-parallax-layer="back"
        className="landing-bg-figure parallax-oversize"
        src={backgroundSrc}
        alt={backgroundAlt}
        loading="eager"
      />
      <div data-parallax-layer="title" className="parallax-hero-title-layer" aria-hidden="true">
        <span className="parallax-hero-title">Bema</span>
      </div>
      <img
        data-parallax-layer="figure"
        className="landing-bg-figure parallax-oversize parallax-hero-figure"
        src={figureSrc}
        alt={figureAlt}
        loading="eager"
      />
    </>
  )
}
