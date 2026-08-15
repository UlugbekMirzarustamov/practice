import type { Mode } from '../types/session'

export interface PortfolioSession {
  topic: string
  mode: Mode
  content: string
  durationMinutes: number
  createdAt: string
}

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 72
const CONTENT_W = PAGE_W - MARGIN * 2

function escapePdfText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/** Standard PDF fonts only support Latin-1/WinAnsi — normalize common smart punctuation, drop anything else out of range. */
function sanitizeForPdf(s: string): string {
  const normalized = s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
  let out = ''
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i)
    out += code >= 32 && code <= 255 ? normalized[i] : '?'
  }
  return out
}

/** Rough per-glyph width estimate (em fractions) for Times-Roman/Bold, good enough for non-overlapping wraps without embedding AFM metrics. */
function charWidthEm(ch: string, bold: boolean): number {
  if (ch === ' ') return 0.25
  if ('iljtfI.,:;\'!'.includes(ch)) return 0.28
  if (/[A-Z]/.test(ch)) return bold ? 0.74 : 0.7
  if (/[0-9]/.test(ch)) return 0.5
  if (/[a-z]/.test(ch)) return bold ? 0.52 : 0.46
  return 0.42
}

function textWidth(text: string, size: number, bold: boolean): number {
  let w = 0
  for (let i = 0; i < text.length; i++) w += charWidthEm(text[i], bold) * size
  return w
}

function wrapText(text: string, maxWidth: number, size: number, bold: boolean): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (current && textWidth(test, size, bold) > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function stringToLatin1Bytes(s: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff
  return bytes
}

/** Builds the raw PDF byte stream from a flat list of per-page content-stream op arrays. */
function assemblePdf(pagesOps: string[][]): Blob {
  const FONT_R = 3
  const FONT_B = 4
  const FONT_I = 5
  let nextObjNum = 6

  const pageObjNums: number[] = []
  const contentObjNums: number[] = []
  const pageBodies: string[] = []
  const contentBodies: string[] = []

  for (const ops of pagesOps) {
    const pageObjNum = nextObjNum++
    const contentObjNum = nextObjNum++
    pageObjNums.push(pageObjNum)
    contentObjNums.push(contentObjNum)
    const stream = ops.join('\n')
    contentBodies.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    pageBodies.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 ${FONT_R} 0 R /F2 ${FONT_B} 0 R /F3 ${FONT_I} 0 R >> >> ` +
        `/Contents ${contentObjNum} 0 R >>`,
    )
  }

  const kids = pageObjNums.map((n) => `${n} 0 R`).join(' ')
  const objects: string[] = []
  objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`
  objects[1] = `<< /Type /Pages /Kids [${kids}] /Count ${pageObjNums.length} >>`
  objects[2] = `<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>`
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>`
  objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>`
  for (let i = 0; i < pageObjNums.length; i++) {
    objects[pageObjNums[i] - 1] = pageBodies[i]
    objects[contentObjNums[i] - 1] = contentBodies[i]
  }

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return new Blob([stringToLatin1Bytes(pdf)], { type: 'application/pdf' })
}

/** A single classical-styled, Times-set PDF: cover (handle + generated date) followed by each session's topic, meta, and full content. */
export function generatePortfolioPdf(handle: string, sessions: PortfolioSession[]): Blob {
  const pagesOps: string[][] = []
  let ops: string[] = []
  let y = PAGE_H - MARGIN

  const newPage = () => {
    pagesOps.push(ops)
    ops = []
    y = PAGE_H - MARGIN
  }

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) newPage()
  }

  const drawText = (str: string, size: number, font: 'F1' | 'F2' | 'F3', gray = 0) => {
    if (gray !== 0) ops.push(`${gray} g`)
    ops.push(`BT /${font} ${size} Tf ${MARGIN.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(str)}) Tj ET`)
    if (gray !== 0) ops.push('0 g')
  }

  const drawRule = () => {
    ops.push(`0.75 G ${MARGIN.toFixed(2)} ${y.toFixed(2)} m ${(PAGE_W - MARGIN).toFixed(2)} ${y.toFixed(2)} l S 0 G`)
  }

  // Cover
  y -= 46
  drawText('BEMA', 13, 'F2', 0.35)
  y -= 32
  drawText('Practice Portfolio', 26, 'F2')
  y -= 24
  drawText(`@${sanitizeForPdf(handle)}`, 13, 'F3', 0.35)
  y -= 18
  drawText(`Generated ${new Date().toLocaleDateString()}`, 10, 'F1', 0.5)
  y -= 22
  drawRule()
  y -= 34

  sessions.forEach((s, idx) => {
    if (idx > 0) {
      ensureSpace(50)
      y -= 6
    }

    const modeLabel = s.mode === 'writing' ? 'Writing' : 'Speaking'
    const topicLines = wrapText(sanitizeForPdf(s.topic), CONTENT_W, 15, true)
    for (const line of topicLines) {
      ensureSpace(20)
      drawText(line, 15, 'F2')
      y -= 19
    }

    ensureSpace(16)
    const meta = `${modeLabel}  ·  ${new Date(s.createdAt).toLocaleDateString()}  ·  ${s.durationMinutes} min`
    drawText(sanitizeForPdf(meta), 10, 'F3', 0.45)
    y -= 22

    const paragraphs = s.content.trim() ? s.content.trim().split(/\n+/) : ['No content captured.']
    for (const para of paragraphs) {
      const lines = wrapText(sanitizeForPdf(para), CONTENT_W, 11, false)
      for (const line of lines) {
        ensureSpace(16)
        drawText(line, 11, 'F1')
        y -= 15
      }
      y -= 6
    }

    ensureSpace(10)
    y -= 10
    drawRule()
    y -= 4
  })

  pagesOps.push(ops)
  return assemblePdf(pagesOps)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
