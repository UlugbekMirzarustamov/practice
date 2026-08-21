import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface ParallaxHeroProps {
  containerRef: RefObject<HTMLDivElement | null>
  backgroundSrc: string
  backgroundAlt: string
}

/**
 * Full-bleed scroll-parallax hero: background/title move at different rates as the page
 * scrolls. Renders as children of the caller's own full-bleed section (no wrapper div) so
 * the section's own sizing/overflow CSS keeps applying untouched.
 *
 * Deliberately just two layers now. An earlier version duplicated the background image as a
 * separately-masked "figure" layer moving at its own (faster) rate, to fake a foreground
 * cutout — but a masked region moving independently of the pixels behind it drifts out of
 * alignment as soon as you scroll, which read as the man getting sliced by his own mask
 * edge. Simpler and correct: one background image, unmasked, with the figure's face kept
 * fully in frame via object-position.
 */
export function ParallaxHero({ containerRef, backgroundSrc, backgroundAlt }: ParallaxHeroProps) {
  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: '+=650',
          scrub: 0.2,
        },
      })
      tl.to(root.querySelectorAll('[data-parallax-layer="back"]'), { yPercent: 12, ease: 'none' }, 0)
      tl.to(root.querySelectorAll('[data-parallax-layer="title"]'), { yPercent: 26, ease: 'none' }, 0)
    }, root)

    return () => ctx.revert()
  }, [containerRef])

  return (
    <>
      <img
        data-parallax-layer="back"
        className="parallax-hero-full-bg"
        src={backgroundSrc}
        alt={backgroundAlt}
        loading="eager"
      />
      <div className="parallax-hero-full-scrim" aria-hidden="true" />
      <div data-parallax-layer="title" className="parallax-hero-full-title-layer" aria-hidden="true">
        <span className="parallax-hero-full-title">Bema</span>
      </div>
      <h1 className="sr-only">Bema: a locked-timer writing and speaking practice discipline. Never freeze up again.</h1>
      <div className="parallax-hero-full-fade" aria-hidden="true" />
    </>
  )
}
