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
 * Full-bleed hero: the title text drifts on scroll for a bit of depth. The background image
 * stays static rather than parallaxing — an earlier version translated it too, which meant it
 * needed an oversized, inset box (extending past the section's own edges) so scrolling never
 * revealed an empty edge. That oversized box pushed object-position's crop window down into
 * the man's hairline on wide screens, cropping the top of his head. A static background needs
 * no such margin, so object-position can be tuned directly against the real crop and keep his
 * whole head in frame at any viewport width.
 *
 * Also deliberately just two layers. An earlier version duplicated the background image as a
 * separately-masked "figure" layer moving at its own (faster) rate, to fake a foreground
 * cutout — but a masked region moving independently of the pixels behind it drifts out of
 * alignment as soon as you scroll, which read as the man getting sliced by his own mask edge.
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
      tl.to(root.querySelectorAll('[data-parallax-layer="title"]'), { yPercent: 26, ease: 'none' }, 0)
    }, root)

    return () => ctx.revert()
  }, [containerRef])

  return (
    <>
      <img className="parallax-hero-full-bg" src={backgroundSrc} alt={backgroundAlt} loading="eager" />
      <div className="parallax-hero-full-scrim" aria-hidden="true" />
      <div data-parallax-layer="title" className="parallax-hero-full-title-layer" aria-hidden="true">
        <span className="parallax-hero-full-title">Bema</span>
      </div>
      <h1 className="sr-only">Bema: a locked-timer writing and speaking practice discipline. Never freeze up again.</h1>
      <div className="parallax-hero-full-fade" aria-hidden="true" />
    </>
  )
}
