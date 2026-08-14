import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

const YOUNG_CICERO_READING = 'https://upload.wikimedia.org/wikipedia/commons/4/4f/The_Young_Cicero_Reading.jpg'

export function ScrollRevealCard() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })

  const rotate = useTransform(scrollYProgress, [0, 0.5], [16, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], isMobile ? [0.9, 1] : [0.92, 1])
  const translate = useTransform(scrollYProgress, [0, 0.5], [40, 0])

  return (
    <div className="scroll-reveal-wrap" ref={containerRef}>
      <span className="landing-chapter">A Word, Before You Begin</span>
      <motion.div className="scroll-reveal-card" style={{ rotateX: rotate, scale, y: translate, perspective: 1000 }}>
        <img
          src={YOUNG_CICERO_READING}
          alt="The Young Cicero Reading, fresco by Vincenzo Foppa, circa 1464, Wallace Collection"
          className="scroll-reveal-img"
          draggable={false}
        />
        <div className="scroll-reveal-caption">
          <blockquote>&ldquo;Constant practice devoted to one subject often prevails over both ability and skill.&rdquo;</blockquote>
          <cite>Marcus Tullius Cicero, Pro Balbo</cite>
        </div>
      </motion.div>
    </div>
  )
}
