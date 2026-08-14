import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react'
import { loadWritingPrefs, saveWritingPrefs } from '../../lib/writingPrefs'

interface FormattingDockProps {
  editorRef: RefObject<HTMLDivElement | null>
}

const FONT_CHOICES = [
  { label: 'Inter', family: "'Inter', sans-serif" },
  { label: 'Source Sans Pro', family: "'Source Sans 3', sans-serif" },
  { label: 'Work Sans', family: "'Work Sans', sans-serif" },
  { label: 'Manrope', family: "'Manrope', sans-serif" },
  { label: 'DM Sans', family: "'DM Sans', sans-serif" },
  { label: 'Lora', family: "'Lora', serif" },
  { label: 'Libre Baskerville', family: "'Libre Baskerville', serif" },
  { label: 'Playfair Display', family: "'Playfair Display', serif" },
  { label: 'Arvo', family: "'Arvo', serif" },
  { label: 'Montserrat', family: "'Montserrat', sans-serif" },
]

type FormatState = {
  bold: boolean
  italic: boolean
  underline: boolean
  strikeThrough: boolean
  heading: boolean
  quote: boolean
  justifyLeft: boolean
  justifyCenter: boolean
  justifyRight: boolean
}

const HIGHLIGHT_COLOR = '#f5d97a'
const TEXT_COLORS = ['#241f17', '#6d2c2c', '#b8834a', '#3d6e5a', '#3a4f8a']

// document.queryCommandState('bold' | 'italic' | ...) can misreport right after a
// formatBlock change (e.g. toggling Heading), so inline styles are read from the
// selection's actual ancestor tags instead, which formatBlock never touches.
function isAncestorTag(root: HTMLElement | null, tags: string[]): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  let node: Node | null = sel.getRangeAt(0).startContainer
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement
  let el = node as HTMLElement | null
  while (el && el !== root?.parentElement) {
    if (tags.includes(el.tagName)) return true
    el = el.parentElement
  }
  return false
}

function readFormatState(root: HTMLElement | null): FormatState {
  const block = document.queryCommandValue('formatBlock').toLowerCase()
  return {
    bold: isAncestorTag(root, ['B', 'STRONG']),
    italic: isAncestorTag(root, ['I', 'EM']),
    underline: isAncestorTag(root, ['U']),
    strikeThrough: isAncestorTag(root, ['S', 'STRIKE', 'DEL']),
    heading: block === 'h3',
    quote: block === 'blockquote',
    justifyLeft: document.queryCommandState('justifyLeft'),
    justifyCenter: document.queryCommandState('justifyCenter'),
    justifyRight: document.queryCommandState('justifyRight'),
  }
}

