import { renderStrokes } from '../render/strokeRenderer'
import {
  buildReplayFrames,
  DEFAULT_REPLAY_OPTIONS,
  type ReplayOptions,
} from '../render/replay'
import type { Project } from '../model/project'
import {
  computeStrokeBounds,
  fitBoundsToCanvas,
  transformStroke,
} from './worldBounds'

export type ExportResolution = '1920x1080' | '3840x2160'

const RESOLUTIONS: Record<ExportResolution, { width: number; height: number }> =
  {
    '1920x1080': { width: 1920, height: 1080 },
    '3840x2160': { width: 3840, height: 2160 },
  }

export interface PngSequenceResult {
  frameCount: number
  width: number
  height: number
  delivery: 'folder' | 'zip'
}

export interface ExportProgress {
  frame: number
  total: number
}

function padFrameName(index: number): string {
  return `frame_${String(index + 1).padStart(6, '0')}.png`
}

async function canvasToPngBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return (canvas as OffscreenCanvas).convertToBlob({ type: 'image/png' })
  }
  return new Promise((resolve, reject) => {
    ;(canvas as HTMLCanvasElement).toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('Failed to encode PNG'))
    }, 'image/png')
  })
}

function createExportCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return c
}

async function drawTemplate(
  ctx: RenderContext,
  project: Project,
  width: number,
  height: number,
): Promise<void> {
  if (!project.templateSvg) {
    return
  }
  const blob = new Blob([project.templateSvg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load template SVG'))
      img.src = url
    })
    ctx.save()
    ctx.globalAlpha = project.templateOpacity ?? 0.25
    ctx.drawImage(img, 0, 0, width, height)
    ctx.restore()
  } finally {
    URL.revokeObjectURL(url)
  }
}

import type { RenderContext } from '../render/strokeRenderer'

export async function renderFrameToCanvas(
  ctx: RenderContext,
  project: Project,
  frameStrokes: ReturnType<typeof buildReplayFrames>[0]['strokes'],
  width: number,
  height: number,
): Promise<void> {
  ctx.clearRect(0, 0, width, height)
  await drawTemplate(ctx, project, width, height)
  const bounds = computeStrokeBounds(project.strokes)
  if (!bounds) {
    return
  }
  const fit = fitBoundsToCanvas(bounds, width, height)
  const scaled = frameStrokes.map((s) =>
    transformStroke({ ...s, width: s.width * fit.scale }, fit),
  )
  renderStrokes(ctx, scaled)
}

export async function exportPngSequence(
  project: Project,
  resolution: ExportResolution,
  options: Partial<ReplayOptions> = {},
  onProgress?: (p: ExportProgress) => void,
): Promise<PngSequenceResult> {
  const { width, height } = RESOLUTIONS[resolution]
  const replayOpts = { ...DEFAULT_REPLAY_OPTIONS, ...options }
  const frames = buildReplayFrames(project, replayOpts)

  if (resolution === '3840x2160' && isMobileSafari()) {
    console.warn(
      '4K in-browser export may be slow or run out of memory on Safari. Prefer desktop Chrome or the local encoder.',
    )
  }

  const blobs: { name: string; blob: Blob }[] = []
  for (let i = 0; i < frames.length; i++) {
    const canvas = createExportCanvas(width, height)
    const ctx = canvas.getContext('2d')!
    await renderFrameToCanvas(ctx, project, frames[i].strokes, width, height)
    const blob = await canvasToPngBlob(canvas)
    blobs.push({ name: padFrameName(i), blob })
    onProgress?.({ frame: i + 1, total: frames.length })
  }

  const canFolder =
    typeof window.showDirectoryPicker === 'function' &&
    !isMobileSafari()

  if (canFolder) {
    const dir = await window.showDirectoryPicker!({
      mode: 'readwrite',
      startIn: 'downloads',
    })
    for (const { name, blob } of blobs) {
      const handle = await dir.getFileHandle(name, { create: true })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
    }
    return {
      frameCount: blobs.length,
      width,
      height,
      delivery: 'folder',
    }
  }

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  for (const { name, blob } of blobs) {
    zip.file(name, blob)
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `molapse-frames-${resolution}.zip`
  a.click()
  URL.revokeObjectURL(url)

  return {
    frameCount: blobs.length,
    width,
    height,
    delivery: 'zip',
  }
}

function isMobileSafari(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
}

export function getResolutionPixels(resolution: ExportResolution): {
  width: number
  height: number
} {
  return RESOLUTIONS[resolution]
}
