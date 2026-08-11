import type { RefObject } from 'react'
import { motion, useScroll } from 'motion/react'

interface ScrollProgressProps {
  containerRef: RefObject<HTMLElement | null>
  className?: string
}

/** Thin bar tracking scroll depth of a container, a local equivalent of motion-primitives' ScrollProgress. */
export function ScrollProgress({ containerRef, className }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll({ container: containerRef })

  return (
    <motion.div
      className={['scroll-progress', className].filter(Boolean).join(' ')}
      style={{ scaleX: scrollYProgress }}
    />
  )
}
