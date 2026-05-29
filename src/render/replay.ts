import type { Point, Stroke } from '../model/stroke'
import type { Project } from '../model/project'

export const DEFAULT_IDLE_GAP_MS = 500
export const DEFAULT_FPS = 30

export interface ReplayOptions {
  fps: number
  /** Max pause between strokes in exported timeline (ms). */
  maxIdleGapMs: number
}

export const DEFAULT_REPLAY_OPTIONS: ReplayOptions = {
  fps: DEFAULT_FPS,
  maxIdleGapMs: DEFAULT_IDLE_GAP_MS,
}

export interface PartialStroke {
  id: string
  tool: Stroke['tool']
  color: string
  width: number
  points: Point[]
}

export interface ReplayFrame {
  index: number
  /** Replay clock in adjusted timeline (ms). */
  timeMs: number
  strokes: PartialStroke[]
}

function strokeEndTime(stroke: Stroke): number {
  if (stroke.points.length === 0) {
    return stroke.startTime
  }
  const lastT = stroke.points[stroke.points.length - 1].t
  return stroke.startTime + lastT
}

/**
 * Compress idle gaps between strokes for export/replay timing.
 */
export function buildAdjustedStrokeStarts(
  strokes: readonly Stroke[],
  maxIdleGapMs: number,
): Map<string, number> {
  const adjusted = new Map<string, number>()
  if (strokes.length === 0) {
    return adjusted
  }
  let cursor = strokes[0].startTime
  adjusted.set(strokes[0].id, cursor)
  for (let i = 1; i < strokes.length; i++) {
    const prev = strokes[i - 1]
    const curr = strokes[i]
    const prevEnd = strokeEndTime(prev)
    const rawGap = curr.startTime - prevEnd
    const gap = rawGap > maxIdleGapMs ? maxIdleGapMs : Math.max(0, rawGap)
    cursor += gap
    adjusted.set(curr.id, cursor)
  }
  return adjusted
}

export function totalDurationMs(
  strokes: readonly Stroke[],
  maxIdleGapMs: number,
): number {
  if (strokes.length === 0) {
    return 0
  }
  const starts = buildAdjustedStrokeStarts(strokes, maxIdleGapMs)
  const last = strokes[strokes.length - 1]
  const lastStart = starts.get(last.id) ?? last.startTime
  const lastLocalT =
    last.points.length > 0 ? last.points[last.points.length - 1].t : 0
  return lastStart + lastLocalT
}

export function frameCount(durationMs: number, fps: number): number {
  if (durationMs <= 0) {
    return 1
  }
  return Math.max(1, Math.round((durationMs / 1000) * fps))
}

function sliceStrokeAtLocalTime(stroke: Stroke, localT: number): PartialStroke | null {
  if (localT < 0) {
    return null
  }
  const visible: Point[] = []
  for (const p of stroke.points) {
    if (p.t <= localT) {
      visible.push(p)
    } else {
      break
    }
  }
  if (visible.length === 0) {
    return null
  }
  const last = visible[visible.length - 1]
  const next = stroke.points.find((p) => p.t > last.t)
  if (next && localT > last.t && localT < next.t) {
    const span = next.t - last.t
    const u = span > 0 ? (localT - last.t) / span : 1
    visible.push({
      x: last.x + (next.x - last.x) * u,
      y: last.y + (next.y - last.y) * u,
      t: localT,
      pressure: last.pressure + (next.pressure - last.pressure) * u,
    })
  }
  return {
    id: stroke.id,
    tool: stroke.tool,
    color: stroke.color,
    width: stroke.width,
    points: visible,
  }
}

export function buildReplayFrame(
  strokes: readonly Stroke[],
  adjustedStarts: Map<string, number>,
  timeMs: number,
  frameIndex: number,
): ReplayFrame {
  const partials: PartialStroke[] = []
  for (const stroke of strokes) {
    const start = adjustedStarts.get(stroke.id) ?? stroke.startTime
    const localT = timeMs - start
    const partial = sliceStrokeAtLocalTime(stroke, localT)
    if (partial) {
      partials.push(partial)
    }
  }
  return { index: frameIndex, timeMs, strokes: partials }
}

export function buildReplayFrames(
  project: Pick<Project, 'strokes'>,
  options: ReplayOptions = DEFAULT_REPLAY_OPTIONS,
): ReplayFrame[] {
  const { strokes } = project
  const duration = totalDurationMs(strokes, options.maxIdleGapMs)
  const count = frameCount(duration, options.fps)
  const adjusted = buildAdjustedStrokeStarts(strokes, options.maxIdleGapMs)
  const frames: ReplayFrame[] = []
  for (let i = 0; i < count; i++) {
    const timeMs =
      count <= 1 ? duration : (i / (count - 1)) * duration
    frames.push(buildReplayFrame(strokes, adjusted, timeMs, i))
  }
  return frames
}

/** Monotonic check: later frames never show fewer points per stroke. */
export function isMonotonicReveal(frames: ReplayFrame[]): boolean {
  const pointCounts = new Map<string, number>()
  for (const frame of frames) {
    for (const s of frame.strokes) {
      const prev = pointCounts.get(s.id) ?? 0
      if (s.points.length < prev) {
        return false
      }
      pointCounts.set(s.id, s.points.length)
    }
  }
  return true
}
