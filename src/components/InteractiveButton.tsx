import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface InteractiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

/** A button whose label slides out and an arrow-led label slides in on hover. */
export function InteractiveButton({ children, className, type = 'button', ...rest }: InteractiveButtonProps) {
  return (
    <button type={type} className={['btn-interactive', className].filter(Boolean).join(' ')} {...rest}>
      <span className="btn-interactive-label">{children}</span>
      <span className="btn-interactive-reveal">
        {children}
        <ArrowIcon />
      </span>
    </button>
  )
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
