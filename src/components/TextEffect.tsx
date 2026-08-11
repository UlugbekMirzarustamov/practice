import { motion } from 'motion/react'

interface TextEffectProps {
  children: string
  className?: string
  speedReveal?: number
  speedSegment?: number
}

/** Word-by-word blur-fade reveal, a local equivalent of motion-primitives' TextEffect fade-in-blur preset. */
export function TextEffect({ children, className, speedReveal = 1, speedSegment = 1 }: TextEffectProps) {
  const words = children.split(' ')

  return (
    <motion.span
      className={className}
      style={{ display: 'inline-block' }}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.05 / speedSegment, delayChildren: 0.06 / speedReveal },
        },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
          variants={{
            hidden: { opacity: 0, filter: 'blur(8px)', y: 6 },
            visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
          }}
          transition={{ duration: 0.4 }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  )
}
