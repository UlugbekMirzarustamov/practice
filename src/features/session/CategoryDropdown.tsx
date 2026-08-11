import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Category } from '../../data/prompts'
import { CATEGORIES } from '../../data/prompts'

interface CategoryDropdownProps {
  value: Category
  onChange: (category: Category) => void
}

export function CategoryDropdown({ value, onChange }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = CATEGORIES.find((c) => c.id === value) ?? CATEGORIES[0]

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="dropdown" ref={rootRef}>
      <button type="button" className="dropdown-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="dropdown-trigger-text">
          <span className="dropdown-trigger-label">{selected.label}</span>
          <span className="dropdown-trigger-tagline">{selected.tagline}</span>
        </span>
        <ChevronIcon open={open} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="dropdown-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={['dropdown-item', c.id === value ? 'selected' : ''].filter(Boolean).join(' ')}
                onClick={() => {
                  onChange(c.id)
                  setOpen(false)
                }}
              >
                <span className="dropdown-item-text">
                  <span className="dropdown-item-label">{c.label}</span>
                  <span className="dropdown-item-tagline">{c.tagline}</span>
                </span>
                {c.id === value && <CheckIcon />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
