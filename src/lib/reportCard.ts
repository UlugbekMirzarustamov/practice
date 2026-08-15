import type { Mode } from '../types/session'
import { ieltsPartLabel, type IeltsPart } from '../data/ielts'

export interface ReportCardData {
  topic: string
  mode: Mode
  ieltsPart?: IeltsPart
  xpEarned: number
  streak: number
}

const WIDTH = 1080
const HEIGHT = 1920

const PALETTE = {
  bg: '#0b0a0d',
  bgElevated: '#151319',
  bgElevated2: '#1d1a22',
  border: '#2c2733',
  text: '#f3ede4',
  textMuted: '#948d99',
  accent: '#e2984a',
  accentStrong: '#f0ab5e',
  growth: '#5fae7a',
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawColumn(ctx: CanvasRenderingContext2D, x: number, flip: boolean) {
  const dir = flip ? -1 : 1
  ctx.save()
  ctx.strokeStyle = PALETTE.border
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.55
  // capital
  ctx.strokeRect(x - 22, 90, 44 * dir, 26)
  // base
  ctx.strokeRect(x - 22, HEIGHT - 116, 44 * dir, 26)
  // fluting
  for (let i = -14; i <= 14; i += 7) {
    ctx.beginPath()
    ctx.moveTo(x + i, 118)
    ctx.lineTo(x + i, HEIGHT - 118)
    ctx.stroke()
  }
  ctx.restore()
}

function drawLaurel(ctx: CanvasRenderingContext2D, centerX: number, y: number) {
  ctx.save()
  ctx.strokeStyle = PALETTE.accent
  ctx.lineWidth = 2.5
  ctx.globalAlpha = 0.8
  for (const dir of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(centerX, y)
    ctx.quadraticCurveTo(centerX + dir * 70, y - 10, centerX + dir * 130, y + 6)
    ctx.stroke()
    for (let i = 0; i < 4; i++) {
      const t = 0.3 + i * 0.18
      const lx = centerX + dir * 130 * t
      const ly = y - 10 * (1 - t) + 6 * t
      ctx.beginPath()
      ctx.ellipse(lx, ly, 10, 5, dir * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

/** Renders a 1080x1920 vertical share image (topic, mode, XP, streak, Bema branding) matching the site's dark, classical style. */
export async function generateReportCardCanvas(data: ReportCardData): Promise<HTMLCanvasElement> {
  await Promise.all([
    document.fonts.load('800 56px "Bricolage Grotesque"'),
    document.fonts.load('italic 700 64px "Playfair Display"'),
    document.fonts.load('800 140px "Bricolage Grotesque"'),
    document.fonts.load('600 30px "IBM Plex Mono"'),
  ]).catch(() => {})
  await document.fonts.ready.catch(() => {})

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const centerX = WIDTH / 2

  // background
  const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  bgGrad.addColorStop(0, PALETTE.bg)
  bgGrad.addColorStop(1, PALETTE.bgElevated2)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const glow = ctx.createRadialGradient(centerX, 420, 40, centerX, 420, 620)
  glow.addColorStop(0, 'rgba(226, 152, 74, 0.16)')
  glow.addColorStop(1, 'rgba(226, 152, 74, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  drawColumn(ctx, 80, false)
  drawColumn(ctx, WIDTH - 80, true)

  // wordmark
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = PALETTE.accentStrong
  ctx.font = '800 52px "Bricolage Grotesque"'
  ctx.fillText('BEMA', centerX, 190)

  ctx.strokeStyle = PALETTE.accent
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(centerX - 80, 225)
  ctx.lineTo(centerX + 80, 225)
  ctx.stroke()

  // mode pill
  const pillLabel = data.ieltsPart
    ? `IELTS ${ieltsPartLabel(data.ieltsPart).toUpperCase()}`
    : data.mode === 'writing'
      ? 'WRITING SESSION'
      : 'SPEAKING SESSION'
  ctx.font = '600 26px "IBM Plex Mono"'
  const pillTextWidth = ctx.measureText(pillLabel).width
  const pillW = pillTextWidth + 72
  const pillH = 58
  const pillY = 310
  ctx.fillStyle = PALETTE.bgElevated
  ctx.strokeStyle = PALETTE.border
  ctx.lineWidth = 1.5
  roundRect(ctx, centerX - pillW / 2, pillY, pillW, pillH, pillH / 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = PALETTE.accentStrong
  ctx.fillText(pillLabel, centerX, pillY + pillH / 2 + 9)

  // topic, auto-shrink to fit within the box
  const topicBoxTop = 460
  const topicBoxBottom = 980
  const topicMaxWidth = WIDTH - 320
  let topicFontSize = 66
  let topicLines: string[] = []
  ctx.fillStyle = PALETTE.text
  while (topicFontSize > 38) {
    ctx.font = `italic 700 ${topicFontSize}px "Playfair Display"`
    topicLines = wrapLines(ctx, data.topic, topicMaxWidth)
    if (topicLines.length * (topicFontSize * 1.28) <= topicBoxBottom - topicBoxTop) break
    topicFontSize -= 4
  }
  const lineHeight = topicFontSize * 1.28
  const totalTextHeight = topicLines.length * lineHeight
  let ty = (topicBoxTop + topicBoxBottom) / 2 - totalTextHeight / 2 + topicFontSize * 0.8
  ctx.font = `italic 700 ${topicFontSize}px "Playfair Display"`
  for (const line of topicLines) {
    ctx.fillText(line, centerX, ty)
    ty += lineHeight
  }

  drawLaurel(ctx, centerX, 1040)

  // stats row
  const statY = 1260
  const statXs = [centerX - 220, centerX + 220]
  const statValues = [String(data.xpEarned), String(data.streak)]
  const statLabels = ['XP EARNED', 'STREAK TODAY']
  for (let i = 0; i < 2; i++) {
    ctx.font = '800 120px "Bricolage Grotesque"'
    ctx.fillStyle = i === 0 ? PALETTE.accentStrong : PALETTE.growth
    ctx.fillText(statValues[i], statXs[i], statY)
    ctx.font = '600 28px "IBM Plex Mono"'
    ctx.fillStyle = PALETTE.textMuted
    ctx.fillText(statLabels[i], statXs[i], statY + 50)
  }
  ctx.strokeStyle = PALETTE.border
  ctx.beginPath()
  ctx.moveTo(centerX, statY - 130)
  ctx.lineTo(centerX, statY + 60)
  ctx.stroke()

  // footer
  ctx.strokeStyle = PALETTE.border
  ctx.beginPath()
  ctx.moveTo(centerX - 100, 1760)
  ctx.lineTo(centerX + 100, 1760)
  ctx.stroke()
  ctx.font = '600 30px "IBM Plex Mono"'
  ctx.fillStyle = PALETTE.text
  ctx.fillText('writeonbema.com', centerX, 1820)
  ctx.font = '400 24px "IBM Plex Mono"'
  ctx.fillStyle = PALETTE.textMuted
  ctx.fillText('Practice under the clock.', centerX, 1860)

  return canvas
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export async function canShareCanvas(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return false
  const testFile = new File([new Uint8Array([1])], 'test.png', { type: 'image/png' })
  try {
    return navigator.canShare({ files: [testFile] })
  } catch {
    return false
  }
}

export async function shareCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob = await canvasToBlob(canvas)
  if (!blob) return
  const file = new File([blob], filename, { type: 'image/png' })
  await navigator.share({ files: [file], title: 'Bema session', text: 'My Bema practice session' })
}