export function FormattingDock({ editorRef }: FormattingDockProps) {
  const [formats, setFormats] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    heading: false,
    quote: false,
    justifyLeft: true,
    justifyCenter: false,
    justifyRight: false,
  })
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [fontPickerOpen, setFontPickerOpen] = useState(false)
  const [currentFontFamily, setCurrentFontFamily] = useState(() => loadWritingPrefs().editorFontFamily)
  const [copied, setCopied] = useState(false)
  const mouseX = useMotionValue(Infinity)

  useEffect(() => {
    if (editorRef.current) editorRef.current.style.fontFamily = currentFontFamily
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = () => {
    editorRef.current?.focus()
    setFormats(readFormatState(editorRef.current))
  }

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    refresh()
  }

  const toggleFormatBlock = (tag: 'h3' | 'blockquote') => {
    const current = document.queryCommandValue('formatBlock').toLowerCase()
    exec('formatBlock', current === tag ? 'p' : tag)
  }

  const handleLink = () => {
    const url = window.prompt('Link URL')
    if (url) exec('createLink', url)
  }

  const handleColorPick = (color: string) => {
    exec('foreColor', color)
    setColorPickerOpen(false)
  }

  const handleFontSelect = (family: string) => {
    if (editorRef.current) editorRef.current.style.fontFamily = family
    setCurrentFontFamily(family)
    saveWritingPrefs({ ...loadWritingPrefs(), editorFontFamily: family })
    setFontPickerOpen(false)
    editorRef.current?.focus()
  }

  const handleCopy = async () => {
    const text = editorRef.current?.innerText ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard permission denied or unavailable; silently no-op
    }
    editorRef.current?.focus()
  }

  return (
    <motion.div
      className="dock-toolbar"
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      <div className="dock-color-wrap">
        <DockIcon mouseX={mouseX} label="Font" onClick={() => setFontPickerOpen((o) => !o)}>
          <span className="dock-font-glyph">Aa</span>
        </DockIcon>
        {fontPickerOpen && (
          <div className="dock-color-popover dock-font-popover">
            {FONT_CHOICES.map((f) => (
              <button
                key={f.label}
                type="button"
                className={['dock-font-option', f.family === currentFontFamily ? 'active' : ''].filter(Boolean).join(' ')}
                style={{ fontFamily: f.family }}
                onClick={() => handleFontSelect(f.family)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="dock-divider" />

      <DockIcon mouseX={mouseX} label="Bold" active={formats.bold} onClick={() => exec('bold')}>
        <b>B</b>
      </DockIcon>
      <DockIcon mouseX={mouseX} label="Italic" active={formats.italic} onClick={() => exec('italic')}>
        <i>I</i>
      </DockIcon>
      <DockIcon mouseX={mouseX} label="Underline" active={formats.underline} onClick={() => exec('underline')}>
        <u>U</u>
      </DockIcon>
      <DockIcon mouseX={mouseX} label="Strikethrough" active={formats.strikeThrough} onClick={() => exec('strikeThrough')}>
        <s>S</s>
      </DockIcon>
      <DockIcon mouseX={mouseX} label="Link" onClick={handleLink}>
        <LinkIcon />
      </DockIcon>
      <DockIcon mouseX={mouseX} label="Heading" active={formats.heading} onClick={() => toggleFormatBlock('h3')}>
        H
      </DockIcon>
      <DockIcon mouseX={mouseX} label="Quote" active={formats.quote} onClick={() => toggleFormatBlock('blockquote')}>
        &rdquo;&rdquo;
      </DockIcon>

      <span className="dock-divider" />

      <DockIcon mouseX={mouseX} label="Highlight" onClick={() => exec('hiliteColor', HIGHLIGHT_COLOR)}>
        <HighlightIcon />
      </DockIcon>
      <div className="dock-color-wrap">
        <DockIcon mouseX={mouseX} label="Text color" onClick={() => setColorPickerOpen((o) => !o)}>
          <PaletteIcon />
        </DockIcon>
        {colorPickerOpen && (
          <div className="dock-color-popover">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="dock-color-swatch"
                style={{ background: color }}
                onClick={() => handleColorPick(color)}
                aria-label={`Set text color ${color}`}
              />
            ))}
          </div>
        )}
      </div>

      <span className="dock-divider" />

      <DockIcon mouseX={mouseX} label="Align left" active={formats.justifyLeft} onClick={() => exec('justifyLeft')}>
        <AlignIcon variant="left" />
      </DockIcon>
      <DockIcon mouseX={mouseX} label="Align center" active={formats.justifyCenter} onClick={() => exec('justifyCenter')}>
        <AlignIcon variant="center" />
      </DockIcon>
      <DockIcon mouseX={mouseX} label="Align right" active={formats.justifyRight} onClick={() => exec('justifyRight')}>
        <AlignIcon variant="right" />
      </DockIcon>

      <span className="dock-divider" />

      <div className="dock-color-wrap">
        <DockIcon mouseX={mouseX} label={copied ? 'Copied' : 'Copy text'} onClick={handleCopy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </DockIcon>
        <AnimatePresence>
          {copied && (
            <motion.span
              className="dock-copied-tooltip"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            >
              Copied
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

interface DockIconProps {
  mouseX: ReturnType<typeof useMotionValue<number>>
  label: string
  active?: boolean
  onClick: () => void
  children: ReactNode
}

function DockIcon({ mouseX, label, active, onClick, children }: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null)

  const distance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return Infinity
    return val - (rect.left + rect.width / 2)
  })
  const scale = useTransform(distance, [-58, 0, 58], [1, 1.55, 1])
  const smoothScale = useSpring(1, { mass: 0.15, stiffness: 260, damping: 16 })

  useEffect(() => {
    return scale.on('change', (latest) => smoothScale.set(latest))
  }, [scale, smoothScale])

  return (
    <motion.button
      type="button"
      ref={ref}
      title={label}
      aria-label={label}
      className={['dock-icon', active ? 'active' : ''].filter(Boolean).join(' ')}
      style={{ scale: smoothScale }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}

function LinkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M9.5 14.5L14.5 9.5" />
      <path d="M11 6.5l1.4-1.4a3.5 3.5 0 015 5L16 11.5" />
      <path d="M13 17.5l-1.4 1.4a3.5 3.5 0 01-5-5L8 12.5" />
    </svg>
  )
}

function HighlightIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 20h12" />
      <path d="M9.5 15.5L16 9a2 2 0 00-3-3L6.5 12.5 5 17z" />
      <path d="M13.5 6.5l3 3" />
    </svg>
  )
}

function PaletteIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 8.5 0 100 17c1.2 0 1.8-.7 1.8-1.6 0-.4-.2-.8-.4-1.1-.2-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6h1.9A4.1 4 0 0021 10.6C21 6.4 17 3 12 3z" />
      <circle cx="7.3" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.3" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="7.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function AlignIcon({ variant }: { variant: 'left' | 'center' | 'right' }) {
  const widths = variant === 'left' ? [17, 13, 10] : variant === 'center' ? [17, 12, 15] : [17, 10, 13]
  const align = variant === 'left' ? 3 : variant === 'center' ? 'center' : 'right'

  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      {widths.map((w, i) => {
        const y = 6 + i * 4
        const x1 = align === 3 ? 3 : align === 'center' ? 10 - w / 2 : 17 - w
        const x2 = x1 + w
        return <line key={y} x1={x1} y1={y} x2={x2} y2={y} />
      })}
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}
