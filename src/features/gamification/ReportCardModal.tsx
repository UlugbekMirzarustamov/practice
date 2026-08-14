import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  generateReportCardCanvas,
  downloadCanvas,
  canShareCanvas,
  shareCanvas,
  type ReportCardData,
} from '../../lib/reportCard'
import { Button } from '../../components/Button'

interface ReportCardModalProps {
  data: ReportCardData
  onClose: () => void
}

function filenameFor(topic: string): string {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `bema-${slug || 'session'}.png`
}

export function ReportCardModal({ data, onClose }: ReportCardModalProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ready, setReady] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    generateReportCardCanvas(data).then((canvas) => {
      if (cancelled) return
      canvasRef.current = canvas
      canvas.className = 'report-card-canvas'
      previewRef.current?.replaceChildren(canvas)
      setReady(true)
    })
    canShareCanvas().then((v) => {
      if (!cancelled) setCanShare(v)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = () => {
    if (!canvasRef.current) return
    downloadCanvas(canvasRef.current, filenameFor(data.topic))
  }

  const handleShare = async () => {
    if (!canvasRef.current) return
    setBusy(true)
    try {
      await shareCanvas(canvasRef.current, filenameFor(data.topic))
    } catch {
      // user cancelled the share sheet, or it failed silently; nothing to recover
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div className="report-card-overlay" role="dialog" aria-label="Share your session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="report-card-modal"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        <button type="button" className="report-card-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className="report-card-preview-wrap">
          {!ready && <span className="lede">Rendering...</span>}
          <div ref={previewRef} className="report-card-preview" />
        </div>
        <div className="option-row" style={{ maxWidth: 320 }}>
          <Button variant="primary" onClick={handleDownload} disabled={!ready}>
            Download
          </Button>
          {canShare && (
            <Button onClick={handleShare} disabled={!ready || busy}>
              {busy ? 'Sharing...' : 'Share'}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
