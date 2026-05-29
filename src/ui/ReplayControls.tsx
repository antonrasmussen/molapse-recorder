import { useEffect, useRef, useState } from 'react'
import {
  buildReplayFrames,
  DEFAULT_REPLAY_OPTIONS,
  totalDurationMs,
  type ReplayOptions,
} from '../render/replay'
import type { Project } from '../model/project'

export interface ReplayControlsProps {
  project: Project | null
  options?: Partial<ReplayOptions>
  onFrameChange?: (frameIndex: number) => void
}

export function ReplayControls({
  project,
  options = {},
  onFrameChange,
}: ReplayControlsProps) {
  const replayOpts = { ...DEFAULT_REPLAY_OPTIONS, ...options }
  const [playing, setPlaying] = useState(false)
  const [frameIndex, setFrameIndex] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)

  const frames = project ? buildReplayFrames(project, replayOpts) : []
  const duration = project
    ? totalDurationMs(project.strokes, replayOpts.maxIdleGapMs)
    : 0
  const maxIndex = Math.max(0, frames.length - 1)

  useEffect(() => {
    if (!playing || frames.length === 0) {
      return
    }
    lastTickRef.current = performance.now()
    const step = () => {
      const now = performance.now()
      const dt = now - lastTickRef.current
      lastTickRef.current = now
      const msPerFrame = 1000 / replayOpts.fps
      const advance = dt / msPerFrame
      setFrameIndex((i) => {
        const next = i + advance
        if (next >= maxIndex) {
          setPlaying(false)
          onFrameChange?.(maxIndex)
          return maxIndex
        }
        const idx = Math.floor(next)
        onFrameChange?.(idx)
        return idx
      })
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [playing, frames.length, maxIndex, replayOpts.fps])

  if (!project || project.strokes.length === 0) {
    return (
      <section className="replay-controls replay-controls--empty">
        <p>Draw strokes to enable replay.</p>
      </section>
    )
  }

  return (
    <section className="replay-controls" aria-label="Replay">
      <div className="replay-controls__row">
        <button
          type="button"
          onClick={() => {
            if (playing) {
              setPlaying(false)
            } else {
              if (frameIndex >= maxIndex) {
                setFrameIndex(0)
                onFrameChange?.(0)
              }
              onFrameChange?.(frameIndex >= maxIndex ? 0 : frameIndex)
              setPlaying(true)
            }
          }}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false)
            setFrameIndex(0)
            onFrameChange?.(0)
          }}
        >
          Reset
        </button>
        <span className="replay-controls__time">
          {(duration / 1000).toFixed(1)}s · {frames.length} frames
        </span>
      </div>
      <label className="replay-controls__scrub">
        Scrub
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={Math.min(frameIndex, maxIndex)}
          onChange={(e) => {
            setPlaying(false)
            const idx = Number(e.target.value)
            setFrameIndex(idx)
            onFrameChange?.(idx)
          }}
        />
      </label>
    </section>
  )
}

export { buildReplayFrames }
