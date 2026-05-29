import { useState } from 'react'
import { exportPngSequence, type ExportResolution } from '../export/pngSequence'
import { tryEncodeMp4Preview, downloadMp4 } from '../export/mp4Preview'
import { buildReplayFrames, DEFAULT_REPLAY_OPTIONS } from '../render/replay'
import { renderFrameToCanvas } from '../export/pngSequence'
import type { Project } from '../model/project'
import { getResolutionPixels } from '../export/pngSequence'

export interface ExportPanelProps {
  project: Project | null
}

export function ExportPanel({ project }: ExportPanelProps) {
  const [resolution, setResolution] = useState<ExportResolution>('1920x1080')
  const [fps, setFps] = useState(DEFAULT_REPLAY_OPTIONS.fps)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [ffmpegHint, setFfmpegHint] = useState<string | null>(null)

  const runPngExport = async () => {
    if (!project || project.strokes.length === 0) {
      setStatus('Nothing to export.')
      return
    }
    setBusy(true)
    setStatus('Exporting PNG sequence…')
    setFfmpegHint(null)
    try {
      const result = await exportPngSequence(
        project,
        resolution,
        { fps, maxIdleGapMs: DEFAULT_REPLAY_OPTIONS.maxIdleGapMs },
        (p) => setStatus(`Rendering frame ${p.frame}/${p.total}…`),
      )
      setStatus(
        `Done: ${result.frameCount} frames at ${result.width}×${result.height} (${result.delivery === 'folder' ? 'saved to folder' : 'downloaded zip'}).`,
      )
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  const runMp4Preview = async () => {
    if (!project || project.strokes.length === 0) {
      return
    }
    setBusy(true)
    setStatus('Building MP4 preview…')
    try {
      const { width, height } = getResolutionPixels('1920x1080')
      const frames = buildReplayFrames(project, {
        fps,
        maxIdleGapMs: DEFAULT_REPLAY_OPTIONS.maxIdleGapMs,
      })
      const blobs: Blob[] = []
      const canvas =
        typeof OffscreenCanvas !== 'undefined'
          ? new OffscreenCanvas(width, height)
          : document.createElement('canvas')
      if (canvas instanceof HTMLCanvasElement) {
        canvas.width = width
        canvas.height = height
      }
      const ctx = canvas.getContext('2d')!
      for (const frame of frames) {
        await renderFrameToCanvas(ctx, project, frame.strokes, width, height)
        if ('convertToBlob' in canvas) {
          blobs.push(
            await (canvas as OffscreenCanvas).convertToBlob({
              type: 'image/png',
            }),
          )
        } else {
          blobs.push(
            await new Promise<Blob>((res, rej) =>
              (canvas as HTMLCanvasElement).toBlob(
                (b) => (b ? res(b) : rej(new Error('blob'))),
                'image/png',
              ),
            ),
          )
        }
      }
      const result = await tryEncodeMp4Preview(blobs, fps)
      if (result.method === 'webcodecs' && result.blob) {
        downloadMp4(result.blob)
        setStatus('MP4 preview downloaded.')
      } else {
        setFfmpegHint(result.ffmpegCommand ?? null)
        setStatus('WebCodecs unavailable — use FFmpeg command below.')
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'MP4 preview failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="export-panel" aria-label="Export">
      <h2 className="export-panel__title">Export</h2>
      <label className="export-panel__field">
        Resolution
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value as ExportResolution)}
          disabled={busy}
        >
          <option value="1920x1080">1920×1080</option>
          <option value="3840x2160">3840×2160 (4K)</option>
        </select>
      </label>
      <label className="export-panel__field">
        FPS
        <input
          type="number"
          min={1}
          max={60}
          value={fps}
          onChange={(e) => setFps(Number(e.target.value))}
          disabled={busy}
        />
      </label>
      <div className="export-panel__actions">
        <button type="button" onClick={runPngExport} disabled={busy}>
          Export PNG sequence
        </button>
        <button type="button" onClick={runMp4Preview} disabled={busy}>
          MP4 preview
        </button>
      </div>
      {status && <p className="export-panel__status">{status}</p>}
      {ffmpegHint && (
        <pre className="export-panel__hint" aria-label="FFmpeg command">
          {ffmpegHint}
        </pre>
      )}
    </section>
  )
}
