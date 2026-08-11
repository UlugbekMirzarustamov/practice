import { motion } from 'motion/react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>

interface ButtonProps extends NativeButtonProps {
  variant?: 'primary' | 'ghost'
  block?: boolean
  icon?: boolean
  children: ReactNode
}

export function Button({ variant = 'ghost', block, icon, className, children, disabled, ...rest }: ButtonProps) {
  const classes = [
    'btn',
    variant === 'primary' ? 'btn-primary' : 'btn-ghost',
    block ? 'btn-block' : '',
    icon ? 'btn-icon' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.button
      type="button"
      className={classes}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
