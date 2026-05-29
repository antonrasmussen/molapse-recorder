import { getStroke } from 'perfect-freehand'
import type { Point, Stroke } from '../model/stroke'

export interface StrokeRenderOptions {
  size: number
  thinning?: number
  smoothing?: number
  streamline?: number
}

const DEFAULT_RENDER_OPTIONS: StrokeRenderOptions = {
  size: 4,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
}

function pointsToFreehandInput(points: Point[]): number[][] {
  return points.map((p) => [p.x, p.y, p.pressure])
}

/** Closed polygon outline from perfect-freehand point list. */
export function getStrokeOutline(
  points: Point[],
  options: StrokeRenderOptions,
): number[][] {
  if (points.length === 0) {
    return []
  }
  const size = options.size
  return getStroke(pointsToFreehandInput(points), {
    size,
    thinning: options.thinning ?? DEFAULT_RENDER_OPTIONS.thinning,
    smoothing: options.smoothing ?? DEFAULT_RENDER_OPTIONS.smoothing,
    streamline: options.streamline ?? DEFAULT_RENDER_OPTIONS.streamline,
  }) as number[][]
}

function drawOutline(
  ctx: CanvasRenderingContext2D,
  outline: number[][],
  color: string,
): void {
  if (outline.length < 2) {
    return
  }
  ctx.fillStyle = color
  ctx.beginPath()
  const [first, ...rest] = outline
  ctx.moveTo(first[0], first[1])
  for (const [x, y] of rest) {
    ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

/** Draw one stroke in world coordinates (apply viewport on the context first). */
export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Pick<Stroke, 'color' | 'width' | 'points'>,
): void {
  if (stroke.points.length === 0) {
    return
  }
  const outline = getStrokeOutline(stroke.points, { size: stroke.width })
  drawOutline(ctx, outline, stroke.color)
}

/** Draw all strokes in world space. */
export function renderStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: readonly Pick<Stroke, 'color' | 'width' | 'points'>[],
): void {
  for (const stroke of strokes) {
    renderStroke(ctx, stroke)
  }
}
